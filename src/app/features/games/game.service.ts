import { HttpClient, httpResource } from '@angular/common/http';
import { Service, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  GameDetail,
  GameSettingsRequest,
  GameSummary,
  Prize,
  Uuid,
} from '../../shared/models/game';
import { ControlView, Drawn } from '../../shared/models/live';
import { Participant, Seat } from '../../shared/models/player';

const BASE_URL = `${environment.apiUrl}/games`;

@Service()
export class GameService {
  private readonly http = inject(HttpClient);

  private readonly list = httpResource<GameSummary[]>(() => BASE_URL, { defaultValue: [] });

  readonly games = computed(() => this.list.value());
  readonly isLoading = computed(() => this.list.isLoading());
  readonly hasError = computed(() => this.list.error() !== undefined);

  reload(): void {
    this.list.reload();
  }

  detail(id: () => Uuid | undefined) {
    return httpResource<GameDetail>(() => {
      const gameId = id();

      return gameId === undefined ? undefined : `${BASE_URL}/${gameId}`;
    });
  }

  create(request: GameSettingsRequest): Observable<GameDetail> {
    return this.http.post<GameDetail>(BASE_URL, request);
  }

  update(id: Uuid, request: GameSettingsRequest): Observable<GameDetail> {
    return this.http.patch<GameDetail>(`${BASE_URL}/${id}`, request);
  }

  configurePrizes(id: Uuid, prizes: readonly Prize[]): Observable<GameDetail> {
    return this.http.put<GameDetail>(`${BASE_URL}/${id}/prizes`, { prizes });
  }

  open(id: Uuid): Observable<GameDetail> {
    return this.http.post<GameDetail>(`${BASE_URL}/${id}/open`, {});
  }

  participants(id: () => Uuid | undefined) {
    return httpResource<Participant[]>(
      () => {
        const gameId = id();

        return gameId === undefined ? undefined : `${BASE_URL}/${gameId}/participants`;
      },
      { defaultValue: [] },
    );
  }

  setRegistration(id: Uuid, open: boolean): Observable<void> {
    return this.http.patch<void>(`${BASE_URL}/${id}/registration`, { open });
  }

  play(id: Uuid): Observable<Seat> {
    return this.http.post<Seat>(`${BASE_URL}/${id}/play`, {});
  }

  live(id: () => Uuid | undefined) {
    return httpResource<ControlView>(() => {
      const gameId = id();

      return gameId === undefined ? undefined : `${BASE_URL}/${gameId}/live`;
    });
  }

  start(id: Uuid): Observable<void> {
    return this.http.post<void>(`${BASE_URL}/${id}/start`, {});
  }

  draw(id: Uuid): Observable<Drawn> {
    return this.http.post<Drawn>(`${BASE_URL}/${id}/draw`, {});
  }

  finish(id: Uuid): Observable<void> {
    return this.http.post<void>(`${BASE_URL}/${id}/finish`, {});
  }

  remove(id: Uuid): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`).pipe(tap(() => this.reload()));
  }
}
