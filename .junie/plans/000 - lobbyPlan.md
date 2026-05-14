# Implementation Plan: Index Page (Lobby)

## 1. Backend Preparation (Spring Boot)
- **Data Model:** Create `Game` and `Player` classes to represent the game state in memory.
- **Service Layer:** Implement a `LobbyService` to handle:
    - Creating a new game session with a unique 4-6 digit PIN.
    - Validating PINs and adding players to sessions.
- **REST Controller:** Implement `LobbyController` with endpoints:
    - `POST /api/lobby/create`: Initializes a game and returns the PIN.
    - `POST /api/lobby/join`: Takes a PIN and player name, returns a session token or success status.

## 2. Frontend Implementation (Angular)
- **Lobby Component:** Create a new component `LobbyComponent`.
    - **Join Section:** An input field for the PIN and a "Join" button.
    - **Create Section:** A "Host Game" button for players who want to start a new session.
- **Routing:** Configure `app.routes.ts` to set the `LobbyComponent` as the default route (`''`) and add `/game/:pin` route.
- **Lobby Service:** Create an Angular service to communicate with the Spring Boot backend.
- **Acceptance Criteria:**
    - When the host has created the game, he joins the game by navigating to URL `/game/{pin}`.
    - When a user joins the game, he navigates to `/game/{pin}`.

## 4. UI/UX Enhancements
- **QR Code Support:** Integrate a library (like `ngx-kjua`) to display a QR code containing the join URL on the host's screen.
- **Responsive Design:** Ensure the PIN entry is mobile-friendly.

## 5. Verification
- **Unit Tests:** Verify PIN generation logic and session management in Java.
- **Integration Tests:** Ensure Angular-to-Backend connectivity.
