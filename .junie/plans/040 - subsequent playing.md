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
- **`GameStatus`**:
    - Add `cardsOnTable`: A list of lists of `Card` objects. Each sub-list represents a "stack" (bottom card and the card beating it).
    - Add `currentPlayerId`: The ID of the player whose turn it is.
    - Add `roundLeaderId`: The ID of the player who started the current round (to check if the round should end after beating).
- **Update Endpoint**: `POST /api/game/{pin}/play`
    - Add an optional boolean field `takeCards` to the request body.
    - If `takeCards` is true, the `cards` list can be empty.
- **Validation**:
    - Player must be `currentPlayerId`.
    - If beating:
        - Number of cards played must match the number of "top" cards on the table.
        - Each played card must validly beat one of the top cards (implementation should allow the player to specify which card beats which if ambiguous, but usually it's automated or simple).
    - If taking:
        - `takeCards` must be true.

#### 4. Backend Implementation (`GameService.java`)
- **State Management**:
    - Track `currentPlayerId`, `roundLeaderId`, and `cardsOnTable`.
- **Beating Logic**:
    - Implement `canBeat(Card attacker, Card defender, Suit trumpSuit)`.
    - Rank comparison: A > 2 > 3 > K > Q > J > 10 > 9 > 8 > 7.
    - Special case: Joker suit/rank.
- **Round Logic**:
    - `onTake(playerId)`:
        - Add all cards from `cardsOnTable` to player's hand.
        - Clear `cardsOnTable`.
        - Fill the player's hand with cards from the deck up to `initialCardsPerPlayer` (If possible and if player has less than `initialCardsPerPlayer` cards in their hand).
        - Remove the filled cards from the deck.
        - Set `roundLeaderId` and `currentPlayerId` to the next player.
    - `onBeat(playerId, List<Card> cards)`:
        - Validate beating conditions.
        - Add cards to `cardsOnTable` (stacked on top).
        - Remove played cards from the player's hand.
        - Fill the player's hand with cards from the deck up to `initialCardsPerPlayer` (If possible and if player has less than `initialCardsPerPlayer` cards in their hand).
        - Remove the filled cards from the deck.
        - Determine next player: `nextPlayer = getNext(playerId)`.
        - If `nextPlayer == roundLeaderId`:
            - Round over: Clear `cardsOnTable` (cards are "gone").
            - Current player leads next round: `roundLeaderId = playerId`, `currentPlayerId = playerId`.
        - Else:
            - `currentPlayerId = nextPlayer`.

#### 5. Frontend Implementation (`GameStore` & `GameComponent`)
- **Interaction**:
    - When it's the player's turn (and they are not the leader):
        - Show "Take" button.
        - Enable card selection to "Beat".
        - Show "Beat" button when enough cards are selected and they validly beat the table.
- **Visualizing the Table**:
    - Display `cardsOnTable` clearly showing which card is beating which.

#### 6. Verification
- **Test Beating**:
    - Beat with higher rank/same suit.
    - Beat with Trump.
    - Beat with Joker.
    - Fail to beat with lower rank/different suit (non-trump).
- **Test Taking**:
    - Verify cards are added to hand.
    - Verify hand is filled from deck (if applicable).
    - Verify next player leads.
- **Test Beating Hand Filling**:
    - Verify hand is filled from deck after beating cards.
- **Test Round End**:
    - Verify that when the round returns to the leader, the table is cleared and the last beating player leads.
