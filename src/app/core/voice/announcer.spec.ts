import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Announcer } from './announcer';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;

  constructor(readonly text: string) {}
}

function withSpeech() {
  const synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [
      { lang: 'en-US', name: 'English' },
      { lang: 'pt-BR', name: 'Luciana' },
    ]),
    addEventListener: vi.fn(),
  };

  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  TestBed.configureTestingModule({ providers: [Announcer] });

  return { synth, announcer: TestBed.inject(Announcer) };
}

describe('Announcer', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stays silent until someone turns the sound on', () => {
    const { synth, announcer } = withSpeech();

    announcer.say('Bê... doze.');

    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('speaks Brazilian Portuguese with a Brazilian voice once on', () => {
    const { synth, announcer } = withSpeech();

    announcer.enable();
    announcer.say('Bê... doze.');

    const spoken = synth.speak.mock.calls.at(-1)?.[0] as FakeUtterance;

    expect(spoken.text).toBe('Bê... doze.');
    expect(spoken.lang).toBe('pt-BR');
    expect(spoken.voice).toMatchObject({ name: 'Luciana' });
  });

  it('cuts off what is queued when a new ball must be called at once', () => {
    const { synth, announcer } = withSpeech();

    announcer.enable();
    synth.cancel.mockClear();
    announcer.say('Bê... doze.', true);

    expect(synth.cancel).toHaveBeenCalled();
  });

  it('stops talking when turned off', () => {
    const { synth, announcer } = withSpeech();

    announcer.enable();
    announcer.disable();
    synth.speak.mockClear();
    announcer.say('Ó... setenta e cinco.');

    expect(synth.speak).not.toHaveBeenCalled();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
