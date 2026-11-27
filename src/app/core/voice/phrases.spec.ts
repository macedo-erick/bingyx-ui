import { describe, expect, it } from 'vitest';

import { Winner } from '../../shared/models/live';
import { ballPhrase, numberInWords, winnersPhrase } from './phrases';

const winner = (overrides: Partial<Winner>): Winner => ({
  prizeType: 'line',
  description: null,
  cardNumber: 1,
  name: 'Ana',
  tieBreak: false,
  atSeq: 10,
  ...overrides,
});

describe('numbers in words', () => {
  it('says every ball the way a Brazilian caller would', () => {
    expect(numberInWords(1)).toBe('um');
    expect(numberInWords(10)).toBe('dez');
    expect(numberInWords(14)).toBe('catorze');
    expect(numberInWords(19)).toBe('dezenove');
    expect(numberInWords(20)).toBe('vinte');
    expect(numberInWords(21)).toBe('vinte e um');
    expect(numberInWords(45)).toBe('quarenta e cinco');
    expect(numberInWords(75)).toBe('setenta e cinco');
  });

  it('reaches card numbers past a hundred', () => {
    expect(numberInWords(100)).toBe('cem');
    expect(numberInWords(101)).toBe('cento e um');
    expect(numberInWords(115)).toBe('cento e quinze');
    expect(numberInWords(242)).toBe('duzentos e quarenta e dois');
  });

  it('falls back to digits outside what it knows', () => {
    expect(numberInWords(1000)).toBe('1000');
    expect(numberInWords(2.5)).toBe('2.5');
  });
});

describe('what the caller says', () => {
  it('names the letter, then the number', () => {
    expect(ballPhrase(12)).toBe('Bê... doze.');
    expect(ballPhrase(31)).toBe('Ene... trinta e um.');
    expect(ballPhrase(60)).toBe('Gê... sessenta.');
    expect(ballPhrase(75)).toBe('Ó... setenta e cinco.');
  });

  it('announces a single winner by prize, name and card', () => {
    expect(winnersPhrase([winner({ name: 'Maria Silva', cardNumber: 14 })])).toBe(
      'Bingo! linha para Maria Silva, cartela catorze!',
    );
  });

  it('joins winners of the same prize, and gives each prize its own sentence', () => {
    expect(
      winnersPhrase([
        winner({ name: 'Carlos', cardNumber: 9 }),
        winner({ name: 'Beatriz', cardNumber: 22 }),
        winner({ prizeType: 'column', name: 'Ana', cardNumber: 3 }),
      ]),
    ).toBe(
      'Bingo! linha para Carlos, cartela nove e Beatriz, cartela vinte e dois. coluna para Ana, cartela três!',
    );
  });
});
