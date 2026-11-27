import { Injectable, signal } from '@angular/core';

const RATE = 0.92;

// Browsers refuse to speak before the page has had a click, so the voice starts disabled and
// the draw screen asks for one ("Ativar som"); the first utterance there unlocks it.
@Injectable()
export class Announcer {
  private readonly synth: SpeechSynthesis | undefined =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : undefined;
  private voice: SpeechSynthesisVoice | null = null;

  readonly supported = this.synth !== undefined;
  readonly enabled = signal(false);

  constructor() {
    this.pickVoice();
    this.synth?.addEventListener('voiceschanged', () => this.pickVoice());
  }

  enable(): void {
    if (this.synth === undefined) {
      return;
    }

    this.enabled.set(true);
    this.say('Som ativado. Boa sorte a todos!', true);
  }

  disable(): void {
    this.enabled.set(false);
    this.synth?.cancel();
  }

  // An interrupting line (a new ball) drops whatever is still queued; anything else waits.
  say(text: string, interrupt = false): void {
    if (this.synth === undefined || !this.enabled()) {
      return;
    }

    if (interrupt) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'pt-BR';
    utterance.rate = RATE;

    if (this.voice !== null) {
      utterance.voice = this.voice;
    }

    this.synth.speak(utterance);
  }

  private pickVoice(): void {
    const voices = this.synth?.getVoices() ?? [];

    this.voice =
      voices.find((voice) => voice.lang === 'pt-BR') ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('pt')) ??
      null;
  }
}
