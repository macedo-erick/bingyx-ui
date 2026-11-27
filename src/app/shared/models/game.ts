export type Uuid = string;

export type GameStatus = 'draft' | 'open' | 'running' | 'checking' | 'finished';

export const PRIZE_TYPES = ['line', 'column', 'diagonal', 'full'] as const;

export type PrizeType = (typeof PRIZE_TYPES)[number];

export interface Prize {
  readonly type: PrizeType;
  readonly enabled: boolean;
  readonly quantity: number;
  readonly description: string | null;
}

export interface GameSummary {
  readonly id: Uuid;
  readonly code: string;
  readonly name: string;
  readonly status: GameStatus;
  readonly scheduledAt: string | null;
  readonly registrationOpen: boolean;
  readonly createdAt: string;
  readonly participantCount: number;
  readonly drawnCount: number;
  readonly prizeCount: number;
  readonly winCount: number;
}

export interface GameDetail extends GameSummary {
  readonly freeCenter: boolean;
  readonly claimWindowSeconds: number;
  readonly prizes: readonly Prize[];
}

export interface GameSettingsRequest {
  readonly name: string;
  readonly scheduledAt: string | null;
  readonly freeCenter: boolean;
  readonly claimWindowSeconds: number;
}

export const EDITABLE_STATUSES: readonly GameStatus[] = ['draft', 'open'];

export const IN_PLAY_STATUSES: readonly GameStatus[] = ['running', 'checking'];
