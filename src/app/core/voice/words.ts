// No imports on purpose: scripts/generate-voice.mts loads this file straight into Node.

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

// How each column letter of the card is said aloud, so the voice does not read "B" as a word.
const LETTER_NAMES = ['Bê', 'I', 'Ene', 'Gê', 'Ó'];

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

export function letterName(ball: number): string {
  return LETTER_NAMES[Math.floor((ball - 1) / 15)] ?? '';
}
