package de.knees.iljig.game;

import de.knees.iljig.api.GameApi;
import de.knees.iljig.lobby.LobbyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GameController implements GameApi {

    private final LobbyService lobbyService;

    GameController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @Override
    public ResponseEntity<Void> startGame(String pin, String secret) {
        if (lobbyService.startGame(pin, secret)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(403).build();
        }
    }
}
