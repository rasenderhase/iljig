import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {Card, GameService, GameStatus} from '../api';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap, timer, catchError, of} from 'rxjs';
import {LobbyStore} from '../lobby/lobby.signal-store';

export interface GameState {
    lobby: GameStatus | undefined;
    isLoading: boolean;
    error: string | null;
    isPolling: boolean;
    selectedCards: Card[];
}

const initialState: GameState = {
    lobby: undefined,
    isLoading: false,
    error: null,
    isPolling: false,
    selectedCards: [],
};

export const GameStore = signalStore(
    withState(initialState),
    withMethods((store, gameService = inject(GameService), lobbyStore = inject(LobbyStore)) => ({
        toggleCardSelection: (card: Card) => {
            const current = store.selectedCards();
            const index = current.findIndex(c => c.suit === card.suit && c.rank === card.rank);
            if (index >= 0) {
                patchState(store, {selectedCards: current.filter((_, i) => i !== index)});
            } else {
                patchState(store, {selectedCards: [...current, card]});
            }
        },
        playCards: rxMethod<{ pin: string; playerId: string; takeCards?: boolean }>(
            pipe(
                tap(() => patchState(store, {isLoading: true, error: null})),
                switchMap(({pin, playerId, takeCards}) => {
                    const cards = takeCards ? [] : store.selectedCards();
                    return gameService.playCards(pin, {playerId, cards, takeCards}).pipe(
                        tap({
                            next: () => {
                                patchState(store, {isLoading: false, selectedCards: []});
                            },
                            error: (err) => patchState(store, {
                                error: 'Failed to play cards. ' + (err.status === 400 ? 'Invalid combination.' : ''),
                                isLoading: false
                            }),
                        })
                    );
                })
            )
        ),
        startPolling: rxMethod<{ pin: string; playerId?: string }>(
            pipe(
                tap((params) => {
                    patchState(store, {isPolling: true, isLoading: true});
                }),
                switchMap(({pin, playerId}) =>
                    timer(0, 3000).pipe(
                        switchMap(() => {
                            const request = playerId
                                ? gameService.getPlayerGameStatus(pin, playerId)
                                : gameService.getGameStatus(pin);

                            return request.pipe(
                                tap((game) => {
                                    patchState(store, {lobby: game, isLoading: false});
                                }),
                                catchError((err) => {
                                    patchState(store, {error: 'Failed to load game', isLoading: false});
                                    return of(null);
                                })
                            );
                        }),
                        // Stop polling if game status is no longer WAITING
                        tap((game) => {
                            if (game && game.status === 'STARTING') {
                                // Once we are in STARTING, we might want to poll faster or handle transitions
                                // For now, keep polling
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
