import { Component, computed, input } from '@angular/core';

const LETTERS = ['B', 'I', 'N', 'G', 'O'];

// The 75-ball board, one row per letter. `tone` picks the cream page or the night-time TV.
@Component({
  selector: 'bingyx-ball-board',
  template: `
    @for (row of rows(); track row.letter) {
      <div class="row">
        <span class="letter">{{ row.letter }}</span>
        @for (cell of row.cells; track cell.n) {
          <span class="ball" [class.drawn]="cell.drawn" [class.last]="cell.last">{{ cell.n }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--board-gap, 6px);
    }

    .row {
      display: grid;
      grid-template-columns: var(--board-letter, 28px) repeat(15, minmax(0, 1fr));
      gap: var(--board-gap, 6px);
      align-items: center;
    }

    .letter {
      font-family: var(--bx-font-display);
      font-weight: 800;
      font-size: var(--board-letter-size, 15px);
      color: var(--p-primary-color);
      text-align: center;
    }

    .ball {
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--bx-neutral);
      color: var(--bx-neutral-ink);
      font-size: var(--board-font, 12px);
      font-variant-numeric: tabular-nums;
    }

    .ball.drawn {
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-weight: 700;
    }

    .ball.last {
      background: var(--bx-gold);
      color: var(--bx-pine-deep);
      font-weight: 800;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--bx-gold), transparent 65%);
    }

    :host(.night) .letter {
      color: var(--bx-gold);
    }

    :host(.night) .ball {
      background: var(--bx-pine-900);
      color: var(--bx-pine-300);
    }

    :host(.night) .ball.drawn {
      background: var(--p-primary-700);
      color: white;
    }

    :host(.night) .ball.last {
      background: var(--bx-gold);
      color: var(--bx-pine-deep);
    }
  `,
  host: { '[class.night]': "tone() === 'night'", role: 'img', '[attr.aria-label]': 'label()' },
})
export class BingyxBallBoard {
  readonly draws = input.required<readonly number[]>();
  readonly tone = input<'day' | 'night'>('day');
  readonly label = input('');

  protected readonly rows = computed(() => {
    const drawn = new Set(this.draws());
    const last = this.draws().at(-1);

    return LETTERS.map((letter, index) => ({
      letter,
      cells: Array.from({ length: 15 }, (_, offset) => {
        const n = index * 15 + offset + 1;

        return { n, drawn: drawn.has(n) && n !== last, last: n === last };
      }),
    }));
  });
}
