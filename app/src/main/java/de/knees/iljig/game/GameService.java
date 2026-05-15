package de.knees.iljig.game;

import de.knees.iljig.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final Map<String, GameStatus> games = new ConcurrentHashMap<>();
    private final Map<String, String> gameSecrets = new ConcurrentHashMap<>();
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
        return Optional.ofNullable(games.get(pin));
    }

    public Optional<GameStatus> getPlayerGameStatus(String pin, String playerId) {
        GameStatus game = games.get(pin);
        if (game == null) return Optional.empty();

        boolean isPlayerInGame = game.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId));

        if (!isPlayerInGame) return Optional.empty();

        boolean isHost = game.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId) && Boolean.TRUE.equals(p.getIsHost()));

        GameStatus status = new GameStatus();
        status.setPin(game.getPin());
        status.setPlayers(game.getPlayers());
        status.setStatus(game.getStatus());
        status.setIsHost(isHost);

        return Optional.of(status);
    }

    public boolean startGame(String pin, String secret) {
        String hostSecret = gameSecrets.get(pin);
        if (hostSecret != null && hostSecret.equals(secret)) {
            GameStatus game = games.get(pin);
            if (game != null) {
                game.setStatus(GameStatus.StatusEnum.STARTING);
                return true;
            }
        }
        return false;
    }
}
