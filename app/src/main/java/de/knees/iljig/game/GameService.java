package de.knees.iljig.game;

import de.knees.iljig.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final Map<String, GameStatus> games = new ConcurrentHashMap<>();
    private final Map<String, String> gameSecrets = new ConcurrentHashMap<>();
    private final Map<String, Map<String, List<Card>>> playerHands = new ConcurrentHashMap<>();
    private final Map<String, List<Card>> gameDecks = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public GameCreatedResponse createGame() {
        String pin = String.format("%04d", random.nextInt(10000));
        while (games.containsKey(pin)) {
            pin = String.format("%04d", random.nextInt(10000));
        }

        String secret = UUID.randomUUID().toString();

        GameStatus game = new GameStatus();
        game.setPin(pin);
        game.setPlayers(new ArrayList<>());
        game.setStatus(GameStatus.StatusEnum.WAITING);

        games.put(pin, game);
        gameSecrets.put(pin, secret);

        GameCreatedResponse response = new GameCreatedResponse();
        response.setPin(pin);
        response.setSecret(secret);
        return response;
    }

    public Optional<JoinGameResponse> joinGame(String pin, String playerName, String secret) {
        GameStatus game = games.get(pin);
        if (game == null) return Optional.empty();

        String playerId = UUID.randomUUID().toString();
        Player player = new Player();
        player.setId(playerId);
        player.setName(playerName);

        String hostSecret = gameSecrets.get(pin);
        boolean isJoiningAsHost = secret != null && secret.equals(hostSecret);

        if (game.getPlayers().isEmpty()) {
            player.setIsHost(true);
        } else {
            player.setIsHost(isJoiningAsHost);
        }

        game.addPlayersItem(player);

        JoinGameResponse response = new JoinGameResponse();
        response.setPlayerId(playerId);
        response.setGameStatus(game);

        return Optional.of(response);
    }

    public Optional<GameStatus> getGameStatus(String pin) {
        GameStatus game = games.get(pin);
        if (game == null) return Optional.empty();

        GameStatus status = copyBaseStatus(game);
        status.setIsHost(false);

        enrichWithGameState(status, pin, null);

        return Optional.of(status);
    }

    public Optional<GameStatus> getPlayerGameStatus(String pin, String playerId) {
        GameStatus game = games.get(pin);
        if (game == null) return Optional.empty();

        boolean isPlayerInGame = game.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId));

        if (!isPlayerInGame) return Optional.empty();

        boolean isHost = game.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId) && Boolean.TRUE.equals(p.getIsHost()));

        GameStatus status = copyBaseStatus(game);
        status.setIsHost(isHost);

        enrichWithGameState(status, pin, playerId);

        return Optional.of(status);
    }

    private GameStatus copyBaseStatus(GameStatus game) {
        GameStatus status = new GameStatus();
        status.setPin(game.getPin());
        status.setPlayers(new ArrayList<>(game.getPlayers()));
        status.setStatus(game.getStatus());
        status.setTrumpCard(game.getTrumpCard());
        status.setTrumpSuit(game.getTrumpSuit());
        status.setLeadingPlayerId(game.getLeadingPlayerId());
        status.setCurrentPlayerId(game.getCurrentPlayerId());
        status.setRoundLeaderId(game.getRoundLeaderId());
        status.setInitialCardsPerPlayer(game.getInitialCardsPerPlayer());
        status.setPlayedCards(game.getPlayedCards());
        status.setCardsOnTable(game.getCardsOnTable() != null ? new ArrayList<>(game.getCardsOnTable()) : null);
        return status;
    }

    private void enrichWithGameState(GameStatus status, String pin, String playerId) {
        List<Card> deck = gameDecks.get(pin);
        if (deck != null) {
            status.setRemainingDeckCount(deck.size());
        }

        Map<String, List<Card>> hands = playerHands.get(pin);
        if (hands != null) {
            if (playerId != null) {
                status.setCards(hands.get(playerId));
            }

            List<PlayerHandMetadata> playerHandsMetadata = new ArrayList<>();
            for (Map.Entry<String, List<Card>> entry : hands.entrySet()) {
                String otherPlayerId = entry.getKey();
                if (playerId == null || !otherPlayerId.equals(playerId)) {
                    PlayerHandMetadata metadata = new PlayerHandMetadata();
                    metadata.setPlayerId(otherPlayerId);

                    String playerName = status.getPlayers().stream()
                            .filter(p -> p.getId().equals(otherPlayerId))
                            .map(Player::getName)
                            .findFirst()
                            .orElse("Unknown");

                    metadata.setPlayerName(playerName);
                    metadata.setCardCount(entry.getValue().size());
                    playerHandsMetadata.add(metadata);
                }
            }
            status.setPlayerHands(playerHandsMetadata);
        }
    }

    public boolean startGame(String pin, String secret) {
        String hostSecret = gameSecrets.get(pin);
        if (hostSecret != null && hostSecret.equals(secret)) {
            GameStatus game = games.get(pin);
            if (game != null && game.getStatus() == GameStatus.StatusEnum.WAITING) {
                game.setStatus(GameStatus.StatusEnum.STARTING);
                distributeCards(game);

                // Transition to IN_GAME after a short delay (simulating dealing)
                new Thread(() -> {
                    try {
                        Thread.sleep(3000);
                        game.setStatus(GameStatus.StatusEnum.IN_GAME);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();

                return true;
            }
        }
        return false;
    }

    private void distributeCards(GameStatus game) {
        List<Player> players = game.getPlayers();
        int playerCount = players.size();
        List<Card> deck = createDeck(playerCount);
        Collections.shuffle(deck);

        int cardsPerPlayer = 7;
        if (playerCount >= 7) {
            cardsPerPlayer = 3;
        } else if (playerCount >= 5) {
            cardsPerPlayer = 5;
        }
        game.setInitialCardsPerPlayer(cardsPerPlayer);

        // Initial leader is the host
        players.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsHost()))
                .findFirst()
                .ifPresent(host -> {
                    game.setLeadingPlayerId(host.getId());
                    game.setCurrentPlayerId(host.getId());
                    game.setRoundLeaderId(host.getId());
                });

        game.setCardsOnTable(new ArrayList<>());

        Map<String, List<Card>> hands = new HashMap<>();
        int cardIdx = 0;
        for (Player player : players) {
            List<Card> hand = new ArrayList<>();
            for (int i = 0; i < cardsPerPlayer; i++) {
                hand.add(deck.get(cardIdx++));
            }
            hands.put(player.getId(), hand);
        }
        playerHands.put(game.getPin(), hands);

        // Last card is the trump card
        Card trumpCard = deck.get(deck.size() - 1);
        game.setTrumpCard(trumpCard);

        if (trumpCard.getSuit() == Card.SuitEnum.JOKER) {
            game.setTrumpSuit(GameStatus.TrumpSuitEnum.HEARTS);
        } else {
            game.setTrumpSuit(GameStatus.TrumpSuitEnum.valueOf(trumpCard.getSuit().name()));
        }

        // Remaining deck
        List<Card> remainingDeck = new ArrayList<>(deck.subList(cardIdx, deck.size()));
        gameDecks.put(game.getPin(), remainingDeck);
    }

    private List<Card> createDeck(int playerCount) {
        List<Card> deck = new ArrayList<>();
        Card.SuitEnum[] suits = {Card.SuitEnum.HEARTS, Card.SuitEnum.CLUBS, Card.SuitEnum.SPADES, Card.SuitEnum.DIAMONDS};
        Card.RankEnum[] ranks = {
                Card.RankEnum._7, Card.RankEnum._8, Card.RankEnum._9, Card.RankEnum._10,
                Card.RankEnum.J, Card.RankEnum.Q, Card.RankEnum.K,
                Card.RankEnum._3, Card.RankEnum._2, Card.RankEnum.A
        };

        for (Card.SuitEnum suit : suits) {
            for (Card.RankEnum rank : ranks) {
                Card card = new Card();
                card.setSuit(suit);
                card.setRank(rank);
                deck.add(card);
            }
        }

        // Jokers
        int jokerCount = playerCount >= 7 ? 3 : 2;
        addJoker(deck, Card.RankEnum.RED);
        addJoker(deck, Card.RankEnum.BLUE);
        if (jokerCount == 3) {
            addJoker(deck, Card.RankEnum.COLORED);
        }

        return deck;
    }

    private void addJoker(List<Card> deck, Card.RankEnum rank) {
        Card joker = new Card();
        joker.setSuit(Card.SuitEnum.JOKER);
        joker.setRank(rank);
        deck.add(joker);
    }

    public boolean playCards(String pin, PlayCardsRequest request) {
        GameStatus game = games.get(pin);
        if (game == null || game.getStatus() != GameStatus.StatusEnum.IN_GAME) {
            return false;
        }

        String playerId = request.getPlayerId();
        List<Card> playedCards = request.getCards();
        boolean taking = Boolean.TRUE.equals(request.getTakeCards());

        // 1. Must be the current player
        if (!playerId.equals(game.getCurrentPlayerId())) {
            return false;
        }

        Map<String, List<Card>> hands = playerHands.get(pin);
        List<Card> hand = hands.get(playerId);

        if (hand == null) {
            return false;
        }

        if (taking) {
            handleTake(game, playerId, hand);
            return true;
        }

        // 2. Validate cards are in hand
        for (Card played : playedCards) {
            boolean found = false;
            for (Card inHand : hand) {
                if (inHand.getSuit().equals(played.getSuit()) && inHand.getRank().equals(played.getRank())) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        if (playerId.equals(game.getLeadingPlayerId()) && (game.getCardsOnTable() == null || game.getCardsOnTable().isEmpty())) {
            // LEAD PLAY
            int minHandSize = hands.values().stream().mapToInt(List::size).min().orElse(0);
            List<Card> deck = gameDecks.get(pin);
            boolean deckEmpty = deck == null || deck.isEmpty();
            if (!validateLeadPlay(playedCards, game.getInitialCardsPerPlayer(), minHandSize, deckEmpty)) {
                return false;
            }

            // Execute lead play
            for (Card card : playedCards) {
                removeFromHand(hand, card);
                game.addCardsOnTableItem(new ArrayList<>(List.of(card)));
            }
            game.setRoundLeaderId(playerId);
        } else {
            // BEATING PLAY
            List<List<Card>> table = game.getCardsOnTable();
            List<Card> topCards = table.stream().filter(stack -> stack.size() == 1).map(stack -> stack.get(0)).toList();

            // Must match the number of top cards
            if (playedCards.size() != topCards.size()) {
                return false;
            }

            // Each played card must beat one top card
            if (!canBeatAll(playedCards, topCards, game.getTrumpSuit())) {
                return false;
            }

            // Execute beating play
            List<Card> remainingAttackers = new ArrayList<>(playedCards);
            for (List<Card> stack : table) {
                if (stack.size() == 1) {
                    Card defender = stack.get(0);
                    Card attacker = remainingAttackers.stream()
                            .filter(a -> canBeat(a, defender, game.getTrumpSuit()))
                            .findFirst()
                            .orElseThrow();
                    stack.add(attacker);
                    remainingAttackers.remove(attacker);
                    removeFromHand(hand, attacker);
                }
            }
        }

        // Refill hand from deck
        refillHand(game, hand);

        // Update turn
        updateTurn(game, playerId);

        return true;
    }

    private void removeFromHand(List<Card> hand, Card card) {
        hand.removeIf(c -> c.getSuit() == card.getSuit() && c.getRank() == card.getRank());
    }

    private void handleTake(GameStatus game, String playerId, List<Card> hand) {
        // Add all cards from table to hand
        for (List<Card> stack : game.getCardsOnTable()) {
            hand.addAll(stack);
        }
        game.getCardsOnTable().clear();

        // Refill hand
        refillHand(game, hand);

        // Next player becomes leader
        List<Player> players = game.getPlayers();
        int idx = getPlayerIndex(game, playerId);
        int nextIdx = (idx + 1) % players.size();
        String nextPlayerId = players.get(nextIdx).getId();

        game.setLeadingPlayerId(nextPlayerId);
        game.setCurrentPlayerId(nextPlayerId);
        game.setRoundLeaderId(nextPlayerId);
    }

    private void refillHand(GameStatus game, List<Card> hand) {
        List<Card> deck = gameDecks.get(game.getPin());
        if (deck != null) {
            while (!deck.isEmpty() && hand.size() < game.getInitialCardsPerPlayer()) {
                hand.add(deck.remove(0));
            }
        }
    }

    private void updateTurn(GameStatus game, String playerId) {
        List<Player> players = game.getPlayers();
        int idx = getPlayerIndex(game, playerId);
        int nextIdx = (idx + 1) % players.size();
        String nextPlayerId = players.get(nextIdx).getId();

        if (nextPlayerId.equals(game.getRoundLeaderId())) {
            // Round over
            game.getCardsOnTable().clear();
            game.setLeadingPlayerId(playerId);
            game.setCurrentPlayerId(playerId);
            game.setRoundLeaderId(playerId);
        } else {
            game.setCurrentPlayerId(nextPlayerId);
        }
    }

    private int getPlayerIndex(GameStatus game, String playerId) {
        List<Player> players = game.getPlayers();
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getId().equals(playerId)) {
                return i;
            }
        }
        return -1;
    }

    public boolean canBeatAll(List<Card> attackers, List<Card> defenders, GameStatus.TrumpSuitEnum trumpSuit) {
        if (attackers.size() != defenders.size()) return false;
        return canBeatRecursive(new ArrayList<>(attackers), new ArrayList<>(defenders), trumpSuit);
    }

    private boolean canBeatRecursive(List<Card> attackers, List<Card> defenders, GameStatus.TrumpSuitEnum trumpSuit) {
        if (defenders.isEmpty()) return true;

        Card defender = defenders.get(0);
        for (int i = 0; i < attackers.size(); i++) {
            Card attacker = attackers.get(i);
            if (canBeat(attacker, defender, trumpSuit)) {
                List<Card> nextAttackers = new ArrayList<>(attackers);
                nextAttackers.remove(i);
                List<Card> nextDefenders = new ArrayList<>(defenders);
                nextDefenders.remove(0);
                if (canBeatRecursive(nextAttackers, nextDefenders, trumpSuit)) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean canBeat(Card attacker, Card defender, GameStatus.TrumpSuitEnum trumpSuit) {
        if (attacker.getSuit() == Card.SuitEnum.JOKER) {
            if (defender.getSuit() == Card.SuitEnum.JOKER) {
                return getJokerValue(attacker.getRank()) > getJokerValue(defender.getRank());
            }
            return true;
        }

        if (defender.getSuit() == Card.SuitEnum.JOKER) {
            return false;
        }

        boolean attackerIsTrump = attacker.getSuit().name().equals(trumpSuit.name());
        boolean defenderIsTrump = defender.getSuit().name().equals(trumpSuit.name());

        if (attackerIsTrump) {
            if (defenderIsTrump) {
                return getRankValue(attacker.getRank()) > getRankValue(defender.getRank());
            }
            return true;
        }

        if (defenderIsTrump) {
            return false;
        }

        if (attacker.getSuit() == defender.getSuit()) {
            return getRankValue(attacker.getRank()) > getRankValue(defender.getRank());
        }

        return false;
    }

    private int getRankValue(Card.RankEnum rank) {
        return switch (rank) {
            case _7 -> 1;
            case _8 -> 2;
            case _9 -> 3;
            case _10 -> 4;
            case J -> 5;
            case Q -> 6;
            case K -> 7;
            case _3 -> 8;
            case _2 -> 9;
            case A -> 10;
            default -> 0;
        };
    }

    private int getJokerValue(Card.RankEnum rank) {
        return switch (rank) {
            case BLUE -> 1;
            case RED -> 2;
            case COLORED -> 3;
            default -> 0;
        };
    }

    public void setPlayerHand(String pin, String playerId, List<Card> hand) {
        playerHands.computeIfAbsent(pin, k -> new ConcurrentHashMap<>()).put(playerId, hand);
    }

    public void setGameStatus(String pin, GameStatus.StatusEnum status) {
        GameStatus game = games.get(pin);
        if (game != null) {
            game.setStatus(status);
        }
    }

    public boolean validateLeadPlay(List<Card> cards, int initialCards, int minHandSize, boolean deckEmpty) {
        if (cards == null || cards.isEmpty()) return false;

        int size = cards.size();

        // Must be odd
        if (size % 2 == 0) return false;

        // Bounds
        if (deckEmpty) {
            if (size > minHandSize) return false;
        } else {
            if (size > initialCards - 2) return false;
        }

        // Composition: One single card and optional pairs
        Map<Object, Integer> rankCounts = new HashMap<>();
        for (Card card : cards) {
            Object key = (card.getSuit() == Card.SuitEnum.JOKER) ? "JOKER" : card.getRank();
            rankCounts.put(key, rankCounts.getOrDefault(key, 0) + 1);
        }

        int oddRanks = 0;
        for (int count : rankCounts.values()) {
            if (count % 2 != 0) {
                oddRanks++;
            }
        }

        // Exactly one rank must have an odd count (the single card, which could be part of a triple)
        return oddRanks == 1;
    }
}
