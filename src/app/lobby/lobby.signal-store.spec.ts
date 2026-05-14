import {TestBed} from '@angular/core/testing';
import {LobbyStore} from './lobby.signal-store';
import {LobbyService, LobbyStatus} from '../api';
import {of, throwError} from 'rxjs';
import {createSpyFromClass} from 'jest-auto-spies';

describe('LobbyStore', () => {
    let lobbyServiceMock: jest.Mocked<LobbyService>;

    beforeEach(() => {
        lobbyServiceMock = createSpyFromClass(LobbyService, {methodsToSpyOn: ['createLobby', 'getLobbyStatus', 'joinLobby']});

        TestBed.configureTestingModule({
            providers: [
                LobbyStore,
                {provide: LobbyService, useValue: lobbyServiceMock},
            ],
        });
    });

    it('should be created', () => {
        const store = TestBed.inject(LobbyStore);
        expect(store).toBeTruthy();
        expect(store.currentLobby()).toBeUndefined();
        expect(store.isLoading()).toBeFalsy();
        expect(store.error()).toBeNull();
    });

    describe('hostGame', () => {
        it('should successfully host a game', () => {
            const store = TestBed.inject(LobbyStore);
            const mockLobby: LobbyStatus = {pin: '1234', status: 'WAITING', players: []};
            const joinedLobby: LobbyStatus = {
                pin: '1234',
                status: 'WAITING',
                players: [{name: 'Player1', isHost: true}]
            };

            lobbyServiceMock.createLobby.mockReturnValue(of(mockLobby));
            lobbyServiceMock.joinLobby.mockReturnValue(of(joinedLobby));

            store.hostGame('Player1');

            expect(store.currentLobby()).toEqual(joinedLobby);
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBeNull();
            expect(lobbyServiceMock.createLobby).toHaveBeenCalled();
            expect(lobbyServiceMock.joinLobby).toHaveBeenCalledWith({pin: '1234', playerName: 'Player1'});
        });

        it('should handle error when creating lobby fails', () => {
            const store = TestBed.inject(LobbyStore);

            lobbyServiceMock.createLobby.mockReturnValue(throwError(() => new Error('Creation failed')));

            store.hostGame('Player1');

            expect(store.currentLobby()).toBeUndefined();
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBe('Failed to create lobby');
        });

        it('should handle error when joining lobby fails after creation', () => {
            const store = TestBed.inject(LobbyStore);
            const mockLobby: LobbyStatus = {pin: '1234', status: 'WAITING', players: []};

            lobbyServiceMock.createLobby.mockReturnValue(of(mockLobby));
            lobbyServiceMock.joinLobby.mockReturnValue(throwError(() => new Error('Join failed')));

            store.hostGame('Player1');

            expect(store.currentLobby()).toBeUndefined();
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBe('Failed to join lobby after creation');
        });
    });

    describe('joinGame', () => {
        it('should successfully join a game', () => {
            const store = TestBed.inject(LobbyStore);
            const joinedLobby: LobbyStatus = {
                pin: '1234',
                status: 'WAITING',
                players: [{name: 'Player2', isHost: false}]
            };

            lobbyServiceMock.joinLobby.mockReturnValue(of(joinedLobby));

            store.joinGame({pin: '1234', playerName: 'Player2'});

            expect(store.currentLobby()).toEqual(joinedLobby);
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBeNull();
            expect(lobbyServiceMock.joinLobby).toHaveBeenCalledWith({pin: '1234', playerName: 'Player2'});
        });

        it('should handle error when joining lobby fails', () => {
            const store = TestBed.inject(LobbyStore);

            lobbyServiceMock.joinLobby.mockReturnValue(throwError(() => new Error('Not found')));

            store.joinGame({pin: '9999', playerName: 'Player1'});

            expect(store.currentLobby()).toBeUndefined();
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBe('Lobby not found or error joining.');
        });
    });
});
