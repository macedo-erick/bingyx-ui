import { INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG } from 'keycloak-angular';
import { describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { keycloakBearerTokenConfig } from './keycloak.providers';

const [condition] = (
  keycloakBearerTokenConfig as {
    provide: typeof INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG;
    useValue: { urlPattern: RegExp }[];
  }
).useValue;

const sendsOrganiserToken = (path: string) =>
  condition!.urlPattern.test(`${environment.apiUrl}${path}`);

describe('which requests carry the organiser token', () => {
  it('covers the organiser API', () => {
    expect(sendsOrganiserToken('/games')).toBe(true);
    expect(sendsOrganiserToken('/games/1/play')).toBe(true);
    expect(sendsOrganiserToken('/me')).toBe(true);
  });

  it('leaves player and invitation routes to the player token', () => {
    expect(sendsOrganiserToken('/player')).toBe(false);
    expect(sendsOrganiserToken('/player/marks')).toBe(false);
    expect(sendsOrganiserToken('/join/NOEL7K')).toBe(false);
  });

  it('never leaves the API origin', () => {
    expect(condition!.urlPattern.test('https://elsewhere.example/api/games')).toBe(false);
  });
});
