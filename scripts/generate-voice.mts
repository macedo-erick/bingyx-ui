// Records the draw screen's lines with an ElevenLabs voice, once, into public/voice/.
//
//   node scripts/generate-voice.mts                 every clip still missing
//   node scripts/generate-voice.mts --sample <dir> [line...]  a few lines in each model, to compare
//
// The key lives in .env.elevenlabs (ELEVENLABS_API_KEY=...), which git ignores. Clips already on
// disk are skipped, so a run cut short by the credit limit picks up where it stopped.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { letterName, numberInWords } from '../src/app/core/voice/words.ts';

const VOICE_ID = 'Yu6uoFniEUcJhbrF7K1D';
const MODEL = 'eleven_v3';
const OUT_DIR = 'public/voice';

// Said before a ball now and then, so the caller does not sound like a metronome.
const LEAD_INS = ['Olha ela!', 'Saiu agora!', 'Atenção!', 'Lá vem!', 'Próxima bola!'];

interface Clip {
  readonly id: string;
  readonly variants: readonly string[];
}

function clips(): Clip[] {
  const balls = Array.from({ length: 75 }, (_, index) => {
    const ball = index + 1;
    const call = `${letterName(ball)}... ${numberInWords(ball)}!`;

    return {
      id: `ball-${ball}`,
      variants: [`[excited] ${call}`, `[excited] ${LEAD_INS[index % LEAD_INS.length]} ${call}`],
    };
  });

  return [
    { id: 'sound-on', variants: ['[cheerfully] Som ativado! Boa sorte a todos!'] },
    { id: 'claim', variants: ['[excited] Bingo pedido! Vamos conferir as cartelas!'] },
    { id: 'win-line', variants: ['[shouting] Bingo! [excited] Temos ganhador na linha!'] },
    { id: 'win-column', variants: ['[shouting] Bingo! [excited] Temos ganhador na coluna!'] },
    { id: 'win-diagonal', variants: ['[shouting] Bingo! [excited] Temos ganhador na diagonal!'] },
    { id: 'win-full', variants: ['[shouting] Cartela cheia! [excited] Temos ganhador!'] },
    { id: 'finished', variants: ['[excited] E acabou, gente! Feliz Natal pra todo mundo!'] },
    ...balls,
  ];
}

function apiKey(): string {
  const line = readFileSync('.env.elevenlabs', 'utf8')
    .split('\n')
    .find((entry) => entry.startsWith('ELEVENLABS_API_KEY='));
  const key = line?.slice('ELEVENLABS_API_KEY='.length).trim();

  if (!key) {
    throw new Error('ELEVENLABS_API_KEY is missing from .env.elevenlabs');
  }

  return key;
}

// v2 does not understand the [tags], so they are dropped for it.
async function speak(key: string, text: string, model: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify(
        model === 'eleven_v3'
          ? { text, model_id: model, language_code: 'pt', voice_settings: { stability: 0.5 } }
          : {
              text: text.replace(/\[[^\]]*\]\s*/g, ''),
              model_id: model,
              language_code: 'pt',
              voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.5 },
            },
      ),
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function sample(key: string, dir: string, given: readonly string[]): Promise<void> {
  const lines = given.length
    ? given
    : [
        '[excited] Olha ela! Gê... cinquenta e dois!',
        '[excited] Bê... doze!',
        '[shouting] Bingo! [excited] Temos ganhador na linha!',
      ];

  mkdirSync(dir, { recursive: true });

  for (const model of given.length ? [MODEL] : ['eleven_v3', 'eleven_multilingual_v2']) {
    for (const [index, text] of lines.entries()) {
      const file = join(dir, `${model}-${index + 1}.mp3`);

      writeFileSync(file, await speak(key, text, model));
      console.log(file);
    }
  }
}

async function generate(key: string): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const clip of clips()) {
    for (const [index, text] of clip.variants.entries()) {
      const file = join(OUT_DIR, `${clip.id}-${index + 1}.mp3`);

      if (!existsSync(file)) {
        writeFileSync(file, await speak(key, text, MODEL));
        console.log(file);
      }
    }
  }

  // The screen picks a random variant from this list, and falls back to the browser voice for
  // any line that has none.
  const files = readdirSync(OUT_DIR).filter((name) => name.endsWith('.mp3'));
  const manifest = Object.fromEntries(
    clips().map((clip) => [clip.id, files.filter((name) => name.startsWith(`${clip.id}-`))]),
  );

  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

const key = apiKey();
const sampleAt = process.argv.indexOf('--sample');

await (sampleAt === -1
  ? generate(key)
  : sample(key, process.argv[sampleAt + 1] ?? 'voice-samples', process.argv.slice(sampleAt + 2)));
