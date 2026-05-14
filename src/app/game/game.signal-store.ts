import {patchState, signalStore, withMethods, withState, WritableStateSource} from '@ngrx/signals';
import {inject} from '@angular/core';
import {GameService, LobbyService, LobbyStatus, Player} from '../api';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap, timer, map, catchError, of, repeat} from 'rxjs';

export interface GameState {
    lobby: LobbyStatus | undefined;
    isLoading: boolean;
    error: string | null;
    isPolling: boolean;
}

const initialState: GameState = {
    lobby: undefined,
    isLoading: false,
    error: null,
    isPolling: false,
};

export const GameStore = signalStore(
    withState(initialState),
    withMethods((store: WritableStateSource<GameState>, lobbyService = inject(LobbyService), gameService = inject(GameService)) => ({
        loadLobby: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((pin) =>
                    lobbyService.getLobbyStatus(pin).pipe(
                        tap({
                            next: (lobby) => patchState(store, {lobby, isLoading: false}),
                            error: (_err) => patchState(store, {error: 'Failed to load lobby', isLoading: false}),
                        })
                    )
                )
            )
        ),
        startPolling: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isPolling: true})),
                switchMap((pin) =>
                    timer(0, 3000).pipe(
                        switchMap(() =>
                            lobbyService.getLobbyStatus(pin).pipe(
                                tap((lobby) => patchState(store, {lobby})),
                                catchError(() => of(null))
                            )
                        ),
                        // Stop polling if game status is no longer WAITING
                        tap((lobby) => {
                            if (lobby && lobby.status !== 'WAITING') {
                                patchState(store, {isPolling: false});
                            }
                        })
                    )
                )
            )
        ),
        startGame: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((pin) =>
                    gameService.startGame(pin).pipe(
                        tap({
                            next: () => {
                                patchState(store, {isLoading: false});
                                // The poll will eventually pick up the status change
                            },
                            error: (err) => patchState(store, {
                                error: err.status === 403 ? 'Only the host can start the game.' : 'Failed to start game.',
                                isLoading: false
                            }),
                        })
                    )
                )
            )
        ),
    }))
);
