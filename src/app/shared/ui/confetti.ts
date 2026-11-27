import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
  width: number;
  height: number;
  color: string;
}

const COLOURS = ['--bx-gold', '--p-primary-500', '--bx-cream', '--bx-pine-line'];
const PIECES = 160;
const GRAVITY = 0.12;
const LIFETIME_MS = 6000;

// A canvas burst over the whole screen each time `burst` changes to a new value; nothing at all
// for reduced-motion users.
@Component({
  selector: 'bingyx-confetti',
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 50;
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class BingyxConfetti {
  readonly burst = input<unknown>(null);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));

    effect(() => {
      if (this.burst() !== null && this.burst() !== undefined) {
        this.fire();
      }
    });
  }

  private fire(): void {
    if (
      typeof window.matchMedia !== 'function' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = this.canvas().nativeElement;
    const context = canvas.getContext('2d');

    if (context === null) {
      return;
    }

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    context.scale(devicePixelRatio, devicePixelRatio);

    const style = getComputedStyle(document.documentElement);
    const colours = COLOURS.map((name) => style.getPropertyValue(name).trim() || 'gold');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, index) => ({
      x: width / 2 + (Math.random() - 0.5) * width * 0.3,
      y: height * 0.55,
      vx: (Math.random() - 0.5) * 14,
      vy: -8 - Math.random() * 10,
      spin: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI,
      width: 6 + Math.random() * 6,
      height: 3 + Math.random() * 4,
      color: colours[index % colours.length] ?? 'gold',
    }));
    const started = performance.now();

    cancelAnimationFrame(this.frame);

    const step = (now: number) => {
      context.clearRect(0, 0, width, height);

      for (const piece of pieces) {
        piece.vy += GRAVITY;
        piece.vx *= 0.99;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        context.restore();
      }

      if (now - started < LIFETIME_MS) {
        this.frame = requestAnimationFrame(step);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    this.frame = requestAnimationFrame(step);
  }
}
