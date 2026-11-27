import { GameStatus, PrizeType } from './game';

export interface RankEntry {
  readonly cardNumber: number;
  readonly name: string;
  readonly missing: number;
  readonly prizeType: PrizeType;
}

export interface Winner {
  readonly prizeType: PrizeType;
  readonly description: string | null;
  readonly cardNumber: number;
  readonly name: string;
  readonly tieBreak: boolean;
  readonly atSeq: number;
}

export interface PrizeProgress {
  readonly type: PrizeType;
  readonly quantity: number;
  readonly description: string | null;
  readonly won: number;
}

export interface LiveSnapshot {
  readonly code: string;
  readonly name: string;
  readonly status: GameStatus;
  readonly scheduledAt: string | null;
  readonly registrationOpen: boolean;
  readonly participantCount: number;
  readonly draws: readonly number[];
  readonly prizes: readonly PrizeProgress[];
  readonly ranking: readonly RankEntry[];
  readonly winners: readonly Winner[];
  readonly window: {
    readonly closesAt: string;
    readonly claimants: readonly {
      readonly cardNumber: number;
      readonly name: string;
      readonly prizeType: PrizeType;
    }[];
  } | null;
}

export interface ClaimLogEntry {
  readonly cardNumber: number;
  readonly name: string;
  readonly prizeType: PrizeType | null;
  readonly valid: boolean;
  readonly atSeq: number;
  readonly at: string;
}

export interface ControlView extends LiveSnapshot {
  readonly id: string;
  readonly claims: readonly ClaimLogEntry[];
}

export interface Drawn {
  readonly seq: number;
  readonly ball: number;
  readonly letter: string;
}

export interface ClaimResult {
  readonly valid: boolean;
  readonly prizeTypes: readonly PrizeType[];
}

const LETTERS = ['B', 'I', 'N', 'G', 'O'];

export function letterOf(ball: number): string {
  return LETTERS[Math.floor((ball - 1) / 15)] ?? '';
}
