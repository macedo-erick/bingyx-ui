import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { includeBearerTokenInterceptor } from 'keycloak-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { keycloakBearerTokenConfig, provideKeycloakAuth } from './core/auth/keycloak.providers';
import { errorInterceptor } from './core/http/error.interceptor';
import { PRIMENG_PT_BR } from './core/i18n/primeng-translations';
import { TranslatedTitleStrategy } from './core/i18n/translated-title.strategy';
import { TranslationLoader } from './core/i18n/translation-loader';
import { ChristmasPreset } from './core/theme/christmas-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideKeycloakAuth(),
    keycloakBearerTokenConfig,
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor, errorInterceptor])),
    providePrimeNG({
      // Overlays in <body>: laid out inside the trigger they overflow a phone's viewport.
      overlayAppendTo: 'body',
      theme: {
        preset: ChristmasPreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
      translation: PRIMENG_PT_BR,
      license: environment.primeUiLicense,
    }),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR'],
        defaultLang: 'pt-BR',
        reRenderOnLangChange: false,
        prodMode: environment.production,
      },
      loader: TranslationLoader,
    }),
    provideAppInitializer(() => inject(TranslocoService).load('pt-BR')),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    MessageService,
    ConfirmationService,
  ],
};
