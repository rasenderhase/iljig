package de.knees.iljig.lobby;

import de.knees.iljig.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LobbyService {
    private final Map<String, LobbyStatus> lobbies = new ConcurrentHashMap<>();
    private final Map<String, String> lobbySecrets = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public LobbyCreatedResponse createLobby() {
        String pin = String.format("%04d", random.nextInt(10000));
        while (lobbies.containsKey(pin)) {
            pin = String.format("%04d", random.nextInt(10000));
        }

        String secret = UUID.randomUUID().toString();

        LobbyStatus lobby = new LobbyStatus();
        lobby.setPin(pin);
        lobby.setPlayers(new ArrayList<>());
        lobby.setStatus(LobbyStatus.StatusEnum.WAITING);

        lobbies.put(pin, lobby);
        lobbySecrets.put(pin, secret);

        LobbyCreatedResponse response = new LobbyCreatedResponse();
        response.setPin(pin);
        response.setSecret(secret);
        return response;
    }

    public Optional<JoinLobbyResponse> joinLobby(String pin, String playerName, String secret) {
        LobbyStatus lobby = lobbies.get(pin);
        if (lobby == null) return Optional.empty();

        String playerId = UUID.randomUUID().toString();
        Player player = new Player();
        player.setId(playerId);
        player.setName(playerName);

        String hostSecret = lobbySecrets.get(pin);
        boolean isJoiningAsHost = secret != null && secret.equals(hostSecret);

        if (lobby.getPlayers().isEmpty()) {
            player.setIsHost(true);
        } else {
            player.setIsHost(isJoiningAsHost);
        }

        lobby.addPlayersItem(player);

        JoinLobbyResponse response = new JoinLobbyResponse();
        response.setPlayerId(playerId);
        response.setLobbyStatus(lobby);

        return Optional.of(response);
    }

    public Optional<LobbyStatus> getLobbyStatus(String pin) {
        return Optional.ofNullable(lobbies.get(pin));
    }

    public Optional<LobbyStatus> getPlayerLobbyStatus(String pin, String playerId) {
        LobbyStatus lobby = lobbies.get(pin);
        if (lobby == null) return Optional.empty();

        boolean isPlayerInLobby = lobby.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId));

        if (!isPlayerInLobby) return Optional.empty();

        // Check if this player is host
        boolean isHost = lobby.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId) && Boolean.TRUE.equals(p.getIsHost()));

        LobbyStatus status = new LobbyStatus();
        status.setPin(lobby.getPin());
        status.setPlayers(lobby.getPlayers());
        status.setStatus(lobby.getStatus());
        status.setIsHost(isHost);

        return Optional.of(status);
    }

    public boolean startGame(String pin, String secret) {
        String hostSecret = lobbySecrets.get(pin);
        if (hostSecret != null && hostSecret.equals(secret)) {
            LobbyStatus lobby = lobbies.get(pin);
            if (lobby != null) {
                lobby.setStatus(LobbyStatus.StatusEnum.STARTING);
                return true;
            }
        }
        return false;
    }
}
