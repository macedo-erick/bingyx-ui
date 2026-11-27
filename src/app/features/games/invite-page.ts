import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { toDataURL } from 'qrcode';

import { injectTranslate } from '../../core/i18n/translate';
import { PlayerSession } from '../../core/player/player-session';
import { cardLabel } from '../../shared/models/player';
import { BingyxStatusTag } from '../../shared/ui/status-tag';
import { GameService } from './game.service';

const ROSTER_REFRESH_MS = 10_000;

@Component({
  selector: 'bingyx-invite-page',
  imports: [FormsModule, RouterLink, Button, InputText, ToggleSwitch, BingyxStatusTag],
  templateUrl: './invite-page.html',
})
export class InvitePage {
  readonly id = input.required<string>();

  private readonly service = inject(GameService);
  private readonly session = inject(PlayerSession);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = injectTranslate();
  protected readonly cardLabel = cardLabel;

  protected readonly game = this.service.detail(() => this.id());
  protected readonly roster = this.service.participants(() => this.id());
  protected readonly qrCode = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly link = computed(() => {
    const code = this.game.value()?.code;

    return code === undefined ? '' : new URL(`j/${code}`, document.baseURI).href;
  });
  protected readonly canToggle = computed(() =>
    ['open', 'running', 'checking'].includes(this.game.value()?.status ?? ''),
  );

  constructor() {
    effect(() => {
      const link = this.link();

      if (link === '') {
        return;
      }

      const pine = getComputedStyle(document.documentElement).getPropertyValue('--bx-pine').trim();

      void toDataURL(link, {
        margin: 1,
        width: 480,
        errorCorrectionLevel: 'M',
        color: { dark: pine || '#000000', light: '#ffffffff' },
      }).then((url) => this.qrCode.set(url));
    });

    const timer = setInterval(() => this.roster.reload(), ROSTER_REFRESH_MS);

    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected copy(): void {
    void navigator.clipboard
      .writeText(this.link())
      .then(() =>
        this.messages.add({ severity: 'success', summary: this.t('invite.copied'), life: 2500 }),
      );
  }

  protected openRegistration(): void {
    this.busy.set(true);
    this.service
      .open(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.game.reload();
        },
        error: () => this.busy.set(false),
      });
  }

  protected setRegistration(open: boolean): void {
    this.service
      .setRegistration(this.id(), open)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.game.reload(), error: () => this.game.reload() });
  }

  protected play(): void {
    const code = this.game.value()?.code;

    if (code === undefined) {
      return;
    }

    this.busy.set(true);
    this.service
      .play(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (seat) => {
          this.busy.set(false);
          this.session.start(code, seat.playerToken);
          void this.router.navigate(['/play']);
        },
        error: () => this.busy.set(false),
      });
  }
}
