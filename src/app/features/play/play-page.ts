import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { injectTranslate } from '../../core/i18n/translate';
import { PlayerSession } from '../../core/player/player-session';
import { LiveChannel } from '../../core/realtime/live-channel';
import { PrizeType } from '../../shared/models/game';
import { letterOf } from '../../shared/models/live';
import { cardLabel } from '../../shared/models/player';
import { BingyxBingoCard } from '../../shared/ui/bingo-card';
import { BingyxConfetti } from '../../shared/ui/confetti';
import { BingyxLogo } from '../../shared/ui/logo';
import { completedBy } from '../../shared/util/patterns';
import { PlayerApi } from './player-api.service';

// The socket says when something changed; the slow poll only covers a socket that went quiet.
const POLL_MS = 15_000;
const RECENT_BALLS = 5;

type Feedback = 'sent' | 'rejected' | null;

@Component({
  selector: 'bingyx-play-page',
  imports: [BingyxBingoCard, BingyxConfetti, BingyxLogo],
  templateUrl: './play-page.html',
  styles: `
    .bingo {
      width: 100%;
      min-height: 64px;
      border: none;
      border-radius: 16px;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 2px;
      box-shadow: 0 6px 0 var(--p-primary-800);
      cursor: pointer;
    }

    .bingo.ready {
      background: var(--bx-gold);
      color: var(--bx-pine-deep);
      box-shadow:
        0 6px 0 var(--bx-gold-ink),
        0 0 0 6px color-mix(in srgb, var(--bx-gold), transparent 75%);
    }

    .ball-enter {
      animation: ball-in 600ms cubic-bezier(0.2, 1.4, 0.4, 1);
    }

    @keyframes ball-in {
      from {
        transform: translateY(-30%) scale(0.5) rotate(-180deg);
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ball-enter {
        animation: none;
      }
    }

    .bingo:disabled {
      opacity: 0.7;
    }

    .bingo:active:not(:disabled) {
      transform: translateY(3px);
      box-shadow: 0 3px 0 var(--p-primary-800);
    }
  `,
  providers: [LiveChannel],
  host: { class: 'block min-h-full bg-[var(--bx-pine-deep)]' },
})
export class PlayPage {
  protected readonly session = inject(PlayerSession);
  private readonly api = inject(PlayerApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly channel = inject(LiveChannel);
  protected readonly state = this.api.state();
  protected readonly t = injectTranslate();
  protected readonly cardLabel = cardLabel;
  protected readonly letterOf = letterOf;

  private readonly inFlight = signal(0);
  protected readonly claiming = signal(false);
  protected readonly feedback = signal<Feedback>(null);

  protected readonly marked = linkedSignal<readonly number[]>(
    () => this.state.value()?.card.marked ?? [],
  );

  protected readonly live = computed(() => this.state.value()?.live);
  protected readonly inPlay = computed(() =>
    ['running', 'checking'].includes(this.live()?.status ?? ''),
  );
  protected readonly lastBall = computed(() => this.live()?.draws.at(-1));
  protected readonly lastBallKeyed = computed(() => {
    const ball = this.lastBall();

    return ball === undefined ? [] : [ball];
  });
  // Bursts only when a win appears while the page is open, not for wins already on load.
  protected readonly celebrate = signal<number | null>(null);
  protected readonly recentBalls = computed(() =>
    (this.live()?.draws ?? []).slice(0, -1).slice(-RECENT_BALLS).reverse(),
  );

  protected readonly claimable = computed<PrizeType[]>(() => {
    const state = this.state.value();

    if (state === undefined) {
      return [];
    }

    const open = state.live.prizes
      .filter((prize) => prize.won < prize.quantity && !state.me.wins.includes(prize.type))
      .map((prize) => prize.type);

    return completedBy(state.card.grid, new Set(this.marked()), open);
  });

  constructor() {
    // A token the API no longer honours (expired, or its game deleted) is dropped, not retried.
    effect(() => {
      const error = this.state.error();

      if (error instanceof HttpErrorResponse && [401, 404].includes(error.status)) {
        this.session.clear();
      }
    });

    // "Sent" holds until the server has shown the claim pending and then settled it, so a poll
    // that answers before the claim landed does not wipe the message.
    let sawPending = false;

    effect(() => {
      const pending = (this.state.value()?.me.pending.length ?? 0) > 0;

      if (pending) {
        sawPending = true;
      } else if (sawPending && this.feedback() === 'sent') {
        sawPending = false;
        this.feedback.set(null);
      }
    });

    let knownWins: number | undefined;

    effect(() => {
      const wins = this.state.value()?.me.wins.length;

      if (wins === undefined) {
        return;
      }

      if (knownWins !== undefined && wins > knownWins) {
        this.celebrate.set(wins);
      }

      knownWins = wins;
    });

    const code = computed(() => this.state.value()?.game.code);

    // Keyed on the code alone: following again on every refetch would loop through the snapshot.
    effect(() => {
      const current = code();

      if (current !== undefined) {
        this.channel.follow(current);
      }
    });

    effect(() => {
      if (this.channel.snapshot() !== undefined && this.inFlight() === 0) {
        this.state.reload();
      }
    });

    const timer = setInterval(() => {
      if (this.inFlight() === 0 && this.live()?.status !== 'finished') {
        this.state.reload();
      }
    }, POLL_MS);

    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected toggle(ball: number): void {
    const on = !this.marked().includes(ball);

    this.marked.update((marked) => (on ? [...marked, ball] : marked.filter((n) => n !== ball)));
    this.feedback.set(null);
    this.inFlight.update((count) => count + 1);
    this.api
      .mark(ball, on)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (marked) => {
          this.inFlight.update((count) => count - 1);
          this.marked.set(marked);
        },
        error: () => {
          this.inFlight.update((count) => count - 1);
          this.state.reload();
        },
      });
  }

  protected claim(): void {
    this.claiming.set(true);
    this.api
      .claim()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.claiming.set(false);
          this.feedback.set(result.valid ? 'sent' : 'rejected');
          this.state.reload();
        },
        error: () => this.claiming.set(false),
      });
  }
}
