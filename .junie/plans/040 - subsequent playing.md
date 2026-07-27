### Plan: Subsequent Playing

This plan depends on `.junie/plans/030 - lead hand.md`.
It defines the rules and implementation for players responding to a "lead hand" (the cards played to start a round).

#### 1. Dependencies
- Depends on: `.junie/plans/030 - lead hand.md` (specifically the `POST /api/game/{pin}/play` endpoint and `leadingPlayerId`).

#### 2. Business Rules (Subsequent Playing)
- **Turn Order**: After the leader plays cards, the turn passes to the next player.
- **Player Actions**: The current player can either **Take** or **Beat**.
- **Action: Take Cards**:
    - The player takes all cards currently on the table into their hand.
    - The player's hand is filled from the deck up to `initialCardsPerPlayer` (if possible).
    - The round ends.
    - The next player in order becomes the leader for the next round.
- **Action: Beat Cards**:
    - The player must beat **each** card currently on the top of the table.
    - The number of cards played to beat must **exactly match** the number of "top" cards currently on the table. You cannot play more or fewer cards.
    - A beating card is placed on top of each card on the table.
    - After beating, the player's hand is filled from the deck up to `initialCardsPerPlayer` (if possible).
    - **Conditions to Beat**:
        - Same suit and higher rank (applies to trump and Joker "suit" as well).
        - Trump suit beats any non-trump suit.
        - Joker beats any non-Joker card.
    - **Card Hierarchy** (High to Low):
        - Joker (RED, BLUE, COLORED ranks)
        - Trump Suit (A, 2, 3, K, Q, J, 10, 9, 8, 7)
        - Other Suits (A, 2, 3, K, Q, J, 10, 9, 8, 7)
    - **Rank Order** (within a suit): A > 2 > 3 > K > Q > J > 10 > 9 > 8 > 7.
    - **Round Progression after Beating**:
        - If the next player in order is NOT the one who led the current round, the turn passes to that next player.
        - If the next player in order WOULD be the one who led the current round (meaning everyone has had a chance to beat or take, or others skipped/took), the cards on the table are removed from the game ("taken away"), and the current player becomes the leader for the next round.

#### 3. API Updates (`api-spec/openapi.yml`)
- [x] **`GameStatus`**:
    - [x] Add `cardsOnTable`: A list of lists of `Card` objects. Each sub-list represents a "stack" (bottom card and the card beating it).
    - [x] Add `currentPlayerId`: The ID of the player whose turn it is.
    - [x] Add `roundLeaderId`: The ID of the player who started the current round (to check if the round should end after beating).
- [x] **Update Endpoint**: `POST /api/game/{pin}/play`
    - [x] Add an optional boolean field `takeCards` to the request body.
    - [x] If `takeCards` is true, the `cards` list can be empty.
- [x] **Validation**:
    - [x] Player must be `currentPlayerId`.
    - [x] If beating:
        - [x] Number of cards played must match the number of "top" cards on the table.
        - [x] Each played card must validly beat one of the top cards (implementation should allow the player to specify which card beats which if ambiguous, but usually it's automated or simple).
    - [x] If taking:
        - [x] `takeCards` must be true.

#### 4. Backend Implementation (`GameService.java`)
- [x] **State Management**:
    - [x] Track `currentPlayerId`, `roundLeaderId`, and `cardsOnTable`.
- [x] **Beating Logic**:
    - [x] Implement `canBeat(Card attacker, Card defender, Suit trumpSuit)`.
    - [x] Rank comparison: A > 2 > 3 > K > Q > J > 10 > 9 > 8 > 7.
    - [x] Special case: Joker suit/rank.
- [x] **Round Logic**:
    - [x] `onTake(playerId)`:
        - [x] Add all cards from `cardsOnTable` to player's hand.
        - [x] Clear `cardsOnTable`.
        - [x] Fill the player's hand with cards from the deck up to `initialCardsPerPlayer` (If possible and if player has less than `initialCardsPerPlayer` cards in their hand).
        - [x] Remove the filled cards from the deck.
        - [x] Set `roundLeaderId` and `currentPlayerId` to the next player.
    - [x] `onBeat(playerId, List<Card> cards)`:
        - [x] Validate beating conditions.
        - [x] Add cards to `cardsOnTable` (stacked on top).
        - [x] Remove played cards from the player's hand.
        - [x] Fill the player's hand with cards from the deck up to `initialCardsPerPlayer` (If possible and if player has less than `initialCardsPerPlayer` cards in their hand).
        - [x] Remove the filled cards from the deck.
        - [x] Determine next player: `nextPlayer = getNext(playerId)`.
        - [x] If `nextPlayer == roundLeaderId`:
            - [x] Round over: Clear `cardsOnTable` (cards are "gone").
            - [x] Current player leads next round: `roundLeaderId = playerId`, `currentPlayerId = playerId`.
        - [x] Else:
            - [x] `currentPlayerId = nextPlayer`.

#### 5. Frontend Implementation (`GameStore` & `GameComponent`)
- [x] **Interaction**:
    - [x] When it's the player's turn (and they are not the leader):
        - [x] Show "Take" button.
        - [x] Enable card selection to "Beat".
        - [x] Show "Beat" button when enough cards are selected and they validly beat the table.
- [x] **Visualizing the Table**:
    - [x] Display `cardsOnTable` clearly showing which card is beating which.

#### 6. Verification
- [x] **Test Beating**:
    - [x] Beat with higher rank/same suit.
    - [x] Beat with Trump.
    - [x] Beat with Joker.
    - [x] Fail to beat with lower rank/different suit (non-trump).
- [x] **Test Taking**:
    - [x] Verify cards are added to hand.
    - [x] Verify hand is filled from deck (if applicable).
    - [x] Verify next player leads.
- [x] **Test Beating Hand Filling**:
    - [x] Verify hand is filled from deck after beating cards.
- [x] **Test Round End**:
    - [x] Verify that when the round returns to the leader, the table is cleared and the last beating player leads.
