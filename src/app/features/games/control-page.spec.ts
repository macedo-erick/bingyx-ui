import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { LiveChannel } from '../../core/realtime/live-channel';
import { ControlView, LiveSnapshot } from '../../shared/models/live';
import { provideTestingTransloco } from '../../../testing/transloco';
import { ControlPage } from './control-page';
import { GameService } from './game.service';

const base: ControlView = {
  id: 'g1',
  code: 'NOEL7K',
  name: 'Ceia',
  status: 'running',
  scheduledAt: null,
  registrationOpen: true,
  participantCount: 3,
  draws: [5, 46],
  prizes: [{ type: 'line', quantity: 1, description: null, won: 0 }],
  ranking: [],
  winners: [],
  window: null,
  claims: [
    {
      cardNumber: 9,
      name: 'Carlos Mendes',
      prizeType: null,
      valid: false,
      atSeq: 2,
      at: '2026-12-24T21:10:00Z',
    },
  ],
};

function render(view: ControlView) {
  const service = {
    live: () => ({
      value: signal<ControlView | undefined>(view),
      error: signal(undefined),
      reload: vi.fn(),
    }),
    start: vi.fn(() => of(undefined)),
    draw: vi.fn(() => of({ seq: 3, ball: 7, letter: 'B' })),
    finish: vi.fn(() => of(undefined)),
  };
  const channel = { snapshot: signal<LiveSnapshot | undefined>(undefined), follow: vi.fn() };

  TestBed.configureTestingModule({
    imports: [ControlPage, provideTestingTransloco()],
    providers: [
      provideRouter([]),
      ConfirmationService,
      { provide: GameService, useValue: service },
    ],
  });
  TestBed.overrideComponent(ControlPage, {
    set: { providers: [{ provide: LiveChannel, useValue: channel }] },
  });

  const fixture = TestBed.createComponent(ControlPage);

  fixture.componentRef.setInput('id', 'g1');
  fixture.detectChanges();

  const element = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    [...element.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(label),
    );

  return { element, service, channel, button };
}

describe('ControlPage', () => {
  it('follows the game live by its code', () => {
    const { channel } = render(base);

    expect(channel.follow).toHaveBeenCalledWith('NOEL7K');
  });

  it('starts the draw from an open game', () => {
    const { button, service } = render({ ...base, status: 'open', draws: [] });

    button('Iniciar sorteio')!.click();

    expect(service.start).toHaveBeenCalledWith('g1');
  });

  it('draws the next ball while the game runs', () => {
    const { button, service } = render(base);

    button('Sortear próximo')!.click();

    expect(service.draw).toHaveBeenCalledWith('g1');
  });

  it('holds the draw while a BINGO is checked, naming who claimed', () => {
    const { button, element } = render({
      ...base,
      status: 'checking',
      window: {
        closesAt: new Date(Date.now() + 7000).toISOString(),
        claimants: [{ cardNumber: 14, name: 'Ana Paula Souza', prizeType: 'line' }],
      },
    });

    expect(button('Aguardando conferência')?.disabled).toBe(true);
    expect(button('Sortear próximo')).toBeUndefined();
    expect(element.textContent).toContain('#014 Ana Paula Souza');
  });

  it('lists the claims, valid or not', () => {
    const { element } = render(base);

    expect(element.textContent).toContain('Carlos Mendes');
    expect(element.textContent).toContain('Ainda não');
  });
});
