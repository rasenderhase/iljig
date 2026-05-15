import {patchState, signalStore, withMethods, withState, WritableStateSource} from '@ngrx/signals';
import {inject} from '@angular/core';
import {LobbyService, LobbyStatus} from '../api';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap, map, catchError, of} from 'rxjs';
import {Router} from '@angular/router';

export interface LobbyState {
    currentLobby: LobbyStatus | undefined;
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
    withMethods((store: WritableStateSource<LobbyState>, lobbyService = inject(LobbyService), router = inject(Router)) => ({
        hostGame: rxMethod<string>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap((playerName) =>
                    lobbyService.createLobby().pipe(
                        switchMap((response) => {
                            const pin = response.pin!;
                            const secret = response.secret!;
                            patchState(store, {secret});
                            return lobbyService.joinLobby({pin, playerName, secret}).pipe(
                                tap({
                                    next: (joinResponse) => {
                                        patchState(store, {
                                            currentLobby: joinResponse.lobbyStatus,
                                            isLoading: false
                                        });
                                        router.navigate(['/game', joinResponse.lobbyStatus!.pin!, 'player', joinResponse.playerId!]);
                                    },
                                    error: (_err) => patchState(store, {
                                        error: 'Failed to join lobby after creation',
                                        isLoading: false
                                    }),
                                })
                            );
                        }),
                        tap({
                            error: (_err) => {
                                patchState(store, (state) => {
                                    const error = state.error ? state.error : 'Failed to create lobby';
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
                    lobbyService.getLobbyStatus(params.pin).pipe(
                        switchMap((lobby) => {
                            if (lobby.players && lobby.players.length >= 9) {
                                patchState(store, {error: 'Game is full (max 9 players)', isLoading: false});
                                return of(null);
                            }
                            return lobbyService.joinLobby(params).pipe(
                                tap({
                                    next: (joinResponse) => {
                                        patchState(store, {currentLobby: joinResponse.lobbyStatus, isLoading: false});
                                        router.navigate(['/game', joinResponse.lobbyStatus!.pin!, 'player', joinResponse.playerId!]);
                                    },
                                }),
                                catchError((_err) => {
                                    patchState(store, {
                                        error: 'Lobby not found or error joining.',
                                        isLoading: false
                                    });
                                    return of(null);
                                })
                            );
                        }),
                        catchError((_err) => {
                            patchState(store, {error: 'Lobby not found', isLoading: false});
                            return of(null);
                        })
                    )
                )
            )
        ),
    }))
);
