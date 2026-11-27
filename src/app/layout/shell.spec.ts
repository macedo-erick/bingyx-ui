import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Keycloak from 'keycloak-js';
import { ConfirmationService, MessageService } from 'primeng/api';
import { describe, expect, it, vi } from 'vitest';

import { provideTestingTransloco } from '../../testing/transloco';
import { Shell } from './shell';

function render() {
  TestBed.configureTestingModule({
    imports: [Shell, provideTestingTransloco()],
    providers: [
      provideRouter([]),
      MessageService,
      ConfirmationService,
      {
        provide: Keycloak,
        useValue: {
          authenticated: true,
          tokenParsed: { name: 'Erick Macedo', email: 'erick@bingyx.test' },
          logout: vi.fn(),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();

  return fixture.nativeElement as HTMLElement;
}

describe('Shell', () => {
  it('shows the organiser who is signed in, by initials and name', () => {
    const element = render();

    expect(element.textContent).toContain('EM');
    expect(element.textContent).toContain('Erick Macedo');
  });

  it('names the account menu for screen readers', () => {
    const button = render().querySelector('button[aria-label]');

    expect(button?.getAttribute('aria-label')).toBe('Menu da conta de Erick Macedo');
  });

  it('links home to the games the organiser runs', () => {
    const links = [...render().querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(links).toContain('/games');
  });
});
