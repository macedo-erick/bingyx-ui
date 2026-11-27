import { PrizeType } from '../../shared/models/game';
import { Winner, letterOf } from '../../shared/models/live';

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const TEENS = [
  'dez',
  'onze',
  'doze',
  'treze',
  'catorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const TENS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

// How each letter of the card is said aloud, so the voice does not read "B" as a word.
const LETTER_NAMES: Record<string, string> = { B: 'Bê', I: 'I', N: 'Ene', G: 'Gê', O: 'Ó' };

const PRIZE_NAMES: Record<PrizeType, string> = {
  line: 'linha',
  column: 'coluna',
  diagonal: 'diagonal',
  full: 'cartela cheia',
};

export function numberInWords(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    return String(value);
  }

  if (value === 0) {
    return 'zero';
  }

  if (value === 100) {
    return 'cem';
  }

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds] ?? '');
  }

  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10] ?? '');
  } else if (rest > 0) {
    const tens = Math.floor(rest / 10);
    const units = rest % 10;

    parts.push([TENS[tens], UNITS[units]].filter((part) => part !== '').join(' e '));
  }

  return parts.filter((part) => part !== '').join(' e ');
}

export function ballPhrase(ball: number): string {
  const letter = letterOf(ball);

  return `${LETTER_NAMES[letter] ?? letter}... ${numberInWords(ball)}.`;
}

export function claimPhrase(): string {
  return 'Bingo pedido! Conferindo as cartelas.';
}

export function winnersPhrase(winners: readonly Winner[]): string {
  const byPrize = new Map<PrizeType, Winner[]>();

  for (const winner of winners) {
    byPrize.set(winner.prizeType, [...(byPrize.get(winner.prizeType) ?? []), winner]);
  }

  const sentences = [...byPrize].map(([prize, group]) => {
    const names = group.map(
      (winner) => `${winner.name}, cartela ${numberInWords(winner.cardNumber)}`,
    );
    const who =
      names.length === 1 ? names[0] : `${names.slice(0, -1).join('; ')} e ${names.at(-1) ?? ''}`;

    return `${PRIZE_NAMES[prize]} para ${who}`;
  });

  return `Bingo! ${sentences.join('. ')}!`;
}

export function finishedPhrase(): string {
  return 'Fim de jogo. Feliz Natal!';
}
