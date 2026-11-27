import { HttpClient, HttpHeaders, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PlayerSession } from '../../core/player/player-session';
import { ClaimResult } from '../../shared/models/live';
import { Invitation, PlayerState, Seat } from '../../shared/models/player';

@Service()
export class PlayerApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(PlayerSession);

  invitation(code: () => string | undefined) {
    return httpResource<Invitation>(() => {
      const value = code();

      return value === undefined
        ? undefined
        : `${environment.apiUrl}/join/${encodeURIComponent(value)}`;
    });
  }

  join(code: string, firstName: string, lastName: string): Observable<Seat> {
    return this.http.post<Seat>(`${environment.apiUrl}/join/${encodeURIComponent(code)}`, {
      firstName,
      lastName,
    });
  }

  mark(ball: number, on: boolean): Observable<number[]> {
    const url = `${environment.apiUrl}/player/marks/${String(ball)}`;
    const options = { headers: this.headers() };

    return on
      ? this.http.put<number[]>(url, null, options)
      : this.http.delete<number[]>(url, options);
  }

  claim(): Observable<ClaimResult> {
    return this.http.post<ClaimResult>(`${environment.apiUrl}/player/claims`, null, {
      headers: this.headers(),
    });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.session.current()?.token ?? ''}` });
  }

  state() {
    return httpResource<PlayerState>(() => {
      const current = this.session.current();

      return current === null
        ? undefined
        : {
            url: `${environment.apiUrl}/player`,
            headers: new HttpHeaders({ Authorization: `Bearer ${current.token}` }),
          };
    });
  }
}
