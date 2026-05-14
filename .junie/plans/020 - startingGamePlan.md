### Plan: Starting the Game

This plan depends on `.junie/plans/gamePlan.md` and details the transition from the lobby to the active game state, including card distribution logic.

#### 1. Dependencies
- Depends on: `.junie/plans/gamePlan.md` (specifically the implementation of the `POST /api/game/{pin}/start` endpoint and the `GameComponent`).

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
    - **Distribution**:
        - **2 - 4 players**: 7 cards each.
        - **5 - 6 players**: 5 cards each.
        - **7 - 10 players**: 3 cards each.
    - **Shuffle**: Ensure the deck is randomized before distribution.
- **API Update**:
    - Update the `LobbyStatus` (or a new `GameStatus` schema) in `api-spec/openapi.yml` to include:
        - `cards`: An array of card objects for the current player (only visible to the owner).
        - `playerHands`: Metadata about other players (e.g., number of cards held).

#### 3. Frontend Implementation (`GameStore` & `GameComponent`)
- **Status Monitoring**:
    - The `GameStore` polling logic (defined in `gamePlan.md`) should detect when the status changes to `STARTING`.
- **UI Feedback**:
    - When the status is `STARTING`, show a "Dealing cards..." overlay or animation to the players.
- **Card Display**:
    - Once cards are received from the API, update the `GameComponent` to render the player's hand.

#### 4. Verification
- **Host Trigger**: Verify that clicking "Start Game" as a host triggers the `STARTING` state.
- **Player Count Scaling**:
    - Test with 2 players: Verify each gets 7 cards.
    - Test with 5 players: Verify each gets 5 cards.
    - Test with 8 players: Verify each gets 3 cards.
- **Randomization**: Ensure that in multiple game starts, players do not receive the same cards in the same order (verify shuffling).
- **State Consistency**: Verify that all players see the `STARTING` status simultaneously via polling.
