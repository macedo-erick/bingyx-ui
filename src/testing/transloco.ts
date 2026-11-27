import { TranslocoTestingModule } from '@jsverse/transloco';

import ptBR from '../../public/i18n/pt-BR.json';

export function provideTestingTransloco() {
  return TranslocoTestingModule.forRoot({
    langs: { 'pt-BR': ptBR },
    translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
    preloadLangs: true,
  });
}
