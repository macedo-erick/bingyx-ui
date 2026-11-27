import { PrizeType } from '../../shared/models/game';
import { Winner } from '../../shared/models/live';
import { letterName, numberInWords } from './words';

// A line the caller says. `clip` names the recorded take in public/voice/ (see
// scripts/generate-voice.mts); `text` is what the browser voice says when there is none. A clip
// cannot know who won, so `after` carries the names, said by the browser voice once it ends.
export interface Line {
  readonly clip?: string;
  readonly text: string;
  readonly after?: string;
}

const PRIZE_NAMES: Record<PrizeType, string> = {
  line: 'linha',
  column: 'coluna',
  diagonal: 'diagonal',
  full: 'cartela cheia',
};

export function ballPhrase(ball: number): Line {
  return { clip: `ball-${ball}`, text: `${letterName(ball)}... ${numberInWords(ball)}.` };
}

export function soundOnPhrase(): Line {
  return { clip: 'sound-on', text: 'Som ativado. Boa sorte a todos!' };
}

export function claimPhrase(): Line {
  return { clip: 'claim', text: 'Bingo pedido! Conferindo as cartelas.' };
}

export function winnersPhrase(winners: readonly Winner[]): Line[] {
  const byPrize = new Map<PrizeType, Winner[]>();

  for (const winner of winners) {
    byPrize.set(winner.prizeType, [...(byPrize.get(winner.prizeType) ?? []), winner]);
  }

  return [...byPrize].map(([prize, group]) => {
    const names = group.map(
      (winner) => `${winner.name}, cartela ${numberInWords(winner.cardNumber)}`,
    );
    const who =
      names.length === 1 ? names[0] : `${names.slice(0, -1).join('; ')} e ${names.at(-1) ?? ''}`;

    return {
      clip: `win-${prize}`,
      text: `Bingo! ${PRIZE_NAMES[prize]} para ${who}!`,
      after: `${who}!`,
    };
  });
}

export function finishedPhrase(): Line {
  return { clip: 'finished', text: 'E acabou, gente! Feliz Natal pra todo mundo!' };
}
