package de.knees.iljig.service;

import de.knees.iljig.model.LobbyStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LobbyServiceTest {

    @Test
    void testCreateLobby() {
        LobbyService lobbyService = new LobbyService();
        LobbyStatus lobby = lobbyService.createLobby();
        
        assertNotNull(lobby.getPin());
        assertEquals(4, lobby.getPin().length());
        assertEquals(LobbyStatus.StatusEnum.WAITING, lobby.getStatus());
        assertTrue(lobby.getPlayers().isEmpty());
    }

    @Test
    void testJoinLobby() {
        LobbyService lobbyService = new LobbyService();
        LobbyStatus created = lobbyService.createLobby();
        
        var joinedLobbyOpt = lobbyService.joinLobby(created.getPin(), "Alice");
        
        assertTrue(joinedLobbyOpt.isPresent());
        LobbyStatus joinedLobby = joinedLobbyOpt.get();
        assertEquals(1, joinedLobby.getPlayers().size());
        assertEquals("Alice", joinedLobby.getPlayers().get(0).getName());
        assertTrue(joinedLobby.getPlayers().get(0).getIsHost());
    }
}
