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
}
