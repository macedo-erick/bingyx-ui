import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { type Socket, io } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { GameStatus, PrizeType } from '../../shared/models/game';
import { LiveSnapshot, Winner } from '../../shared/models/live';

export type GameEvent =
  | { readonly kind: 'ball'; readonly seq: number; readonly ball: number }
  | { readonly kind: 'window-opened'; readonly closesAt: string }
  | {
      readonly kind: 'window-closed';
      readonly winners: readonly Winner[];
      readonly tieBreakAmong: readonly { prizeType: PrizeType; cardNumbers: number[] }[];
    }
  | { readonly kind: 'status'; readonly status: GameStatus };

const api = new URL(environment.apiUrl);

// One socket per screen, following one game by its code. The snapshot is the public view; a
// screen with a private view (the player's card, the organiser's log) refetches it on each one.
@Injectable()
export class LiveChannel {
  private readonly events = new Subject<GameEvent>();
  private socket?: Socket;
  private code?: string;

  readonly snapshot = signal<LiveSnapshot | undefined>(undefined);
  readonly connected = signal(false);
  readonly notFound = signal(false);
  readonly events$: Observable<GameEvent> = this.events.asObservable();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.socket?.disconnect();
      this.events.complete();
    });
  }

  follow(code: string): void {
    this.code = code.toUpperCase();

    if (this.socket === undefined) {
      this.socket = io(api.origin, {
        path: `${api.pathname.replace(/\/$/, '')}/socket.io`,
        transports: ['websocket', 'polling'],
      });
      this.socket.on('connect', () => {
        this.connected.set(true);
        this.subscribe();
      });
      this.socket.on('disconnect', () => this.connected.set(false));
      this.socket.on('snapshot', (snapshot: LiveSnapshot) => this.snapshot.set(snapshot));
      this.socket.on('game-event', (event: GameEvent) => this.events.next(event));
    } else if (this.socket.connected) {
      this.subscribe();
    }
  }

  // Re-sent on every reconnect: the server forgets rooms with the old connection.
  private subscribe(): void {
    if (this.code === undefined || this.socket === undefined) {
      return;
    }

    void this.socket
      .emitWithAck('subscribe', { code: this.code })
      .then((ack: { ok?: boolean }) => this.notFound.set(ack.ok !== true));
  }
}
