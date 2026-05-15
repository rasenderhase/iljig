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
        // Deck should be 40 (standard) + 2 (jokers) = 42
        // Players take 2 * 7 = 14
        // Remaining: 42 - 14 = 28 (including trump indicator which is the last card of the deck)
        // Wait, distributeCards currently keeps the whole remaining deck in gameDecks.
        // Let's check the count.
        assertEquals(28, aliceStatus.getRemainingDeckCount());

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
}
