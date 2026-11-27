import { Component, input } from '@angular/core';

@Component({
  selector: 'bingyx-empty-state',
  template: `
    <div
      class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bx-line)] bg-white px-4 py-14 text-center"
    >
      <i [class]="'pi ' + icon()" class="text-3xl text-[var(--bx-pine)]" aria-hidden="true"></i>
      <p class="m-0 font-semibold">{{ title() }}</p>
      @if (message()) {
        <p class="m-0 max-w-sm text-sm text-[var(--p-text-muted-color)]">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BingyxEmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly icon = input('pi-star');
}
