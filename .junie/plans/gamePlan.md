### New Game Plan

To implement the requested features, the following plan will be executed. It involves adding a new `GameComponent`, updating the routing, and implementing polling logic to keep the player list up-to-date.

#### 1. API Extensions
- **Update `api-spec/openapi.yml`**: Add a `POST /api/lobby/{pin}/start` endpoint to allow the host to start the game.
- **Regenerate API Client**: Ensure `LobbyService` includes the new `startGame(pin)` method (run `npm run generate-api` or equivalent).

#### 2. Routing Configuration
- **Update `src/app/app.routes.ts`**: Add a new route for the game page:
  ```typescript
  { path: 'game/:pin', component: GameComponent }
  ```

#### 3. Lobby Component Updates
- **Forwarding**: Update `LobbyStore` (or `LobbyComponent`) to use the Angular `Router` to navigate to `/game/{pin}` after a successful `hostGame()` or `joinGame()` call.
- **Cleanup**: Remove the `lobby-status` section from `LobbyComponent.html` as this logic will move to the new component.

#### 4. New Game Feature
- **`GameComponent`**:
  - Displays the Game PIN and the current status.
  - Shows a list of all players currently in the lobby.
  - Includes a "Start Game" button visible only to the host.
- **`GameStore` (Signal Store)**:
  - **Polling Logic**: Use an RxJS `timer` to call `getLobbyStatus(pin)` every few seconds while the game status is `WAITING`.
  - **Host Identification**: Track whether the current user is the host (e.g., by checking the `isHost` flag in the player list or persisting it during the join/host process).
  - **Start Game Action**: Implement the `startGame` method that triggers the API call.

#### 5. UI Logic
- **"Start Game" Button**:
  - **Visibility**: Only visible if the current player is the host.
  - **Enablement**: Only enabled if `players.length >= 2`.

#### 6. Verification
- Confirm that both hosting and joining correctly redirect to the unique game URL.
- Verify that the player list updates automatically when new players join.
- Ensure only the host can see and click the "Start Game" button when the conditions are met.
