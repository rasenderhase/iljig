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
}
