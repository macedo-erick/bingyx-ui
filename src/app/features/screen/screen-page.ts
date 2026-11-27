import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toDataURL } from 'qrcode';

import { injectTranslate } from '../../core/i18n/translate';
import { GameEvent, LiveChannel } from '../../core/realtime/live-channel';
import { Announcer } from '../../core/voice/announcer';
import { ballPhrase, claimPhrase, finishedPhrase, winnersPhrase } from '../../core/voice/phrases';
import { letterOf } from '../../shared/models/live';
import { cardLabel } from '../../shared/models/player';
import { BingyxBallBoard } from '../../shared/ui/ball-board';
import { BingyxConfetti } from '../../shared/ui/confetti';
import { BingyxLogo } from '../../shared/ui/logo';
import { BingyxSnowfall } from '../../shared/ui/snowfall';
import { injectCountdown } from '../../shared/util/countdown';

const RECENT_BALLS = 5;
const RANKING_SIZE = 8;
const ANNOUNCEMENT_MS = 12_000;

type Announcement = Extract<GameEvent, { kind: 'window-closed' }>;

@Component({
  selector: 'bingyx-screen-page',
  imports: [BingyxBallBoard, BingyxConfetti, BingyxLogo, BingyxSnowfall],
  templateUrl: './screen-page.html',
  styleUrl: './screen-page.css',
  providers: [LiveChannel, Announcer],
  host: { class: 'app-dark' },
})
export class ScreenPage {
  readonly code = input.required<string>();

  protected readonly channel = inject(LiveChannel);
  protected readonly voice = inject(Announcer);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = injectTranslate();
  protected readonly letterOf = letterOf;
  protected readonly cardLabel = cardLabel;

  protected readonly live = this.channel.snapshot;
  protected readonly announcement = signal<Announcement | null>(null);
  protected readonly qrCode = signal<string | null>(null);

  protected readonly lastBall = computed(() => this.live()?.draws.at(-1));
  // A one-item list keyed by the ball, so each new ball mounts afresh and replays its entrance.
  protected readonly lastBallKeyed = computed(() => {
    const ball = this.lastBall();

    return ball === undefined ? [] : [ball];
  });
  protected readonly recentBalls = computed(() =>
    (this.live()?.draws ?? []).slice(0, -1).slice(-RECENT_BALLS).reverse(),
  );
  protected readonly ranking = computed(() => (this.live()?.ranking ?? []).slice(0, RANKING_SIZE));
  protected readonly secondsLeft = injectCountdown(() => this.live()?.window?.closesAt);
  protected readonly joinLink = computed(
    () => new URL(`j/${this.code().toUpperCase()}`, document.baseURI).href,
  );
  protected readonly joinLabel = computed(() => this.joinLink().replace(/^https?:\/\//, ''));

  constructor() {
    effect(() => this.channel.follow(this.code()));

    effect(() => {
      const link = this.joinLink();

      const style = getComputedStyle(document.documentElement);

      void toDataURL(link, {
        margin: 1,
        width: 520,
        color: {
          dark: style.getPropertyValue('--bx-pine-deep').trim() || '#000000',
          light: style.getPropertyValue('--bx-cream').trim() || '#ffffff',
        },
      }).then((url) => this.qrCode.set(url));
    });

    let hide: ReturnType<typeof setTimeout> | undefined;

    this.channel.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      switch (event.kind) {
        case 'ball':
          this.voice.say(ballPhrase(event.ball), true);
          break;
        case 'window-opened':
          this.voice.say(claimPhrase(), true);
          break;
        case 'window-closed':
          if (event.winners.length > 0) {
            clearTimeout(hide);
            this.announcement.set(event);
            this.voice.say(winnersPhrase(event.winners), true);
            hide = setTimeout(() => this.announcement.set(null), ANNOUNCEMENT_MS);
          }
          break;
        case 'status':
          if (event.status === 'finished') {
            this.voice.say(finishedPhrase());
          }
          break;
      }
    });

    this.destroyRef.onDestroy(() => clearTimeout(hide));
  }

  protected toggleSound(): void {
    if (this.voice.enabled()) {
      this.voice.disable();
    } else {
      this.voice.enable();
    }
  }

  protected dismiss(): void {
    this.announcement.set(null);
  }

  protected tiedFor(announcement: Announcement, prizeType: string): number[] {
    return announcement.tieBreakAmong.find((tie) => tie.prizeType === prizeType)?.cardNumbers ?? [];
  }
}
