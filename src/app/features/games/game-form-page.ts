import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FieldTree,
  FormField,
  applyEach,
  disabled,
  form,
  max,
  maxLength,
  min,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Observable, of, switchMap } from 'rxjs';

import { injectTranslate } from '../../core/i18n/translate';
import {
  EDITABLE_STATUSES,
  GameDetail,
  PRIZE_TYPES,
  Prize,
  PrizeType,
} from '../../shared/models/game';
import { BingyxPrizePattern } from '../../shared/ui/prize-pattern';
import { BingyxStatusTag } from '../../shared/ui/status-tag';
import { fromLocalInput, toLocalInput } from '../../shared/util/date';
import { GameService } from './game.service';

interface PrizeFormModel {
  type: PrizeType;
  enabled: boolean;
  quantity: number;
  description: string;
}

interface GameFormModel {
  name: string;
  scheduledAt: string;
  freeCenter: boolean;
  claimWindowSeconds: number;
  prizes: PrizeFormModel[];
}

const DEFAULT_ENABLED: Record<PrizeType, boolean> = {
  line: true,
  column: true,
  diagonal: false,
  full: true,
};

function emptyModel(): GameFormModel {
  return {
    name: '',
    scheduledAt: '',
    freeCenter: true,
    claimWindowSeconds: 10,
    prizes: PRIZE_TYPES.map((type) => ({
      type,
      enabled: DEFAULT_ENABLED[type],
      quantity: 1,
      description: '',
    })),
  };
}

function modelOf(game: GameDetail): GameFormModel {
  return {
    name: game.name,
    scheduledAt: toLocalInput(game.scheduledAt),
    freeCenter: game.freeCenter,
    claimWindowSeconds: game.claimWindowSeconds,
    prizes: game.prizes.map((prize) => ({ ...prize, description: prize.description ?? '' })),
  };
}

@Component({
  selector: 'bingyx-game-form-page',
  imports: [FormField, RouterLink, Button, InputText, BingyxPrizePattern, BingyxStatusTag],
  templateUrl: './game-form-page.html',
  styles: `
    .secondary-on-pine {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 44px;
      border: 1px solid var(--bx-pine-line);
      border-radius: var(--p-border-radius-md);
      background: transparent;
      color: var(--bx-cream);
      font-weight: 600;
      cursor: pointer;
    }

    .secondary-on-pine.filled {
      border-color: var(--p-primary-color);
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
    }

    .secondary-on-pine:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `,
})
export class GameFormPage {
  readonly id = input<string>();

  private readonly service = inject(GameService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = injectTranslate();

  protected readonly game = this.service.detail(() => this.id());
  protected readonly saving = signal<'draft' | 'open' | null>(null);

  protected readonly model = signal<GameFormModel>(emptyModel());

  protected readonly f = form(this.model, (path) => {
    required(path.name, { message: this.t('gameForm.nameRequired') });
    maxLength(path.name, 120);
    required(path.claimWindowSeconds);
    min(path.claimWindowSeconds, 3);
    max(path.claimWindowSeconds, 60);
    applyEach(path.prizes, (prize) => {
      disabled(prize.quantity, ({ valueOf }) => !valueOf(prize.enabled));
      disabled(prize.description, ({ valueOf }) => !valueOf(prize.enabled));
      min(prize.quantity, 1);
      max(prize.quantity, 20);
      maxLength(prize.description, 120);
    });
  });

  protected readonly isNew = computed(() => this.id() === undefined);
  protected readonly status = computed(() => this.game.value()?.status ?? 'draft');
  protected readonly locked = computed(() => !EDITABLE_STATUSES.includes(this.status()));
  protected readonly enabledPrizes = computed(() =>
    this.model().prizes.filter((prize) => prize.enabled),
  );
  protected readonly endsOnFullCard = computed(() =>
    this.enabledPrizes().some((prize) => prize.type === 'full'),
  );

  constructor() {
    effect(() => {
      const game = this.game.value();

      if (game) {
        this.f().reset(modelOf(game));
      }
    });
  }

  protected errorFor(field: FieldTree<string> | FieldTree<number>): string {
    const state = field();

    if (!state.touched() || !state.invalid()) {
      return '';
    }

    return state.errors()[0]?.message ?? this.t('gameForm.invalid');
  }

  protected save(andOpen: boolean): void {
    this.f().markAsTouched();

    if (this.f().invalid()) {
      this.f().errorSummary()[0]?.fieldTree?.().focusBoundControl();

      return;
    }

    if (this.enabledPrizes().length === 0) {
      this.messages.add({ severity: 'warn', summary: this.t('gameForm.noPrizes'), life: 5000 });

      return;
    }

    const value = this.model();
    const settings = {
      name: value.name.trim(),
      scheduledAt: fromLocalInput(value.scheduledAt),
      freeCenter: value.freeCenter,
      claimWindowSeconds: value.claimWindowSeconds,
    };
    const prizes: Prize[] = value.prizes.map((prize) => ({
      type: prize.type,
      enabled: prize.enabled,
      quantity: prize.quantity,
      description: prize.description.trim() === '' ? null : prize.description.trim(),
    }));
    const id = this.id();
    const saved: Observable<GameDetail> =
      id === undefined ? this.service.create(settings) : this.service.update(id, settings);

    this.saving.set(andOpen ? 'open' : 'draft');
    saved
      .pipe(
        switchMap((game) => this.service.configurePrizes(game.id, prizes)),
        switchMap((game) =>
          andOpen && game.status === 'draft' ? this.service.open(game.id) : of(game),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (game) => {
          this.saving.set(null);
          this.messages.add({
            severity: 'success',
            summary: this.t(andOpen ? 'gameForm.opened' : 'gameForm.saved', { name: game.name }),
            life: 3000,
          });
          void this.router.navigate(andOpen ? ['/games', game.id, 'invites'] : ['/games']);
        },
        error: () => this.saving.set(null),
      });
  }
}
