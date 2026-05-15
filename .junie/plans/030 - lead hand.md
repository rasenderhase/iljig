### Plan: Lead Hand

This plan defines the rules and implementation for the "Lead Hand" (the player who starts a round) in the game. It covers the initial leader, the constraints on played cards, and the required API and UI updates.

#### 1. Dependencies
- Depends on: `.junie/plans/020 - startingGamePlan.md` (specifically the `IN_GAME` state and card distribution).

#### 2. Business Rules (Lead Hand)
- **Initial Leader**: The host is the first leading hand when the game starts.
- **Card Count Constraints**:
    - The leader must play an **odd number** of cards.
    - **Minimum**: 1 card.
    - **Maximum (Deck not empty)**: The "initial number of cards per player - 2" (7, 5, or 3 depending on player count).
    - **Maximum (Deck empty)**: The "minimum number of cards a player holds" among all active players.
- **Card Composition**:
    - The played cards must consist of **one single card** and **optional pairs**.
    - **Pair Definition**: Two cards of equal rank (suit does not matter).
    - **Joker Pairs**: Two Jokers can form a pair.
    - **No Substitution**: A Joker **cannot** replace another card to form a pair. (e.g., [Joker, King, 7] is invalid; [Joker, Joker, 7] or [King, King, 7] are valid).
- **Leading**: These rules apply whenever a player leads a hand (starts a new round).

#### 3. API Updates (`api-spec/openapi.yml`)
- **`GameStatus`**:
    - Add `leadingPlayerId`: The ID of the player who is currently leading.
    - Add `initialCardsPerPlayer`: Store the count used during distribution (7, 5, or 3) for validation.
- **New Endpoint**: `POST /api/game/{pin}/play`
    - **Request Body**:
        - `playerId`: ID of the player playing cards.
        - `cards`: List of `Card` objects being played.
    - **Validation**:
        - Player must be the `leadingPlayerId` (if it's the start of a round).
        - Played cards must follow the odd count and composition rules.
        - Played cards must be in the player's hand.
    - **Responses**:
        - `204 No Content`: Successful play.
        - `400 Bad Request`: Invalid card combination or count.
        - `403 Forbidden`: Not the player's turn or not the leader.

#### 4. Backend Implementation (`GameService.java`)
- **State Management**:
    - Track the current `leadingPlayerId`. Initialize to the host's ID when starting the game.
    - Store `initialCardsPerPlayer` in the game state.
- **Validation Logic**:
    - Implement a method `validateLeadPlay(List<Card> cards, int initialCards, int minHandSize, boolean deckEmpty)`.
    - Check if `cards.size()` is odd and within bounds.
    - Check for "one single + pairs" structure:
        - Group cards by rank.
        - Ensure at most one rank has an odd count (the single card) - 3 equal ranks is also possible.
        - Ensure all other ranks have even counts (forming pairs).
        - Explicitly reject Joker substitution (though grouping by rank naturally handles this, ensure Jokers are treated as their own rank).
- **Play Execution**:
    - Remove played cards from the player's hand.
    - Update `GameStatus` to reflect the played cards (to be followed by other players).
    - Fill the player's hand with cards from the deck up to initialCardsPerPlayer (If possible and if player has less than initialCardsPerPlayer cards in their hand).
    - Remove the filled cards from the deck.
    - Update the `leadingPlayerId` to the next player in the order.

#### 5. Frontend Implementation (`GameStore` & `GameComponent`)
- **Selection UI**:
    - Allow players to select cards from their hand.
    - Highlight selected cards.
- **Action Button**:
    - Show a "Play" button when it is the player's turn to lead.
    - Disable the button if the selection does not meet the "odd number + pairs" criteria.
- **Information Display**:
    - Indicate who is currently leading.
    - Show the current play constraints (e.g., "Must play 1, 3, or 5 cards").

#### 6. Verification
- **Initial Leader**: Verify host is `leadingPlayerId` upon `IN_GAME` transition.
- **Validation Tests**:
    - Test 1 card (Single).
    - Test 3 cards (1 Pair + 1 Single).
    - Test 5 cards (2 Pairs + 1 Single).
    - Test invalid counts (2, 4 cards).
    - Test invalid compositions (e.g., 3 different ranks).
    - Test Joker pair (2 Jokers + 1 rank).
    - Test maximum limits when deck is full vs. empty.
- **State Consistency**: Ensure all players see the updated hand sizes and the cards played by the leader.
