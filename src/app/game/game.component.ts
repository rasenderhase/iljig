import { ChangeDetectionStrategy, Component, inject, OnInit, input, computed } from '@angular/core';
import { GameStore } from './game.signal-store';
import {Card} from "../api";

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  providers: [GameStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent implements OnInit {
  readonly store = inject(GameStore);

  pin = input.required<string>();
  playerId = input<string>();

  isHost = computed(() => {
    return this.store.lobby()?.isHost ?? false;
  });

  canStart = computed(() => {
    const players = this.store.lobby()?.players ?? [];
    return this.isHost() && players.length >= 2;
  });

  isLeading = computed(() => {
    const lobby = this.store.lobby();
    const pId = this.playerId();
    const lId = lobby?.leadingPlayerId;
    return !!pId && lId === pId;
  });

  isCurrentPlayer = computed(() => {
    const lobby = this.store.lobby();
    const pId = this.playerId();
    const cId = lobby?.currentPlayerId;
    return !!pId && cId === pId;
  });

  canPlay = computed(() => {
    if (!this.isCurrentPlayer()) return false;
    const lobby = this.store.lobby();
    if (!lobby) return false;

    if (this.isLeading() && (!lobby.cardsOnTable || lobby.cardsOnTable.length === 0)) {
      return this.isValidLead();
    } else {
      // Beating logic
      const selected = this.store.selectedCards();
      const topCards = lobby.cardsOnTable?.filter((stack: Card[]) => stack.length === 1).map((stack: Card[]) => stack[0]) ?? [];
      return selected.length > 0 && selected.length === topCards.length;
    }
  });

  leadingPlayerName = computed(() => {
    const lobby = this.store.lobby();
    if (!lobby) return '';
    return lobby.players?.find(p => p.id === lobby.leadingPlayerId)?.name ?? 'Unknown';
  });

  currentPlayerName = computed(() => {
    const lobby = this.store.lobby();
    if (!lobby) return '';
    return lobby.players?.find(p => p.id === lobby.currentPlayerId)?.name ?? 'Unknown';
  });

  isValidLead = computed(() => {
    const selected = this.store.selectedCards();
    const lobby = this.store.lobby();
    if (!lobby || selected.length === 0) return false;

    // Must be odd
    if (selected.length % 2 === 0) return false;

    // Bounds
    const initialCards = lobby.initialCardsPerPlayer ?? 7;
    const minHandSize = Math.min(...(lobby.playerHands?.map(h => h.cardCount ?? 0) ?? []), lobby.cards?.length ?? 0);
    const deckEmpty = (lobby.remainingDeckCount ?? 0) === 0;

    if (deckEmpty) {
      if (selected.length > minHandSize) return false;
    } else {
      if (selected.length > initialCards - 2) return false;
    }

    // Composition
    const counts = new Map<string, number>();
    for (const card of selected) {
      const key: string = card.suit === 'JOKER' ? `JOKER_${card.rank}` : card.rank + '';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    let oddRanks = 0;
    for (const count of counts.values()) {
      if (count % 2 !== 0) oddRanks++;
    }

    return oddRanks === 1;
  });

  ngOnInit() {
    this.store.startPolling(computed(() => ({pin: this.pin(), playerId: this.playerId()})));
  }

  startGame() {
    this.store.startGame(this.pin());
  }

  toggleCard(card: Card) {
    this.store.toggleCardSelection(card);
  }

  isCardSelected(card: Card) {
    return this.store.selectedCards().some(c => c.suit === card.suit && c.rank === card.rank);
  }

  playCards() {
    const pid = this.playerId();
    if (pid) {
      this.store.playCards({pin: this.pin(), playerId: pid});
    }
  }

  takeCards() {
    const pid = this.playerId();
    if (pid) {
      this.store.playCards({pin: this.pin(), playerId: pid, takeCards: true});
    }
  }
}
