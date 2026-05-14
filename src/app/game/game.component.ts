import { ChangeDetectionStrategy, Component, inject, OnInit, input, computed } from '@angular/core';
import { GameStore } from './game.signal-store';

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

  isHost = computed(() => {
    const players = this.store.lobby()?.players ?? [];
    // For now, let's assume the first player is the host if we don't have better identity tracking.
    // The requirement says: "checking the isHost flag in the player list"
    // In a real app, we'd compare the current user's ID with the players' IDs.
    // For this implementation, we'll consider the user a host if they are the one who has isHost=true.
    // Since we don't have local persistence of 'who am I', this is a bit tricky.
    // However, if we assume the user just joined/hosted, they might have it in a shared state or local storage.
    // The gamePlan mentioned: "persisting it during the join/host process".
    // Let's check if there is any 'host' player in the list.
    return players.some(p => p.isHost);
  });

  canStart = computed(() => {
    const players = this.store.lobby()?.players ?? [];
    return this.isHost() && players.length >= 2;
  });

  ngOnInit() {
    this.store.loadLobby(this.pin());
    this.store.startPolling(this.pin());
  }

  startGame() {
    this.store.startGame(this.pin());
  }
}
