import { Injectable, signal } from '@angular/core';

import { Line, soundOnPhrase } from './phrases';

const RATE = 0.92;

type Clips = Record<string, readonly string[] | undefined>;

// Browsers refuse to play sound before the page has had a click, so the voice starts disabled
// and the draw screen asks for one ("Ativar som"); the first line there unlocks it.
//
// Each line plays its recorded take from public/voice/ when there is one, and the browser's own
// voice otherwise, so a missing clip or a failed download only costs the human voice.
@Injectable()
export class Announcer {
  private readonly synth: SpeechSynthesis | undefined =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : undefined;
  private voice: SpeechSynthesisVoice | null = null;
  // Chrome on Android drops an utterance nothing references any more before it is heard.
  private current: SpeechSynthesisUtterance | null = null;
  // One element for every clip: iOS unlocks the element the click played, not the page.
  private audio: HTMLAudioElement | undefined;
  private clips: Clips = {};
  private queue: (() => void)[] = [];
  private busy = false;
  // Bumped on every interruption, so callbacks of whatever was cut off do nothing.
  private turn = 0;

  readonly supported = this.synth !== undefined || typeof Audio !== 'undefined';
  readonly enabled = signal(false);

  constructor() {
    this.pickVoice();
    this.synth?.addEventListener('voiceschanged', () => this.pickVoice());
    void this.loadClips();
  }

  enable(): void {
    if (!this.supported) {
      return;
    }

    if (this.audio === undefined && typeof Audio !== 'undefined') {
      this.audio = new Audio();
    }

    // The click also has to unlock the browser voice, which says the winners' names after the
    // recorded "Bingo!"; an empty line is enough and makes no sound. Nothing may interrupt it,
    // or the cancel() would make phones drop the greeting queued behind it.
    this.synth?.speak(new SpeechSynthesisUtterance(''));

    this.enabled.set(true);
    this.say(soundOnPhrase());
  }

  disable(): void {
    this.enabled.set(false);
    this.stop();
  }

  // An interrupting line (a new ball) drops whatever is still queued; anything else waits.
  say(lines: Line | readonly Line[], interrupt = false): void {
    if (!this.enabled()) {
      return;
    }

    if (interrupt) {
      this.stop();
    }

    for (const line of Array.isArray(lines) ? lines : [lines]) {
      const file = this.pickClip(line.clip);

      if (file === undefined) {
        this.queue.push(() => this.speak(line.text));
      } else {
        this.queue.push(() => this.play(file, line.text));

        if (line.after !== undefined) {
          const after = line.after;

          this.queue.push(() => this.speak(after));
        }
      }
    }

    if (!this.busy) {
      this.next();
    }
  }

  private next(): void {
    const step = this.queue.shift();

    this.busy = step !== undefined;
    step?.();
  }

  private stop(): void {
    this.turn++;
    this.queue = [];
    this.busy = false;
    this.audio?.pause();

    // Mobile browsers silently drop a speak() that follows cancel() on an idle synth, which
    // killed the very first line, the one that has to run inside the click to unlock audio.
    if (this.synth?.speaking || this.synth?.pending) {
      this.synth.cancel();
    }
  }

  private play(file: string, fallback: string): void {
    const audio = this.audio;

    if (audio === undefined) {
      this.speak(fallback);
      return;
    }

    const turn = this.turn;
    let settled = false;
    // Both onerror and the rejected play() report a broken clip; only the first one counts.
    const settle = (then: () => void) => () => {
      if (!settled && turn === this.turn) {
        settled = true;
        then();
      }
    };
    const done = settle(() => this.next());
    const failed = settle(() => this.speak(fallback));

    audio.onended = done;
    audio.onerror = failed;
    audio.src = new URL(`voice/${file}`, document.baseURI).href;
    audio.play().catch(failed);
  }

  private speak(text: string): void {
    if (this.synth === undefined) {
      this.next();
      return;
    }

    const turn = this.turn;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'pt-BR';
    utterance.rate = RATE;

    if (this.voice !== null) {
      utterance.voice = this.voice;
    }

    utterance.onend = utterance.onerror = () => {
      if (this.current === utterance) {
        this.current = null;
      }

      if (turn === this.turn) {
        this.next();
      }
    };
    this.current = utterance;

    // Chrome can leave the synth paused after the tab was in the background.
    this.synth.resume();
    this.synth.speak(utterance);
  }

  private pickClip(clip: string | undefined): string | undefined {
    const files = clip === undefined ? undefined : this.clips[clip];

    return files?.length ? files[Math.floor(Math.random() * files.length)] : undefined;
  }

  private async loadClips(): Promise<void> {
    if (typeof fetch === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      const response = await fetch(new URL('voice/manifest.json', document.baseURI));

      if (response.ok) {
        this.clips = (await response.json()) as Clips;
      }
    } catch {
      // No recordings: the browser voice says everything.
    }
  }

  private pickVoice(): void {
    // Network voices fail silently on phones without a good connection; prefer on-device ones.
    const voices = (this.synth?.getVoices() ?? [])
      .slice()
      .sort((a, b) => Number(b.localService) - Number(a.localService));

    this.voice =
      voices.find((voice) => voice.lang === 'pt-BR') ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('pt')) ??
      null;
  }
}
