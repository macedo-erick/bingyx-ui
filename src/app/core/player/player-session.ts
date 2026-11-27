import { Service, signal } from '@angular/core';

const STORAGE_KEY = 'bingyx.player';

export interface PlayerSessionValue {
  readonly code: string;
  readonly token: string;
}

// One card per device: joining another game replaces the session rather than juggling several.
@Service()
export class PlayerSession {
  readonly current = signal<PlayerSessionValue | null>(read());

  start(code: string, token: string): void {
    const value = { code: code.toUpperCase(), token };

    this.current.set(value);
    write(value);
  }

  clear(): void {
    this.current.set(null);
    write(null);
  }

  isFor(code: string): boolean {
    return this.current()?.code === code.toUpperCase();
  }
}

function read(): PlayerSessionValue | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>)['code'] === 'string' &&
      typeof (parsed as Record<string, unknown>)['token'] === 'string'
    ) {
      return parsed as PlayerSessionValue;
    }
  } catch {
    // Unreadable or blocked storage just means no saved card.
  }

  return null;
}

function write(value: PlayerSessionValue | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  } catch {
    // The card still works for this visit; it just will not survive a reload.
  }
}
