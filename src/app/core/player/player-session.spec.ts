import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { PlayerSession } from './player-session';

function fresh(): PlayerSession {
  TestBed.resetTestingModule();

  return TestBed.inject(PlayerSession);
}

describe('PlayerSession', () => {
  afterEach(() => localStorage.clear());

  it('remembers the card across a reload of the page', () => {
    fresh().start('noel7k', 'token-1');

    const reloaded = fresh();

    expect(reloaded.current()).toEqual({ code: 'NOEL7K', token: 'token-1' });
    expect(reloaded.isFor('NOEL7K')).toBe(true);
    expect(reloaded.isFor('noel7k')).toBe(true);
  });

  it('keeps one card per device, the latest game replacing the earlier one', () => {
    const session = fresh();

    session.start('AAAAAA', 'first');
    session.start('BBBBBB', 'second');

    expect(session.isFor('AAAAAA')).toBe(false);
    expect(fresh().current()?.token).toBe('second');
  });

  it('forgets the card once cleared', () => {
    fresh().start('NOEL7K', 'token-1');
    fresh().clear();

    expect(fresh().current()).toBeNull();
  });

  it('ignores whatever else might be stored under its key', () => {
    localStorage.setItem('bingyx.player', '{"code":1}');

    expect(fresh().current()).toBeNull();

    localStorage.setItem('bingyx.player', 'not json');

    expect(fresh().current()).toBeNull();
  });
});
