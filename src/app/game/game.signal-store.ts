import {patchState, signalStore, withMethods, withState, WritableStateSource} from '@ngrx/signals';
import {inject} from '@angular/core';
import {GameService, GameStatus} from '../api';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap, timer, catchError, of} from 'rxjs';
import {LobbyStore} from '../lobby/lobby.signal-store';

export interface GameState {
    lobby: GameStatus | undefined;
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
    withMethods((store: WritableStateSource<GameState>, gameService = inject(GameService), lobbyStore = inject(LobbyStore)) => ({
        startPolling: rxMethod<{ pin: string; playerId?: string }>(
            pipe(
                tap(() => patchState(store, {isPolling: true, isLoading: true})),
                switchMap(({pin, playerId}) =>
                    timer(0, 3000).pipe(
                        switchMap(() => {
                            const request = playerId
                                ? gameService.getPlayerGameStatus(pin, playerId)
                                : gameService.getGameStatus(pin);

                            return request.pipe(
                                tap((game) => patchState(store, {lobby: game, isLoading: false})),
                                catchError((err) => {
                                    patchState(store, {error: 'Failed to load game', isLoading: false});
                                    return of(null);
                                })
                            );
                        }),
                        // Stop polling if game status is no longer WAITING
                        tap((game) => {
                            if (game && game.status !== 'WAITING') {
                                // Maybe we continue polling if IN_GAME later, but for now stick to WAITING
                            }
                        })
                    )
                )
            )
        ),
        startGame: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((pin) => {
                    const secret = lobbyStore.secret();
                    if (!secret) {
                        patchState(store, {error: 'No secret found. Are you the host?', isLoading: false});
                        return of(null);
                    }
                    return gameService.startGame(pin, secret).pipe(
                        tap({
                            next: () => {
                                patchState(store, {isLoading: false});
                            },
                            error: (err) => patchState(store, {
                                error: err.status === 403 ? 'Only the host can start the game.' : 'Failed to start game.',
                                isLoading: false
                            }),
                        })
                    );
                })
            )
        ),
    }))
);
