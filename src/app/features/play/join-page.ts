import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldTree, FormField, form, maxLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { injectTranslate } from '../../core/i18n/translate';
import { PlayerSession } from '../../core/player/player-session';
import { BingyxLogo } from '../../shared/ui/logo';
import { BingyxSnowfall } from '../../shared/ui/snowfall';
import { formatDayTime } from '../../shared/util/date';
import { PlayerApi } from './player-api.service';

@Component({
  selector: 'bingyx-join-page',
  imports: [FormField, Button, InputText, BingyxLogo, BingyxSnowfall],
  templateUrl: './join-page.html',
  host: { class: 'relative block min-h-full bg-[var(--bx-pine-deep)]' },
})
export class JoinPage {
  readonly code = input.required<string>();

  private readonly api = inject(PlayerApi);
  private readonly session = inject(PlayerSession);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = injectTranslate();
  protected readonly formatDayTime = formatDayTime;

  protected readonly invitation = this.api.invitation(() => this.code());
  protected readonly joining = signal(false);
  protected readonly closedOnArrival = signal(false);

  protected readonly model = signal({ firstName: '', lastName: '' });
  protected readonly f = form(this.model, (path) => {
    required(path.firstName, { message: this.t('join.firstNameRequired') });
    required(path.lastName, { message: this.t('join.lastNameRequired') });
    maxLength(path.firstName, 60);
    maxLength(path.lastName, 60);
  });

  protected readonly open = computed(() => {
    const invitation = this.invitation.value();

    return (
      invitation !== undefined &&
      invitation.registrationOpen &&
      invitation.status !== 'draft' &&
      invitation.status !== 'finished' &&
      !this.closedOnArrival()
    );
  });

  constructor() {
    effect(() => {
      if (this.session.isFor(this.code())) {
        void this.router.navigate(['/play'], { replaceUrl: true });
      }
    });
  }

  protected errorFor(field: FieldTree<string>): string {
    const state = field();

    return state.touched() && state.invalid() ? (state.errors()[0]?.message ?? '') : '';
  }

  protected submit(): void {
    this.f().markAsTouched();

    if (this.f().invalid()) {
      this.f().errorSummary()[0]?.fieldTree?.().focusBoundControl();

      return;
    }

    const { firstName, lastName } = this.model();

    this.joining.set(true);
    this.api
      .join(this.code(), firstName.trim(), lastName.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (seat) => {
          this.session.start(this.code(), seat.playerToken);
          void this.router.navigate(['/play']);
        },
        error: (error: { status?: number }) => {
          this.joining.set(false);

          if (error.status === 409) {
            this.closedOnArrival.set(true);
          }
        },
      });
  }
}
