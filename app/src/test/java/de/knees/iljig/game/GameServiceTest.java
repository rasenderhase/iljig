package de.knees.iljig.game;

import de.knees.iljig.model.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GameServiceTest {

    @Test
    void testCreateGame() {
        GameService gameService = new GameService();
        GameCreatedResponse game = gameService.createGame();

        assertNotNull(game.getPin());
        assertEquals(4, game.getPin().length());
        assertNotNull(game.getSecret());
    }

    @Test
    void testJoinGame() {
        GameService gameService = new GameService();
        GameCreatedResponse created = gameService.createGame();

        var responseOpt = gameService.joinGame(created.getPin(), "Alice", null);

        assertTrue(responseOpt.isPresent());
        JoinGameResponse response = responseOpt.get();
        assertNotNull(response.getPlayerId());
        GameStatus joinedGame = response.getGameStatus();
        assertEquals(1, joinedGame.getPlayers().size());
        assertEquals("Alice", joinedGame.getPlayers().get(0).getName());
        assertTrue(joinedGame.getPlayers().get(0).getIsHost());
    }
    @Test
    void testStartGameAndCardDistribution() {
        GameService gameService = new GameService();
        GameCreatedResponse created = gameService.createGame();
        String pin = created.getPin();
        String hostSecret = created.getSecret();

        gameService.joinGame(pin, "Alice", hostSecret);
        gameService.joinGame(pin, "Bob", null);

        boolean started = gameService.startGame(pin, hostSecret);
        assertTrue(started);

        GameStatus status = gameService.getGameStatus(pin).get();
        assertEquals(GameStatus.StatusEnum.STARTING, status.getStatus());

        // Check cards for Alice
        var aliceStatus = gameService.getPlayerGameStatus(pin, status.getPlayers().get(0).getId()).get();
        assertEquals(7, aliceStatus.getCards().size());
        assertEquals(1, aliceStatus.getPlayerHands().size());
        assertEquals(7, aliceStatus.getPlayerHands().get(0).getCardCount());
        assertEquals("Bob", aliceStatus.getPlayerHands().get(0).getPlayerName());
        
        // New fields
        assertNotNull(aliceStatus.getTrumpCard());
        assertNotNull(aliceStatus.getTrumpSuit());
        assertTrue(aliceStatus.getRemainingDeckCount() > 0);
        assertEquals(28, aliceStatus.getRemainingDeckCount());
        assertEquals(status.getPlayers().get(0).getId(), aliceStatus.getLeadingPlayerId());

        // Check cards for Bob
        var bobStatus = gameService.getPlayerGameStatus(pin, status.getPlayers().get(1).getId()).get();
        assertEquals(7, bobStatus.getCards().size());
        assertEquals(1, bobStatus.getPlayerHands().size());
        assertEquals(7, bobStatus.getPlayerHands().get(0).getCardCount());
        assertEquals("Alice", bobStatus.getPlayerHands().get(0).getPlayerName());
    }

    @Test
    void testCardDistributionScaling() {
        GameService gameService = new GameService();
        
        // 5 players -> 5 cards
        GameCreatedResponse created5 = gameService.createGame();
        for (int i = 0; i < 5; i++) gameService.joinGame(created5.getPin(), "P" + i, i == 0 ? created5.getSecret() : null);
        gameService.startGame(created5.getPin(), created5.getSecret());
        GameStatus status5 = gameService.getGameStatus(created5.getPin()).get();
        var p0Status5 = gameService.getPlayerGameStatus(created5.getPin(), status5.getPlayers().get(0).getId()).get();
        assertEquals(5, p0Status5.getCards().size());

        // 8 players -> 3 cards
        GameCreatedResponse created8 = gameService.createGame();
        for (int i = 0; i < 8; i++) gameService.joinGame(created8.getPin(), "P" + i, i == 0 ? created8.getSecret() : null);
        gameService.startGame(created8.getPin(), created8.getSecret());
        GameStatus status8 = gameService.getGameStatus(created8.getPin()).get();
        var p0Status8 = gameService.getPlayerGameStatus(created8.getPin(), status8.getPlayers().get(0).getId()).get();
        assertEquals(3, p0Status8.getCards().size());
    }

    @Test
    void testValidateLeadPlay() {
        GameService gameService = new GameService();
        Card c1 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._7);
        Card c2 = new Card().suit(Card.SuitEnum.CLUBS).rank(Card.RankEnum._7);
        Card c3 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._8);
        Card c4 = new Card().suit(Card.SuitEnum.DIAMONDS).rank(Card.RankEnum._8);
        Card c5 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._9);

        // 1 card - valid
        assertTrue(gameService.validateLeadPlay(java.util.List.of(c1), 7, 7, false));

        // 2 cards - invalid (even)
        assertFalse(gameService.validateLeadPlay(java.util.List.of(c1, c2), 7, 7, false));

        // 3 cards (pair + single) - valid
        assertTrue(gameService.validateLeadPlay(java.util.List.of(c1, c2, c3), 7, 7, false));

        // 3 cards (different ranks) - invalid
        assertFalse(gameService.validateLeadPlay(java.util.List.of(c1, c3, c5), 7, 7, false));

        // 5 cards (2 pairs + 1 single) - valid
        assertTrue(gameService.validateLeadPlay(java.util.List.of(c1, c2, c3, c4, c5), 7, 7, false));

        // Bounds (max 5 for initial 7)
        assertFalse(gameService.validateLeadPlay(java.util.List.of(c1, c2, c3, c4, c5, c5, c5), 7, 7, false));

        // Triple is valid (pair + single of same rank)
        assertTrue(gameService.validateLeadPlay(java.util.List.of(c1, c2, new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._7)), 7, 7, false));

        // Jokers are separate ranks
        Card j1 = new Card().suit(Card.SuitEnum.JOKER).rank(Card.RankEnum.RED);
        Card j2 = new Card().suit(Card.SuitEnum.JOKER).rank(Card.RankEnum.BLUE);
        // Joker pair + single
        assertTrue(gameService.validateLeadPlay(java.util.List.of(j1, j2, c1), 7, 7, false));
        // Joker cannot replace another card for a pair
        assertFalse(gameService.validateLeadPlay(java.util.List.of(j1, c1, c3), 7, 7, false));
    }

    @Test
    void testCanBeat() {
        GameService gameService = new GameService();
        Card h7 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._7);
        Card h8 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._8);
        Card s7 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._7);
        Card s8 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._8);
        Card d7 = new Card().suit(Card.SuitEnum.DIAMONDS).rank(Card.RankEnum._7);
        Card jBlue = new Card().suit(Card.SuitEnum.JOKER).rank(Card.RankEnum.BLUE);
        Card jRed = new Card().suit(Card.SuitEnum.JOKER).rank(Card.RankEnum.RED);

        // Same suit, higher rank
        assertTrue(gameService.canBeat(h8, h7, GameStatus.TrumpSuitEnum.CLUBS));
        assertFalse(gameService.canBeat(h7, h8, GameStatus.TrumpSuitEnum.CLUBS));

        // Different suit, non-trump
        assertFalse(gameService.canBeat(s7, h7, GameStatus.TrumpSuitEnum.CLUBS));

        // Trump beats non-trump
        assertTrue(gameService.canBeat(h7, s7, GameStatus.TrumpSuitEnum.HEARTS));
        assertFalse(gameService.canBeat(s7, h7, GameStatus.TrumpSuitEnum.HEARTS));

        // Joker beats anything non-joker
        assertTrue(gameService.canBeat(jBlue, h7, GameStatus.TrumpSuitEnum.HEARTS));
        assertTrue(gameService.canBeat(jBlue, s8, GameStatus.TrumpSuitEnum.CLUBS));

        // Joker beats joker
        assertTrue(gameService.canBeat(jRed, jBlue, GameStatus.TrumpSuitEnum.HEARTS));
        assertFalse(gameService.canBeat(jBlue, jRed, GameStatus.TrumpSuitEnum.HEARTS));
    }

    @Test
    void testCanBeatAll() {
        GameService gameService = new GameService();
        Card h7 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._7);
        Card h8 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._8);
        Card s7 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._7);
        Card s8 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._8);

        // Single beat
        assertTrue(gameService.canBeatAll(java.util.List.of(h8), java.util.List.of(h7), GameStatus.TrumpSuitEnum.CLUBS));

        // Multi beat
        assertTrue(gameService.canBeatAll(java.util.List.of(h8, s8), java.util.List.of(h7, s7), GameStatus.TrumpSuitEnum.CLUBS));
        assertTrue(gameService.canBeatAll(java.util.List.of(s8, h8), java.util.List.of(h7, s7), GameStatus.TrumpSuitEnum.CLUBS));

        // Fails if one cannot beat
        assertFalse(gameService.canBeatAll(java.util.List.of(h8, s7), java.util.List.of(h7, s8), GameStatus.TrumpSuitEnum.CLUBS));

        // Fails if sizes differ
        assertFalse(gameService.canBeatAll(java.util.List.of(h8, s8), java.util.List.of(h7), GameStatus.TrumpSuitEnum.CLUBS));
        assertFalse(gameService.canBeatAll(java.util.List.of(h8), java.util.List.of(h7, s7), GameStatus.TrumpSuitEnum.CLUBS));
    }

    @Test
    void testPlayCardsSubsequent() {
        GameService gameService = new GameService();
        GameCreatedResponse created = gameService.createGame();
        String pin = created.getPin();
        String hostSecret = created.getSecret();

        gameService.joinGame(pin, "Alice", hostSecret);
        gameService.joinGame(pin, "Bob", null);
        gameService.startGame(pin, hostSecret);

        // Manually set cards to ensure predictable test
        gameService.setGameStatus(pin, GameStatus.StatusEnum.IN_GAME);
        GameStatus game = gameService.getGameStatus(pin).get();
        String aliceId = game.getPlayers().get(0).getId();
        String bobId = game.getPlayers().get(1).getId();

        Card h7 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._7);
        Card h8 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._8);
        Card s7 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._7);
        Card s8 = new Card().suit(Card.SuitEnum.SPADES).rank(Card.RankEnum._8);
        Card d7 = new Card().suit(Card.SuitEnum.DIAMONDS).rank(Card.RankEnum._7);

        // Give Alice H7 and Bob H8
        gameService.setPlayerHand(pin, aliceId, new java.util.ArrayList<>(java.util.List.of(h7, s7)));
        gameService.setPlayerHand(pin, bobId, new java.util.ArrayList<>(java.util.List.of(h8, s8, d7)));
        
        // Alice leads with H7
        PlayCardsRequest aliceRequest = new PlayCardsRequest().playerId(aliceId).cards(java.util.List.of(h7));
        
        assertTrue(gameService.playCards(pin, aliceRequest));

        GameStatus status = gameService.getPlayerGameStatus(pin, bobId).get();
        assertEquals(bobId, status.getCurrentPlayerId());
        assertEquals(1, status.getCardsOnTable().size());
        assertEquals(h7, status.getCardsOnTable().get(0).get(0));

        // Bob tries to beat with S8 (wrong suit)
        PlayCardsRequest bobRequest1 = new PlayCardsRequest().playerId(bobId).cards(java.util.List.of(s8));
        assertFalse(gameService.playCards(pin, bobRequest1));

        // Bob tries to beat with 2 cards (wrong count)
        PlayCardsRequest bobRequest2 = new PlayCardsRequest().playerId(bobId).cards(java.util.List.of(h8, s8));
        assertFalse(gameService.playCards(pin, bobRequest2));

        // Bob beats with H8
        PlayCardsRequest bobRequest3 = new PlayCardsRequest().playerId(bobId).cards(java.util.List.of(h8));
        assertTrue(gameService.playCards(pin, bobRequest3));

        status = gameService.getGameStatus(pin).get();
        // Since it was a 2-player game, beating returns turn to leader and clears table
        assertEquals(0, status.getCardsOnTable().size());
        assertEquals(bobId, status.getLeadingPlayerId());
        assertEquals(bobId, status.getCurrentPlayerId());
        
        // Verify Alice's hand was NOT filled (deck might be empty in this manual setup, but let's check refill logic)
        // Actually in startGame, deck is initialized.
    }

    @Test
    void testTakeCards() {
        GameService gameService = new GameService();
        GameCreatedResponse created = gameService.createGame();
        String pin = created.getPin();
        String hostSecret = created.getSecret();

        gameService.joinGame(pin, "Alice", hostSecret);
        gameService.joinGame(pin, "Bob", null);
        gameService.startGame(pin, hostSecret);
        gameService.setGameStatus(pin, GameStatus.StatusEnum.IN_GAME);

        GameStatus game = gameService.getGameStatus(pin).get();
        String aliceId = game.getPlayers().get(0).getId();
        String bobId = game.getPlayers().get(1).getId();

        Card h7 = new Card().suit(Card.SuitEnum.HEARTS).rank(Card.RankEnum._7);
        gameService.setPlayerHand(pin, aliceId, new java.util.ArrayList<>(java.util.List.of(h7)));
        gameService.setPlayerHand(pin, bobId, new java.util.ArrayList<>(java.util.List.of())); // Empty hand to see cards added

        // Alice leads with H7
        gameService.playCards(pin, new PlayCardsRequest().playerId(aliceId).cards(java.util.List.of(h7)));

        // Bob takes cards
        PlayCardsRequest takeRequest = new PlayCardsRequest().playerId(bobId).cards(java.util.List.of()).takeCards(true);
        assertTrue(gameService.playCards(pin, takeRequest));

        // Verify Bob has H7 in hand
        var bobStatus = gameService.getPlayerGameStatus(pin, bobId).get();
        assertTrue(bobStatus.getCards().stream().anyMatch(c -> c.getSuit() == Card.SuitEnum.HEARTS && c.getRank() == Card.RankEnum._7));
        
        // Verify Bob's hand is filled from deck (initial is 7)
        assertEquals(7, bobStatus.getCards().size());

        // Verify next player (Alice) leads
        var finalStatus = gameService.getGameStatus(pin).get();
        assertEquals(aliceId, finalStatus.getLeadingPlayerId());
        assertEquals(aliceId, finalStatus.getCurrentPlayerId());
        assertEquals(0, finalStatus.getCardsOnTable().size());
    }
}
