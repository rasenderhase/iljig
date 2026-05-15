import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiModule, Configuration } from './api';

import { routes } from './app.routes';
import { LobbyStore } from './lobby/lobby.signal-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    LobbyStore,
    ...(ApiModule.forRoot(() => new Configuration()).providers || [])
  ]
};
