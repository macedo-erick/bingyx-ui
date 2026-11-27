import { DestroyRef, computed, inject, signal } from '@angular/core';

// Seconds left until `deadline`, ticking while the calling component lives.
export function injectCountdown(deadline: () => string | null | undefined) {
  const now = signal(Date.now());
  const timer = setInterval(() => now.set(Date.now()), 250);

  inject(DestroyRef).onDestroy(() => clearInterval(timer));

  return computed(() => {
    const until = deadline();

    if (until === null || until === undefined) {
      return null;
    }

    return Math.max(0, Math.ceil((new Date(until).getTime() - now()) / 1000));
  });
}
