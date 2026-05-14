import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../api/api/lobby.service';
import { LobbyStatus } from '../api/model/lobbyStatus';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent {
  pin: string = '';
  playerName: string = '';
  currentLobby?: LobbyStatus;

  constructor(private lobbyService: LobbyService, private router: Router) {}

  hostGame() {
    this.lobbyService.createLobby().subscribe(lobby => {
      this.currentLobby = lobby;
      this.pin = lobby.pin!;
      // Automatically join as host after creating
      this.joinGame();
    });
  }

  joinGame() {
    if (!this.pin || !this.playerName) return;
    
    this.lobbyService.joinLobby({ pin: this.pin, playerName: this.playerName })
      .subscribe({
        next: (lobby) => {
          this.currentLobby = lobby;
          // Navigation logic to a "Waiting Room" could go here
          console.log('Joined lobby:', lobby);
        },
        error: (err) => alert('Lobby not found or error joining.')
      });
  }
}
