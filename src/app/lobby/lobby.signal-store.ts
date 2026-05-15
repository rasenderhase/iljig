import {patchState, signalStore, withMethods, withState, WritableStateSource} from '@ngrx/signals';
import {inject} from '@angular/core';
import {GameService, GameStatus} from '../api';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap, map, catchError, of} from 'rxjs';
import {Router} from '@angular/router';

export interface LobbyState {
    currentLobby: GameStatus | undefined;
    secret: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: LobbyState = {
    currentLobby: undefined,
    secret: null,
    isLoading: false,
    error: null,
};

export const LobbyStore = signalStore(
    withState(initialState),
    withMethods((store: WritableStateSource<LobbyState>, gameService = inject(GameService), router = inject(Router)) => ({
        hostGame: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((playerName) =>
                    gameService.createGame().pipe(
                        switchMap((response) => {
                            const pin = response.pin!;
                            const secret = response.secret!;
                            patchState(store, {secret});
                            return gameService.joinGame({pin, playerName, secret}).pipe(
                                tap({
                                    next: (joinResponse) => {
                                        patchState(store, {
                                            currentLobby: joinResponse.gameStatus,
                                            isLoading: false
                                        });
                                        router.navigate(['/game', joinResponse.gameStatus!.pin!, 'player', joinResponse.playerId!]);
                                    },
                                    error: (_err) => patchState(store, {
                                        error: 'Failed to join game after creation',
                                        isLoading: false
                                    }),
                                })
                            );
                        }),
                        tap({
                            error: (_err) => {
                                patchState(store, (state) => {
                                    const error = state.error ? state.error : 'Failed to create game';
                                    return {
                                        ...state,
                                        error,
                                        isLoading: false
                                    };
                                });
                            },
                        })
                    )
                )
            )
        ),
        joinGame: rxMethod<{ pin: string; playerName: string }>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((params) =>
                    gameService.getGameStatus(params.pin).pipe(
                        switchMap((game) => {
                            if (game.players && game.players.length >= 9) {
                                patchState(store, {error: 'Game is full (max 9 players)', isLoading: false});
                                return of(null);
                            }
                            return gameService.joinGame(params).pipe(
                                tap({
                                    next: (joinResponse) => {
                                        patchState(store, {currentLobby: joinResponse.gameStatus, isLoading: false});
                                        router.navigate(['/game', joinResponse.gameStatus!.pin!, 'player', joinResponse.playerId!]);
                                    },
                                }),
                                catchError((_err) => {
                                    patchState(store, {
                                        error: 'Game not found or error joining.',
                                        isLoading: false
                                    });
                                    return of(null);
                                })
                            );
                        }),
                        catchError((_err) => {
                            patchState(store, {error: 'Game not found', isLoading: false});
                            return of(null);
                        })
                    )
                )
            )
        ),
    }))
);
