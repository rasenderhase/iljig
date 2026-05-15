### Plan: Starting the Game

This plan depends on `.junie/plans/010 - gamePlan.md` and details the transition from the lobby to the active game state, including card distribution logic, trump suit determination, and UI requirements for players and spectators.

#### 1. Dependencies
- Depends on: `.junie/plans/010 - gamePlan.md` (specifically the implementation of the `POST /api/game/{pin}/start` endpoint and the `GameComponent`).

#### 2. Backend Implementation (API & Game Logic)
- **State Transition**:
    - When the `POST /api/game/{pin}/start` endpoint is called by the host, the game state in the backend must change from `WAITING` to `STARTING`.
- **Card Distribution Logic**:
    - **Deck Composition**:
        - **Suits**: Hearts, Clubs, Spades, Diamonds.
        - **Ranks**: 7, 8, 9, 10, J, Q, K, 3, 2, A.
        - **Jokers**: 
            - 2 jokers if players < 7.
            - 3 jokers if players >= 7.
            - Joker Ranking (low to high): colored (players >= 7), blue, red.
    - **Shuffle**: Ensure the deck is randomized before distribution.
    - **Trump Suit Selection**:
        - The **last card** of the deck (after shuffling and dealing) is revealed as the trump indicator.
        - The trump suit is the color (suit) of this last card.
        - **Special Case**: If the last card is a **Joker**, the trump suit is automatically set to **Hearts**.
    - **Distribution**:
        - **2 - 4 players**: 7 cards each.
        - **5 - 6 players**: 5 cards each.
        - **7 - 10 players**: 3 cards each.
- **API Update**:
    - Update the `LobbyStatus` (or a new `GameStatus` schema) in `api-spec/openapi.yml` to include:
        - `cards`: An array of card objects for the current player (only visible to the owner).
        - `playerHands`: Metadata about other players (e.g., number of cards held).
        - `remainingDeckCount`: The number of cards left in the deck (visible to everyone).
        - `trumpCard`: The last card of the deck (object).
        - `trumpSuit`: The calculated trump suit (string/enum).

#### 3. Frontend Implementation (`GameStore` & `GameComponent`)
- **Status Monitoring**:
    - The `GameStore` polling logic (defined in `gamePlan.md`) should detect when the status changes to `STARTING`.
- **UI Feedback**:
    - When the status is `STARTING`, show a "Dealing cards..." overlay or animation to the players.
- **Game Info Display**:
    - **Deck Status**: Display the number of cards remaining in the deck to all users.
    - **Trump Display**:
        - Show the `trumpCard` (the last card of the deck) visually.
        - Explicitly display the current `trumpSuit` at all times during the game.
- **Card Display & Spectator Mode**:
    - **Players**: Once cards are received, render the player's hand in a "Your Hand" section.
    - **Spectators**: If in "Spectator Mode" (no `playerId` or specifically flagged), the "Your Hand" section must **not** be displayed.
    - **Common**: All users see the player list, remaining deck count, and trump information.

#### 4. Verification
- **Host Trigger**: Verify that clicking "Start Game" as a host triggers the `STARTING` state.
- **Trump Logic**:
    - Verify that the last card is correctly identified and the suit matches.
    - Test the Joker case: Ensure a Joker results in Hearts as the trump suit.
- **Player Count Scaling**:
    - Test with 2 players: Verify each gets 7 cards and the deck count is correct (Total - 14 - 1).
- **Spectator Mode**: Verify that a user joining without a secret/ID sees the game progress but cannot see a "Your Hand" section.
- **Randomization**: Ensure that in multiple game starts, players do not receive the same cards in the same order (verify shuffling).
- **State Consistency**: Verify that all players see the `STARTING` status and the same trump suit simultaneously via polling.
