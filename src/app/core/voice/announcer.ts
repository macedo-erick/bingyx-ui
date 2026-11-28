import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { Line, soundOnPhrase } from './phrases';

const RATE = 0.92;

type Clips = Record<string, readonly string[] | undefined>;

// A tenth of a second of silence, played to find out whether the browser lets the page make sound.
const SILENCE =
  'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

// Presses that count as a user gesture: a TV remote only sends keys, a phone only touches.
const GESTURES = ['keydown', 'pointerup', 'touchend', 'click'] as const;

// The voice is on from the start, so a TV that nobody touches still calls the balls. Browsers
// that refuse to play sound before the page has had a gesture keep it silent until one comes:
// any press anywhere (a remote key included) unlocks it, and the draw screen's "Ativar som"
// button stays there for whoever looks for it. Presses on an element marked data-sound-toggle
// are left to that element, which calls enable() or disable() itself.
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
  private listening = false;

  readonly supported = this.synth !== undefined || typeof Audio !== 'undefined';
  // What the person chose: sound on, unless they turned it off.
  readonly enabled = signal(this.supported);
  // Whether the browser lets the page make sound yet.
  readonly unlocked = signal(false);
  // What is actually heard.
  readonly on = computed(() => this.enabled() && this.unlocked());

  private readonly onGesture = (event: Event): void => {
    const target = event.target as Element | null;

    if (typeof target?.closest === 'function' && target.closest('[data-sound-toggle]')) {
      return;
    }

    this.unlock();
  };

  constructor() {
    this.pickVoice();
    this.synth?.addEventListener('voiceschanged', () => this.pickVoice());
    void this.loadClips();

    if (!this.supported) {
      return;
    }

    if (typeof Audio !== 'undefined') {
      this.audio = new Audio();
    }

    this.listen();
    this.probe();
    inject(DestroyRef).onDestroy(() => this.unlisten());
  }

  enable(): void {
    if (!this.supported) {
      return;
    }

    // The click has to unlock the browser voice too, which says the winners' names after the
    // recorded "Bingo!"; an empty line is enough and makes no sound. Nothing may interrupt it,
    // or the cancel() would make phones drop the greeting queued behind it.
    this.wakeSynth();
    this.unlisten();

    this.enabled.set(true);
    this.unlocked.set(true);
    this.say(soundOnPhrase());
  }

  disable(): void {
    this.enabled.set(false);
    this.stop();
  }

  // An interrupting line (a new ball) drops whatever is still queued; anything else waits.
  say(lines: Line | readonly Line[], interrupt = false): void {
    if (!this.on()) {
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

  // Tries a silent clip without any gesture: a browser that allows autoplay (most TVs, a kiosk)
  // plays it, and the voice is heard from the very first ball.
  private probe(): void {
    const audio = this.audio;

    if (audio === undefined) {
      // Only the browser voice: nothing to test it with, so try it and see.
      this.unlocked.set(true);
      return;
    }

    this.playSilence(audio);
  }

  // Runs inside a press anywhere on the page, which is what browsers wait for.
  private unlock(): void {
    this.wakeSynth();

    if (this.audio === undefined) {
      this.unlocked.set(true);
      this.unlisten();
      return;
    }

    if (this.unlocked()) {
      // The clips already played; the press was only needed for the browser voice.
      this.unlisten();
      return;
    }

    this.playSilence(this.audio, () => this.unlisten());
  }

  private playSilence(audio: HTMLAudioElement, then?: () => void): void {
    const turn = this.turn;

    audio.onended = audio.onerror = null;
    audio.src = SILENCE;

    let played: Promise<void> | undefined;

    try {
      played = audio.play();
    } catch {
      return;
    }

    void played?.then(
      () => {
        if (turn === this.turn) {
          this.unlocked.set(true);
          then?.();
        }
      },
      () => {
        // Still blocked: the next press tries again.
      },
    );
  }

  // The browser refused a line it had allowed before: wait for a press again.
  private lock(): void {
    this.unlocked.set(false);
    this.stop();
    this.listen();
  }

  private wakeSynth(): void {
    try {
      this.synth?.speak(new SpeechSynthesisUtterance(''));
    } catch {
      // Some TV browsers expose a voice that throws; the recordings still play.
    }
  }

  private listen(): void {
    if (this.listening || typeof document === 'undefined') {
      return;
    }

    this.listening = true;

    for (const type of GESTURES) {
      document.addEventListener(type, this.onGesture, { capture: true });
    }
  }

  private unlisten(): void {
    if (!this.listening) {
      return;
    }

    this.listening = false;

    for (const type of GESTURES) {
      document.removeEventListener(type, this.onGesture, { capture: true });
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
    const refused = (error: unknown) => {
      // A DOMException, which is not an Error everywhere.
      if ((error as { name?: unknown } | null)?.name === 'NotAllowedError') {
        settle(() => this.lock())();
      } else {
        failed();
      }
    };

    audio.onended = done;
    audio.onerror = failed;
    audio.src = new URL(`voice/${file}`, document.baseURI).href;

    try {
      audio.play().catch(refused);
    } catch (error) {
      refused(error);
    }
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
    try {
      this.synth.resume();
      this.synth.speak(utterance);
    } catch {
      this.current = null;
      this.next();
    }
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
