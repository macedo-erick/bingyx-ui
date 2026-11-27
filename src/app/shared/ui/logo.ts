import { Component, input } from '@angular/core';

// The same gold star as public/favicon.svg, without the square, for use on the pine header.
@Component({
  selector: 'bingyx-logo',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" [style.width]="size()">
      <path
        d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z"
        fill="none"
        stroke="var(--bx-gold)"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="font-display font-extrabold" [style.font-size]="size()">Bingyx</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1;
    }

    svg {
      aspect-ratio: 1;
    }
  `,
})
export class BingyxLogo {
  readonly size = input('1.5rem');
}
