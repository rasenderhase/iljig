package de.knees.iljig.lobby;

import de.knees.iljig.model.LobbyStatus;
import de.knees.iljig.model.Player;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
class LobbyService {
    private final Map<String, LobbyStatus> lobbies = new ConcurrentHashMap<>();
    private final Random random = new Random();

    LobbyStatus createLobby() {
        String pin = String.format("%04d", random.nextInt(10000));
        while (lobbies.containsKey(pin)) {
            pin = String.format("%04d", random.nextInt(10000));
        }

        LobbyStatus lobby = new LobbyStatus();
        lobby.setPin(pin);
        lobby.setPlayers(new ArrayList<>());
        lobby.setStatus(LobbyStatus.StatusEnum.WAITING);

        lobbies.put(pin, lobby);
        return lobby;
    }

    Optional<LobbyStatus> joinLobby(String pin, String playerName) {
        LobbyStatus lobby = lobbies.get(pin);
        if (lobby == null) return Optional.empty();

        Player player = new Player();
        player.setId(UUID.randomUUID().toString());
        player.setName(playerName);
        player.setIsHost(lobby.getPlayers().isEmpty()); // First player is host

        lobby.addPlayersItem(player);
        return Optional.of(lobby);
    }

    Optional<LobbyStatus> getLobbyStatus(String pin) {
        return Optional.ofNullable(lobbies.get(pin));
    }
}
