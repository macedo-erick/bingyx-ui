import { Component, input } from '@angular/core';

@Component({
  selector: 'bingyx-page-header',
  template: `
    <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display m-0 text-4xl font-extrabold text-[var(--bx-pine)]">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="m-0 text-[15px] text-[var(--p-text-muted-color)]">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BingyxPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
