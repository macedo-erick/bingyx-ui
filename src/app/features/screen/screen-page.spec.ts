import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { GameEvent, LiveChannel } from '../../core/realtime/live-channel';
import { Announcer } from '../../core/voice/announcer';
import { LiveSnapshot } from '../../shared/models/live';
import { provideTestingTransloco } from '../../../testing/transloco';
import { ScreenPage } from './screen-page';

const running: LiveSnapshot = {
  code: 'NOEL7K',
  name: 'Ceia da Família',
  status: 'running',
  scheduledAt: null,
  registrationOpen: true,
  participantCount: 3,
  draws: [5, 46, 10, 17],
  prizes: [{ type: 'line', quantity: 2, description: 'Panetone', won: 1 }],
  ranking: [
    { cardNumber: 14, name: 'Ana Paula Souza', missing: 0, prizeType: 'line' },
    { cardNumber: 9, name: 'Carlos Mendes', missing: 2, prizeType: 'line' },
  ],
  winners: [],
  window: null,
};

function render(snapshot: LiveSnapshot) {
  const events = new Subject<GameEvent>();
  const channel = {
    snapshot: signal<LiveSnapshot | undefined>(snapshot),
    notFound: signal(false),
    events$: events.asObservable(),
    follow: vi.fn(),
  };

  const voice = {
    supported: true,
    enabled: signal(false),
    say: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  };

  TestBed.configureTestingModule({ imports: [ScreenPage, provideTestingTransloco()] });
  TestBed.overrideComponent(ScreenPage, {
    set: {
      providers: [
        { provide: LiveChannel, useValue: channel },
        { provide: Announcer, useValue: voice },
      ],
    },
  });

  const fixture = TestBed.createComponent(ScreenPage);

  fixture.componentRef.setInput('code', 'noel7k');
  fixture.detectChanges();

  return { fixture, element: fixture.nativeElement as HTMLElement, channel, events, voice };
}

describe('ScreenPage', () => {
  it('follows the game named in the address', () => {
    const { channel } = render(running);

    expect(channel.follow).toHaveBeenCalledWith('noel7k');
  });

  it('shows the last ball, the prizes left and the ranking by name', () => {
    const { element } = render(running);
    const text = element.textContent ?? '';

    expect(element.querySelector('.big-ball')?.textContent).toContain('17');
    expect(text).toContain('Bola 4 de 75');
    expect(text).toContain('1 restante(s)');
    expect(text).toContain('Ana Paula Souza');
    expect(text).toContain('falta 0 · Linha');
  });

  it('invites people to join while the draw has not started', () => {
    const { element } = render({ ...running, status: 'open', draws: [] });

    expect(element.textContent).toContain('Aponte a câmera e pegue sua cartela');
    expect(element.textContent).toContain('localhost');
  });

  it('covers the board while a BINGO is being checked', () => {
    const { element } = render({
      ...running,
      status: 'checking',
      window: {
        closesAt: new Date(Date.now() + 8000).toISOString(),
        claimants: [{ cardNumber: 14, name: 'Ana Paula Souza', prizeType: 'line' }],
      },
    });

    expect(element.querySelector('.overlay.checking')?.textContent).toContain(
      '#014 Ana Paula Souza',
    );
  });

  it('announces the winners when the check settles', () => {
    const { element, events, fixture } = render(running);

    events.next({
      kind: 'window-closed',
      winners: [
        {
          prizeType: 'line',
          description: 'Panetone',
          cardNumber: 14,
          name: 'Ana Paula Souza',
          tieBreak: true,
          atSeq: 4,
        },
      ],
      tieBreakAmong: [{ prizeType: 'line', cardNumbers: [14, 9, 3] }],
    });
    fixture.detectChanges();

    const overlay = element.querySelector('.overlay.announcement')?.textContent ?? '';

    expect(overlay).toContain('BINGO!');
    expect(overlay).toContain('Ana Paula Souza');
    expect(overlay).toContain('Panetone');
    expect(overlay).toContain('3 cartelas completaram Linha juntas');
  });

  it('shows the winners once the game is over', () => {
    const { element } = render({
      ...running,
      status: 'finished',
      winners: [
        {
          prizeType: 'full',
          description: 'Vale-presente',
          cardNumber: 3,
          name: 'João Pedro',
          tieBreak: false,
          atSeq: 58,
        },
      ],
    });

    expect(element.textContent).toContain('Feliz Natal!');
    expect(element.textContent).toContain('João Pedro');
  });

  it('calls each ball out loud, letter first', () => {
    const { events, voice } = render(running);

    events.next({ kind: 'ball', seq: 5, ball: 12 });

    expect(voice.say).toHaveBeenCalledWith({ clip: 'ball-12', text: 'Bê... doze.' }, true);
  });

  it('calls out the winners when the check settles', () => {
    const { events, voice } = render(running);

    events.next({
      kind: 'window-closed',
      winners: [
        {
          prizeType: 'line',
          description: null,
          cardNumber: 14,
          name: 'Ana',
          tieBreak: false,
          atSeq: 4,
        },
      ],
      tieBreakAmong: [],
    });

    expect(voice.say).toHaveBeenCalledWith(
      [expect.objectContaining({ clip: 'win-line', after: 'Ana, cartela catorze!' })],
      true,
    );
  });

  it('asks for a click to turn the sound on, as browsers require', () => {
    const { element, voice, fixture } = render(running);
    const button = element.querySelector<HTMLButtonElement>('button.sound')!;

    expect(button.textContent).toContain('Ativar som');

    button.click();
    fixture.detectChanges();

    expect(voice.enable).toHaveBeenCalled();
  });
});
