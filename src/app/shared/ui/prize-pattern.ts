import { Component, computed, input } from '@angular/core';

import { PrizeType } from '../models/game';

const CELLS = Array.from({ length: 25 }, (_, index) => index);

const PATTERNS: Record<PrizeType, (row: number, column: number) => boolean> = {
  line: (row) => row === 2,
  column: (_row, column) => column === 1,
  diagonal: (row, column) => row === column,
  full: () => true,
};

@Component({
  selector: 'bingyx-prize-pattern',
  template: `
    @for (cell of cells(); track $index) {
      <span [class.on]="cell"></span>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(5, 10px);
      gap: 2px;
    }

    span {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      background: var(--bx-line);
    }

    span.on {
      background: var(--p-primary-color);
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class BingyxPrizePattern {
  readonly type = input.required<PrizeType>();

  protected readonly cells = computed(() => {
    const inPattern = PATTERNS[this.type()];

    return CELLS.map((index) => inPattern(Math.floor(index / 5), index % 5));
  });
}
