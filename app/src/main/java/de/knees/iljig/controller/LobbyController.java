package de.knees.iljig.controller;

import de.knees.iljig.api.LobbyApi;
import de.knees.iljig.model.JoinLobbyRequest;
import de.knees.iljig.model.LobbyStatus;
import de.knees.iljig.service.LobbyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LobbyController implements LobbyApi {

    private final LobbyService lobbyService;

    public LobbyController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @Override
    public ResponseEntity<LobbyStatus> createLobby() {
        return new ResponseEntity<>(lobbyService.createLobby(), HttpStatus.CREATED);
    }

    @Override
    public ResponseEntity<LobbyStatus> getLobbyStatus(String pin) {
        return lobbyService.getLobbyStatus(pin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<LobbyStatus> joinLobby(JoinLobbyRequest joinLobbyRequest) {
        return lobbyService.joinLobby(joinLobbyRequest.getPin(), joinLobbyRequest.getPlayerName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
