import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { GameDetail } from '../../shared/models/game';
import { provideTestingTransloco } from '../../../testing/transloco';
import { GameFormPage } from './game-form-page';
import { GameService } from './game.service';

const created: GameDetail = {
  id: '9b2f1c1e-0000-4000-8000-000000000001',
  code: 'NOEL7K',
  name: 'Ceia',
  status: 'draft',
  scheduledAt: null,
  registrationOpen: false,
  createdAt: '2026-11-27T12:00:00Z',
  participantCount: 0,
  drawnCount: 0,
  prizeCount: 3,
  winCount: 0,
  freeCenter: true,
  claimWindowSeconds: 10,
  prizes: [],
};

function render() {
  const service = {
    detail: () => ({ value: signal<GameDetail | undefined>(undefined) }),
    create: vi.fn(() => of(created)),
    update: vi.fn(() => of(created)),
    configurePrizes: vi.fn(() => of(created)),
    open: vi.fn(() => of({ ...created, status: 'open' as const })),
  };
  const messages = { add: vi.fn() };

  TestBed.configureTestingModule({
    imports: [GameFormPage, provideTestingTransloco()],
    providers: [
      provideRouter([]),
      { provide: GameService, useValue: service },
      { provide: MessageService, useValue: messages },
    ],
  });

  const fixture = TestBed.createComponent(GameFormPage);
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

  fixture.detectChanges();

  const element = fixture.nativeElement as HTMLElement;
  const type = (selector: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>(selector)!;

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const click = (label: string) => {
    const button = [...element.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(label),
    )!;

    button.click();
    fixture.detectChanges();
  };

  return { element, service, messages, navigate, type, click, fixture };
}

describe('GameFormPage', () => {
  it('starts a new game with line, column and full card on, and diagonal off', () => {
    const { element } = render();
    const summary = element.querySelector('aside')!.textContent ?? '';

    expect(summary).toContain('1 × Linha');
    expect(summary).toContain('1 × Coluna');
    expect(summary).toContain('1 × Cartela cheia');
    expect(summary).not.toContain('Diagonal');
    expect(summary).toContain('O jogo termina quando sair a cartela cheia.');
  });

  it('will not save a game without a name', () => {
    const { service, click, element } = render();

    click('Salvar rascunho');

    expect(service.create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Dê um nome ao bingo.');
  });

  it('creates the game, then its prizes, then opens registration', () => {
    const { service, type, click, navigate } = render();

    type('#name', '  Ceia de Natal ');
    click('Abrir inscrições');

    expect(service.create).toHaveBeenCalledWith({
      name: 'Ceia de Natal',
      scheduledAt: null,
      freeCenter: true,
      claimWindowSeconds: 10,
    });
    expect(service.configurePrizes).toHaveBeenCalledWith(created.id, [
      { type: 'line', enabled: true, quantity: 1, description: null },
      { type: 'column', enabled: true, quantity: 1, description: null },
      { type: 'diagonal', enabled: false, quantity: 1, description: null },
      { type: 'full', enabled: true, quantity: 1, description: null },
    ]);
    expect(service.open).toHaveBeenCalledWith(created.id);
    expect(navigate).toHaveBeenCalledWith(['/games', created.id, 'invites']);
  });

  it('keeps a draft closed when it is only saved', () => {
    const { service, type, click } = render();

    type('#name', 'Rascunho');
    click('Salvar rascunho');

    expect(service.create).toHaveBeenCalled();
    expect(service.open).not.toHaveBeenCalled();
  });
});
