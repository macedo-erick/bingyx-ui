import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Announcer } from './announcer';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly text: string) {}
}

class FakeAudio {
  static last: FakeAudio | undefined;
  static broken = false;
  // A browser that refuses to play anything before the page has had a gesture.
  static locked = false;

  src = '';
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => {
    if (FakeAudio.locked) {
      return Promise.reject(new DOMException('no gesture yet', 'NotAllowedError'));
    }

    return FakeAudio.broken ? Promise.reject(new Error('broken')) : Promise.resolve();
  });
  pause = vi.fn();

  constructor() {
    FakeAudio.last = this;
  }
}

async function withSpeech(clips: Record<string, string[]> = {}, locked = false) {
  const synth = {
    speaking: false,
    pending: false,
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      { lang: 'en-US', name: 'English', localService: true },
      { lang: 'pt-BR', name: 'Google pt-BR', localService: false },
      { lang: 'pt-BR', name: 'Luciana', localService: true },
    ]),
    addEventListener: vi.fn(),
  };

  FakeAudio.last = undefined;
  FakeAudio.broken = false;
  FakeAudio.locked = locked;
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(clips) })),
  );
  TestBed.configureTestingModule({ providers: [Announcer] });

  const announcer = TestBed.inject(Announcer);

  // Let the clip manifest arrive and the silent autoplay test settle.
  await new Promise((resolve) => setTimeout(resolve));
  (FakeAudio.last as FakeAudio | undefined)?.play.mockClear();

  const spoken = () =>
    synth.speak.mock.calls
      .map(([utterance]) => utterance as FakeUtterance)
      .filter((utterance) => utterance.text !== '');

  return { synth, announcer, spoken };
}

describe('Announcer', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('calls the balls without any click when the browser allows autoplay', async () => {
    const { announcer } = await withSpeech({ 'ball-12': ['ball-12-1.mp3'] });

    expect(announcer.on()).toBe(true);

    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);

    expect(FakeAudio.last?.src).toContain('voice/ball-12-1.mp3');
  });

  it('stays silent while the browser blocks sound, until any key is pressed', async () => {
    const { synth, announcer } = await withSpeech({ 'ball-12': ['ball-12-1.mp3'] }, true);

    expect(announcer.enabled()).toBe(true);
    expect(announcer.on()).toBe(false);

    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);

    expect(FakeAudio.last?.play).not.toHaveBeenCalled();
    expect(synth.speak).not.toHaveBeenCalled();

    FakeAudio.locked = false;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((resolve) => setTimeout(resolve));

    expect(announcer.on()).toBe(true);

    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);

    expect(FakeAudio.last?.src).toContain('voice/ball-12-1.mp3');
  });

  it('leaves presses on the sound button to the button', async () => {
    const { announcer } = await withSpeech({}, true);
    const button = document.createElement('button');

    button.setAttribute('data-sound-toggle', '');
    document.body.append(button);
    FakeAudio.locked = false;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    button.remove();

    expect(announcer.on()).toBe(false);
  });

  it('waits for a press again when the browser takes the sound back', async () => {
    const { announcer } = await withSpeech({ 'ball-12': ['ball-12-1.mp3'] });

    FakeAudio.locked = true;
    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);
    await new Promise((resolve) => setTimeout(resolve));

    expect(announcer.on()).toBe(false);
    expect(announcer.enabled()).toBe(true);
  });

  it('plays the recorded take of a line when there is one', async () => {
    const { announcer, spoken } = await withSpeech({
      'sound-on': ['sound-on-1.mp3'],
      'ball-12': ['ball-12-1.mp3'],
    });

    announcer.enable();
    expect(FakeAudio.last?.src).toContain('voice/sound-on-1.mp3');

    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);

    expect(FakeAudio.last?.src).toContain('voice/ball-12-1.mp3');
    expect(spoken()).toEqual([]);
  });

  it('speaks Brazilian Portuguese with an on-device voice when there is no recording', async () => {
    const { announcer, spoken } = await withSpeech();

    announcer.enable();
    announcer.say({ clip: 'ball-12', text: 'Bê... doze.' }, true);

    const line = spoken().at(-1);

    expect(line?.text).toBe('Bê... doze.');
    expect(line?.lang).toBe('pt-BR');
    expect(line?.voice).toMatchObject({ name: 'Luciana' });
  });

  it('falls back to the browser voice when a recording will not play', async () => {
    const { announcer, spoken } = await withSpeech({ 'sound-on': ['sound-on-1.mp3'] });

    FakeAudio.broken = true;
    announcer.enable();
    await Promise.resolve();

    expect(spoken().map((line) => line.text)).toEqual(['Som ativado. Boa sorte a todos!']);
  });

  it('says the winners’ names once the recorded “Bingo!” ends', async () => {
    const { announcer, spoken } = await withSpeech({ 'win-line': ['win-line-1.mp3'] });

    announcer.enable();
    spoken()[0]?.onend?.();
    announcer.say({ clip: 'win-line', text: 'Bingo! linha para Ana!', after: 'Ana!' }, true);

    expect(spoken().map((line) => line.text)).toEqual(['Som ativado. Boa sorte a todos!']);

    FakeAudio.last?.onended?.();

    expect(spoken().map((line) => line.text)).toEqual(['Som ativado. Boa sorte a todos!', 'Ana!']);
  });

  it('cuts off what is playing when a new ball must be called at once', async () => {
    const { synth, announcer } = await withSpeech();

    announcer.enable();
    synth.cancel.mockClear();
    synth.speaking = true;
    announcer.say({ text: 'Bê... doze.' }, true);

    expect(synth.cancel).toHaveBeenCalled();
  });

  it('does not cancel an idle synth, which phones punish by dropping the next line', async () => {
    const { synth, announcer, spoken } = await withSpeech();

    announcer.enable();

    expect(synth.cancel).not.toHaveBeenCalled();
    expect(spoken()).toHaveLength(1);
  });

  it('stops talking when turned off', async () => {
    const { synth, announcer } = await withSpeech();

    announcer.enable();
    synth.speaking = true;
    announcer.disable();
    synth.speak.mockClear();
    announcer.say({ text: 'Ó... setenta e cinco.' });

    expect(synth.speak).not.toHaveBeenCalled();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
