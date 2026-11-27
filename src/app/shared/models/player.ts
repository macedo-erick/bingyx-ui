import { GameStatus, PrizeType } from './game';
import { LiveSnapshot } from './live';

export interface Invitation {
  readonly code: string;
  readonly name: string;
  readonly status: GameStatus;
  readonly scheduledAt: string | null;
  readonly registrationOpen: boolean;
  readonly prizes: readonly {
    readonly type: PrizeType;
    readonly quantity: number;
    readonly description: string | null;
  }[];
}

export interface Seat {
  readonly playerToken: string;
  readonly cardNumber: number;
}

export interface Participant {
  readonly cardNumber: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly isOrganiser: boolean;
  readonly joinedAt: string;
}

export interface PlayerState {
  readonly game: {
    readonly code: string;
    readonly name: string;
    readonly status: GameStatus;
    readonly scheduledAt: string | null;
  };
  readonly player: {
    readonly firstName: string;
    readonly lastName: string;
  };
  readonly card: {
    readonly number: number;
    readonly grid: readonly number[];
    readonly marked: readonly number[];
  };
  readonly live: LiveSnapshot;
  readonly me: {
    readonly rank: {
      readonly position: number;
      readonly missing: number;
      readonly prizeType: PrizeType;
    } | null;
    readonly wins: readonly PrizeType[];
    readonly pending: readonly PrizeType[];
  };
}

export function cardLabel(cardNumber: number): string {
  return `#${String(cardNumber).padStart(3, '0')}`;
}
