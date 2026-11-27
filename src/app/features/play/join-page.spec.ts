import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayerSession } from '../../core/player/player-session';
import { Invitation } from '../../shared/models/player';
import { provideTestingTransloco } from '../../../testing/transloco';
import { JoinPage } from './join-page';
import { PlayerApi } from './player-api.service';

const invitation: Invitation = {
  code: 'NOEL7K',
  name: 'Ceia da Família',
  status: 'open',
  scheduledAt: null,
  registrationOpen: true,
  prizes: [{ type: 'line', quantity: 2, description: 'Panetone' }],
};

function render(
  overrides: Partial<Invitation> = {},
  joinResult = of({ playerToken: 'tok', cardNumber: 7 }),
) {
  const api = {
    invitation: () => ({
      value: signal<Invitation | undefined>({ ...invitation, ...overrides }),
      isLoading: signal(false),
      error: signal(undefined),
    }),
    join: vi.fn(() => joinResult),
  };

  TestBed.configureTestingModule({
    imports: [JoinPage, provideTestingTransloco()],
    providers: [provideRouter([]), { provide: PlayerApi, useValue: api }],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(JoinPage);

  fixture.componentRef.setInput('code', 'NOEL7K');
  fixture.detectChanges();

  const element = fixture.nativeElement as HTMLElement;
  const type = (selector: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>(selector)!;

    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  return { element, api, navigate, type, submit };
}

describe('JoinPage', () => {
  afterEach(() => localStorage.clear());

  it('shows the game and its prizes', () => {
    const { element } = render();

    expect(element.textContent).toContain('Ceia da Família');
    expect(element.textContent).toContain('2 × Linha');
  });

  it('asks for both names before joining', () => {
    const { api, type, submit, element } = render();

    type('#firstName', 'Ana');
    submit();

    expect(api.join).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Informe seu sobrenome.');
  });

  it('joins, keeps the card on this device and goes to it', () => {
    const { api, type, submit, navigate } = render();

    type('#firstName', ' Ana ');
    type('#lastName', 'Souza');
    submit();

    expect(api.join).toHaveBeenCalledWith('NOEL7K', 'Ana', 'Souza');
    expect(TestBed.inject(PlayerSession).current()).toEqual({ code: 'NOEL7K', token: 'tok' });
    expect(navigate).toHaveBeenCalledWith(['/play']);
  });

  it('says registration is closed instead of showing the form', () => {
    const { element } = render({ registrationOpen: false });

    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).toContain('Inscrições fechadas');
  });

  it('switches to the closed message when registration shuts while filling in', () => {
    const closed = throwError(() => new HttpErrorResponse({ status: 409 }));
    const { type, submit, element } = render({}, closed);

    type('#firstName', 'Ana');
    type('#lastName', 'Souza');
    submit();

    expect(element.textContent).toContain('Inscrições fechadas');
  });

  it('sends someone who already has a card for this game straight to it', () => {
    localStorage.setItem('bingyx.player', JSON.stringify({ code: 'NOEL7K', token: 'old' }));

    const { navigate } = render();

    expect(navigate).toHaveBeenCalledWith(['/play'], { replaceUrl: true });
  });
});
