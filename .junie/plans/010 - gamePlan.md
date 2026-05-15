### New Game Plan

To implement the requested features, the following plan will be executed. It involves adding a new `GameComponent`, updating the routing, and implementing polling logic to keep the player list up-to-date.

#### 1. API Extensions
- **Update `api-spec/openapi.yml`**:
    - `createLobby` returns `pin` and `secret`.
    - `joinLobby` returns `playerId` and `lobbyStatus`.
    - Added `/api/lobby/{pin}/player/{playerId}` for authenticated polling.
    - Updated `startGame` to require `secret` in header.
- **Regenerate API Client**: Ensure `LobbyService` and `GameService` reflect these changes.

#### 2. Routing Configuration
- **Update `src/app/app.routes.ts`**:
  ```typescript
  { path: '', component: LobbyComponent },
  { path: 'game/:pin', component: GameComponent },
  { path: 'game/:pin/player/:playerId', component: GameComponent }
  ```

#### 3. Lobby Component & Store Updates
- **`LobbyStore`**:
    - `hostGame`: Store the `secret` from `createLobby`. Join the lobby with this `secret`. Navigate to `/game/{pin}/player/{playerId}`.
    - `joinGame`: Join the lobby, get `playerId`. Navigate to `/game/{pin}/player/{playerId}`.
- **Spectator Access**: Users navigating directly to `/game/{pin}` should be treated as spectators.

#### 4. New Game Feature
- **`GameComponent`**:
  - Displays the Game PIN and the current status.
  - Shows a list of all players currently in the lobby.
  - Includes a "Start Game" button visible only to the host.
- **`GameStore` (Signal Store)**:
  - **Polling Logic**:
    - If `playerId` is present in URL: Call `getPlayerLobbyStatus(pin, playerId)` every few seconds.
    - If `playerId` is NOT present: Call `getLobbyStatus(pin)` (spectator mode).
  - **Host Identification**:
    - Recognized if `lobbyStatus.isHost` is true (returned by `getPlayerLobbyStatus` or `joinLobby` when secret matches).
  - **Start Game Action**: Implement `startGame` using the stored `secret`.

#### 5. UI Logic
- **"Start Game" Button**:
  - **Visibility**: Only visible if `isHost` is true.
  - **Enablement**: Only enabled if `players.length >= 2`.
- **Spectator Mode**: Disable all interactions, only show player list and game status.

#### 6. Verification
- Confirm that both hosting and joining correctly redirect to the unique game URL.
- Verify that the player list updates automatically when new players join.
- Ensure only the host can see and click the "Start Game" button when the conditions are met.
