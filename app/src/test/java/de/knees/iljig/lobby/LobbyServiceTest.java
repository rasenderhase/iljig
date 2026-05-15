package de.knees.iljig.lobby;

import de.knees.iljig.model.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LobbyServiceTest {

    @Test
    void testCreateLobby() {
        LobbyService lobbyService = new LobbyService();
        LobbyCreatedResponse lobby = lobbyService.createLobby();

        assertNotNull(lobby.getPin());
        assertEquals(4, lobby.getPin().length());
        assertNotNull(lobby.getSecret());
    }

    @Test
    void testJoinLobby() {
        LobbyService lobbyService = new LobbyService();
        LobbyCreatedResponse created = lobbyService.createLobby();

        var responseOpt = lobbyService.joinLobby(created.getPin(), "Alice", null);

        assertTrue(responseOpt.isPresent());
        JoinLobbyResponse response = responseOpt.get();
        assertNotNull(response.getPlayerId());
        LobbyStatus joinedLobby = response.getLobbyStatus();
        assertEquals(1, joinedLobby.getPlayers().size());
        assertEquals("Alice", joinedLobby.getPlayers().get(0).getName());
        assertTrue(joinedLobby.getPlayers().get(0).getIsHost());
    }
}
