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
  playerId = input<string>();

  isHost = computed(() => {
    return this.store.lobby()?.isHost ?? false;
  });

  canStart = computed(() => {
    const players = this.store.lobby()?.players ?? [];
    return this.isHost() && players.length >= 2;
  });

  ngOnInit() {
    this.store.startPolling({pin: this.pin(), playerId: this.playerId()});
  }

  startGame() {
    this.store.startGame(this.pin());
  }
}
