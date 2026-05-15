import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LobbyStore } from './lobby.signal-store';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent {
  readonly store = inject(LobbyStore);

  pin = signal('');
  playerName = signal('');

  hostGame() {
    if (!this.playerName()) return;
    this.store.hostGame(this.playerName());
  }

  joinGame() {
    if (!this.pin() || !this.playerName()) return;
    this.store.joinGame({ pin: this.pin(), playerName: this.playerName() });
  }
}
