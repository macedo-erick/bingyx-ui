import { Component, computed, input } from '@angular/core';

interface Flake {
  readonly left: number;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
  readonly drift: number;
  readonly opacity: number;
}

// Deterministic, so the flakes do not jump around when the component re-renders.
function flakes(count: number): Flake[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;

    return seed / 233280;
  };

  return Array.from({ length: count }, () => ({
    left: next() * 100,
    size: 2 + next() * 4,
    delay: -next() * 20,
    duration: 12 + next() * 14,
    drift: (next() - 0.5) * 60,
    opacity: 0.25 + next() * 0.45,
  }));
}

// Purely decorative CSS snow behind the content; it stays still for reduced-motion users.
@Component({
  selector: 'bingyx-snowfall',
  template: `
    @for (flake of flakes(); track $index) {
      <span
        [style.left.%]="flake.left"
        [style.width.px]="flake.size"
        [style.height.px]="flake.size"
        [style.opacity]="flake.opacity"
        [style.animation-delay.s]="flake.delay"
        [style.animation-duration.s]="flake.duration"
        [style.--drift.px]="flake.drift"
      ></span>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }

    span {
      position: absolute;
      top: -10px;
      border-radius: 50%;
      background: var(--bx-cream);
      animation-name: fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }

    @keyframes fall {
      to {
        transform: translate(var(--drift), 110vh);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      span {
        animation: none;
        top: auto;
      }
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class BingyxSnowfall {
  readonly count = input(40);

  protected readonly flakes = computed(() => flakes(this.count()));
}
