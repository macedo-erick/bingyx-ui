import { Component, computed, input } from '@angular/core';

import { injectTranslate } from '../../core/i18n/translate';
import { GameStatus } from '../models/game';

@Component({
  selector: 'bingyx-status-tag',
  template: `
    @if (live()) {
      <span class="dot" aria-hidden="true"></span>
    }
    {{ t('status.' + status()) }}
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: var(--bx-neutral);
      color: var(--bx-neutral-ink);
    }

    :host(.open) {
      background: var(--bx-pine-soft);
      color: var(--bx-pine);
    }

    :host(.live) {
      background: var(--p-primary-50);
      color: var(--p-primary-800);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--p-primary-color);
    }
  `,
  host: { '[class.open]': "status() === 'open'", '[class.live]': 'live()' },
})
export class BingyxStatusTag {
  readonly status = input.required<GameStatus>();

  protected readonly t = injectTranslate();
  protected readonly live = computed(() => ['running', 'checking'].includes(this.status()));
}
