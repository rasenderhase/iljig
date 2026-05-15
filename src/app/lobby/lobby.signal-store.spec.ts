import {TestBed} from '@angular/core/testing';
import {LobbyStore} from './lobby.signal-store';
import {JoinLobbyResponse, LobbyCreatedResponse, LobbyService, LobbyStatus} from '../api';
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
            const mockResponse: LobbyCreatedResponse = {pin: '1234', secret: 'host-secret'};
            const lobbyStatus: LobbyStatus = {
                pin: '1234',
                status: 'WAITING',
                players: [{name: 'Player1', isHost: true}]
            };
            const joinResponse: JoinLobbyResponse = {
                playerId: 'p1',
                lobbyStatus
            };

            lobbyServiceMock.createLobby.mockReturnValue(of(mockResponse));
            lobbyServiceMock.joinLobby.mockReturnValue(of(joinResponse));

            store.hostGame('Player1');

            expect(store.currentLobby()).toEqual(lobbyStatus);
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBeNull();
            expect(store.secret()).toBe('host-secret');
            expect(lobbyServiceMock.createLobby).toHaveBeenCalled();
            expect(lobbyServiceMock.joinLobby).toHaveBeenCalledWith({pin: '1234', playerName: 'Player1', secret: 'host-secret'});
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
            const mockResponse: LobbyCreatedResponse = {pin: '1234', secret: 'host-secret'};

            lobbyServiceMock.createLobby.mockReturnValue(of(mockResponse));
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
            const lobbyStatus: LobbyStatus = {
                pin: '1234',
                status: 'WAITING',
                players: [{name: 'Player2', isHost: false}]
            };
            const joinResponse: JoinLobbyResponse = {
                playerId: 'p2',
                lobbyStatus
            };

            lobbyServiceMock.getLobbyStatus.mockReturnValue(of(lobbyStatus));
            lobbyServiceMock.joinLobby.mockReturnValue(of(joinResponse));

            store.joinGame({pin: '1234', playerName: 'Player2'});

            expect(store.currentLobby()).toEqual(lobbyStatus);
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBeNull();
            expect(lobbyServiceMock.joinLobby).toHaveBeenCalledWith({pin: '1234', playerName: 'Player2'});
        });

        it('should handle error when getting lobby status fails', () => {
            const store = TestBed.inject(LobbyStore);
            lobbyServiceMock.getLobbyStatus.mockReturnValue(throwError(() => new Error('Not found')));

            store.joinGame({pin: '9999', playerName: 'Player1'});

            expect(store.currentLobby()).toBeUndefined();
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBe('Lobby not found');
        });

        it('should handle error when joining lobby fails', () => {
            const store = TestBed.inject(LobbyStore);
            const lobbyStatus: LobbyStatus = { pin: '1234', status: 'WAITING', players: [] };
            lobbyServiceMock.getLobbyStatus.mockReturnValue(of(lobbyStatus));
            lobbyServiceMock.joinLobby.mockReturnValue(throwError(() => new Error('Join failed')));

            store.joinGame({pin: '1234', playerName: 'Player1'});

            expect(store.currentLobby()).toBeUndefined();
            expect(store.isLoading()).toBeFalsy();
            expect(store.error()).toBe('Lobby not found or error joining.');
        });
    });
});
