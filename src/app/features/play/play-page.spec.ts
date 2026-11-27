import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayerState } from '../../shared/models/player';
import { provideTestingTransloco } from '../../../testing/transloco';
import { PlayPage } from './play-page';
import { LiveChannel } from '../../core/realtime/live-channel';
import { PlayerApi } from './player-api.service';

// prettier-ignore
const GRID = [
  10, 17, 31, 46, 67,
  11, 20, 32, 47, 68,
  12, 22, 0, 54, 70,
  13, 23, 38, 57, 73,
  15, 29, 43, 58, 75,
];

function stateWith(overrides: Partial<PlayerState['me']> = {}, marked: number[] = []): PlayerState {
  return {
    game: { code: 'NOEL7K', name: 'Ceia', status: 'running', scheduledAt: null },
    player: { firstName: 'Ana', lastName: 'Souza' },
    card: { number: 2, grid: GRID, marked },
    live: {
      code: 'NOEL7K',
      name: 'Ceia',
      status: 'running',
      scheduledAt: null,
      registrationOpen: true,
      participantCount: 3,
      draws: [5, 46, 10, 67, 31, 17],
      prizes: [
        { type: 'line', quantity: 1, description: null, won: 0 },
        { type: 'full', quantity: 1, description: null, won: 0 },
      ],
      ranking: [],
      winners: [],
      window: null,
    },
    me: {
      rank: { position: 1, missing: 0, prizeType: 'line' },
      wins: [],
      pending: [],
      ...overrides,
    },
  };
}

function render(state: PlayerState, claimValid = true) {
  const value = signal<PlayerState | undefined>(state);
  const api = {
    state: () => ({
      value,
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    }),
    mark: vi.fn((ball: number, on: boolean) =>
      of(on ? [...state.card.marked, ball] : state.card.marked.filter((n) => n !== ball)),
    ),
    claim: vi.fn(() => of({ valid: claimValid, prizeTypes: claimValid ? ['line'] : [] })),
  };

  TestBed.configureTestingModule({
    imports: [PlayPage, provideTestingTransloco()],
    providers: [{ provide: PlayerApi, useValue: api }],
  });
  TestBed.overrideComponent(PlayPage, {
    set: {
      providers: [
        { provide: LiveChannel, useValue: { snapshot: signal(undefined), follow: vi.fn() } },
      ],
    },
  });

  const fixture = TestBed.createComponent(PlayPage);

  fixture.detectChanges();

  const element = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    [...element.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === label,
    )!;

  return { element, api, fixture, button };
}

describe('PlayPage', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the last ball, the ones before it and where the player stands', () => {
    const { element } = render(stateWith());

    expect(element.textContent).toContain('17');
    expect(element.textContent).toContain('N31');
    expect(element.textContent).toContain('1º · falta 0 para Linha');
  });

  it('marks a number when it is tapped, and saves it', () => {
    const { api, button, fixture } = render(stateWith());

    button('20').click();
    fixture.detectChanges();

    expect(api.mark).toHaveBeenCalledWith(20, true);
    expect(button('20').getAttribute('aria-pressed')).toBe('true');
  });

  it('lights the BINGO button once the marks close a prize still on offer', () => {
    const { element } = render(stateWith({}, [10, 17, 31, 46, 67]));

    expect(element.querySelector('.bingo')?.classList).toContain('ready');
    expect(element.textContent).toContain('Peça agora!');
  });

  it('does not light it for a prize the player already won', () => {
    const { element } = render(stateWith({ wins: ['line'] }, [10, 17, 31, 46, 67]));

    expect(element.querySelector('.bingo')?.classList).not.toContain('ready');
    expect(element.textContent).toContain('Você ganhou: Linha!');
  });

  it('says the claim is being checked when the API accepts it', () => {
    const { api, button, fixture, element } = render(stateWith({}, [10, 17, 31, 46, 67]));

    button('BINGO!').click();
    fixture.detectChanges();

    expect(api.claim).toHaveBeenCalled();
    expect(element.textContent).toContain('Conferindo no telão');
  });

  it('says not yet when the API turns the claim down', () => {
    const { button, fixture, element } = render(stateWith(), false);

    button('BINGO!').click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Ainda não!');
  });
});
