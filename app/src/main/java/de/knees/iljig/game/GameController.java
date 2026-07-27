package de.knees.iljig.game;

import de.knees.iljig.api.GameApi;
import de.knees.iljig.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GameController implements GameApi {

    private final GameService gameService;

    GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @Override
    public ResponseEntity<GameCreatedResponse> createGame() {
        return new ResponseEntity<>(gameService.createGame(), HttpStatus.CREATED);
    }

    @Override
    public ResponseEntity<GameStatus> getGameStatus(String pin) {
        return gameService.getGameStatus(pin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<GameStatus> getPlayerGameStatus(String pin, String playerId) {
        return gameService.getPlayerGameStatus(pin, playerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<JoinGameResponse> joinGame(JoinGameRequest joinGameRequest) {
        return gameService.joinGame(joinGameRequest.getPin(), joinGameRequest.getPlayerName(), joinGameRequest.getSecret())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<Void> startGame(String pin, String secret) {
        if (gameService.startGame(pin, secret)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    @Override
    public ResponseEntity<Void> playCards(String pin, PlayCardsRequest playCardsRequest) {
        if (gameService.playCards(pin, playCardsRequest)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(400).build();
        }
    }
}
