import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

import { injectTranslate } from '../core/i18n/translate';

@Component({
  selector: 'bingyx-not-found-page',
  imports: [RouterLink, Button],
  template: `
    <div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <i class="pi pi-star text-4xl text-[var(--bx-pine)]" aria-hidden="true"></i>
      <h1 class="font-display m-0 text-2xl font-extrabold text-[var(--bx-pine)]">
        {{ t('notFound.title') }}
      </h1>
      <p class="m-0 text-[var(--p-text-muted-color)]">{{ t('notFound.message') }}</p>
      <p-button routerLink="/games" [label]="t('notFound.back')" />
    </div>
  `,
  host: { class: 'block h-full' },
})
export class NotFoundPage {
  protected readonly t = injectTranslate();
}
