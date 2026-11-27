import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Observable } from 'rxjs';

import { injectTranslate } from '../../core/i18n/translate';
import { LiveChannel } from '../../core/realtime/live-channel';
import { letterOf } from '../../shared/models/live';
import { cardLabel } from '../../shared/models/player';
import { BingyxBallBoard } from '../../shared/ui/ball-board';
import { BingyxStatusTag } from '../../shared/ui/status-tag';
import { injectCountdown } from '../../shared/util/countdown';
import { GameService } from './game.service';

const RECENT_BALLS = 5;

@Component({
  selector: 'bingyx-control-page',
  imports: [RouterLink, Button, BingyxBallBoard, BingyxStatusTag],
  templateUrl: './control-page.html',
  styles: `
    .draw-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      min-height: 60px;
      border: none;
      border-radius: 14px;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-size: 19px;
      font-weight: 800;
      box-shadow: 0 6px 0 var(--p-primary-800);
      cursor: pointer;
    }

    .draw-button:active:not(:disabled) {
      transform: translateY(3px);
      box-shadow: 0 3px 0 var(--p-primary-800);
    }

    .draw-button:disabled {
      background: var(--bx-pine-line);
      color: var(--bx-pine-ink);
      box-shadow: none;
      cursor: not-allowed;
    }
  `,
  providers: [LiveChannel],
})
export class ControlPage {
  readonly id = input.required<string>();

  private readonly service = inject(GameService);
  private readonly channel = inject(LiveChannel);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = injectTranslate();
  protected readonly cardLabel = cardLabel;
  protected readonly letterOf = letterOf;

  protected readonly view = this.service.live(() => this.id());
  protected readonly busy = signal(false);

  protected readonly lastBall = computed(() => this.view.value()?.draws.at(-1));
  protected readonly recentBalls = computed(() =>
    (this.view.value()?.draws ?? []).slice(0, -1).slice(-RECENT_BALLS).reverse(),
  );
  protected readonly secondsLeft = injectCountdown(() => this.view.value()?.window?.closesAt);
  protected readonly screenLink = computed(() => {
    const code = this.view.value()?.code;

    return code === undefined ? '' : new URL(`s/${code}`, document.baseURI).href;
  });

  constructor() {
    const code = computed(() => this.view.value()?.code);

    effect(() => {
      const current = code();

      if (current !== undefined) {
        this.channel.follow(current);
      }
    });

    effect(() => {
      if (this.channel.snapshot() !== undefined) {
        this.view.reload();
      }
    });
  }

  protected start(): void {
    this.run(this.service.start(this.id()));
  }

  protected draw(): void {
    this.run(this.service.draw(this.id()));
  }

  protected finish(): void {
    this.confirm.confirm({
      header: this.t('control.finishHeader'),
      message: this.t('control.finishMessage'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.t('control.finish'),
      rejectLabel: this.t('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.run(this.service.finish(this.id())),
    });
  }

  private run(action: Observable<unknown>): void {
    this.busy.set(true);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.view.reload();
      },
      error: () => {
        this.busy.set(false);
        this.view.reload();
      },
    });
  }
}
