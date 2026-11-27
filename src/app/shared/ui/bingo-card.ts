import { Component, computed, input, output } from '@angular/core';

const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const FREE = 0;

@Component({
  selector: 'bingyx-bingo-card',
  template: `
    <div class="grid" role="grid" [attr.aria-label]="label()">
      @for (letter of letters; track letter) {
        <span class="letter" role="columnheader">{{ letter }}</span>
      }
      @for (cell of cells(); track $index) {
        @if (cell.free) {
          <span class="cell free" role="gridcell" [attr.aria-label]="freeLabel()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z"
              />
            </svg>
          </span>
        } @else if (interactive()) {
          <button
            type="button"
            class="cell"
            role="gridcell"
            [class.marked]="cell.marked"
            [attr.aria-pressed]="cell.marked"
            (click)="markToggle.emit(cell.value)"
          >
            {{ cell.value }}
          </button>
        } @else {
          <span class="cell" role="gridcell" [class.marked]="cell.marked">{{ cell.value }}</span>
        }
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 6px;
    }

    .letter {
      text-align: center;
      font-family: var(--bx-font-display);
      font-weight: 800;
      font-size: 24px;
      color: var(--p-primary-color);
    }

    .cell {
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border: 1px solid var(--bx-line);
      border-radius: 12px;
      background: white;
      font-size: 22px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: inherit;
      font-family: inherit;
    }

    button.cell {
      cursor: pointer;
      touch-action: manipulation;
    }

    .cell.marked {
      border-color: transparent;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      box-shadow: inset 0 -4px 0 var(--p-primary-800);
    }

    .cell.free {
      border-color: transparent;
      background: var(--bx-pine);
    }

    .cell.free svg {
      width: 26px;
      fill: var(--bx-gold);
    }
  `,
})
export class BingyxBingoCard {
  readonly grid = input.required<readonly number[]>();
  readonly marked = input<readonly number[]>([]);
  readonly label = input('');
  readonly freeLabel = input('');
  readonly interactive = input(false);
  readonly markToggle = output<number>();

  protected readonly letters = LETTERS;
  protected readonly cells = computed(() => {
    const marked = new Set(this.marked());

    return this.grid().map((value) => ({
      value,
      free: value === FREE,
      marked: marked.has(value),
    }));
  });
}
