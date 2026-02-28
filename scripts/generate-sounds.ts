import * as fs from "fs";
import * as path from "path";

const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

interface ToneSegment {
  frequency: number;
  durationMs: number;
  amplitude: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  type?: "sine" | "square" | "noise";
}

function generateSamples(segments: ToneSegment[]): Int16Array {
  let totalSamples = 0;
  for (const seg of segments) {
    totalSamples += Math.floor((seg.durationMs / 1000) * SAMPLE_RATE);
  }
  const samples = new Int16Array(totalSamples);

  let offset = 0;
  for (const seg of segments) {
    const numSamples = Math.floor((seg.durationMs / 1000) * SAMPLE_RATE);
    const fadeInSamples = Math.floor(((seg.fadeInMs ?? 5) / 1000) * SAMPLE_RATE);
    const fadeOutSamples = Math.floor(((seg.fadeOutMs ?? 5) / 1000) * SAMPLE_RATE);

    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      let value: number;

      if (seg.type === "square") {
        value = Math.sin(2 * Math.PI * seg.frequency * t) >= 0 ? 1 : -1;
      } else if (seg.type === "noise") {
        value = Math.random() * 2 - 1;
      } else {
        value = Math.sin(2 * Math.PI * seg.frequency * t);
      }

      let envelope = 1.0;
      if (i < fadeInSamples) {
        envelope = i / fadeInSamples;
      } else if (i > numSamples - fadeOutSamples) {
        envelope = (numSamples - i) / fadeOutSamples;
      }

      samples[offset + i] = Math.round(value * envelope * seg.amplitude * 32767);
    }
    offset += numSamples;
  }

  return samples;
}

function writeWav(filePath: string, samples: Int16Array): void {
  const dataSize = samples.length * 2;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 28);
  buffer.writeUInt16LE(NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

const sounds: Record<string, ToneSegment[]> = {
  "terminal-open": [
    { frequency: 523.25, durationMs: 80, amplitude: 0.6, fadeInMs: 5, fadeOutMs: 10 },
    { frequency: 659.25, durationMs: 80, amplitude: 0.6, fadeInMs: 5, fadeOutMs: 20 },
  ],
  "terminal-close": [
    { frequency: 659.25, durationMs: 80, amplitude: 0.5, fadeInMs: 5, fadeOutMs: 10 },
    { frequency: 523.25, durationMs: 80, amplitude: 0.5, fadeInMs: 5, fadeOutMs: 20 },
  ],
  "command-start": [
    { frequency: 800, durationMs: 25, amplitude: 0.4, fadeInMs: 1, fadeOutMs: 5, type: "square" },
  ],
  "command-success": [
    { frequency: 523.25, durationMs: 60, amplitude: 0.5, fadeInMs: 3, fadeOutMs: 10 },
    { frequency: 659.25, durationMs: 60, amplitude: 0.5, fadeInMs: 3, fadeOutMs: 10 },
    { frequency: 783.99, durationMs: 80, amplitude: 0.5, fadeInMs: 3, fadeOutMs: 25 },
  ],
  "command-fail": [
    ...Array.from({ length: 10 }, (_, i) => ({
      frequency: 400 - i * 20,
      durationMs: 20,
      amplitude: 0.6,
      fadeInMs: 1,
      fadeOutMs: 1,
      type: "square" as const,
    })),
  ],
};

const soundsDir = path.join(__dirname, "..", "sounds");
fs.mkdirSync(soundsDir, { recursive: true });

for (const [name, segments] of Object.entries(sounds)) {
  const samples = generateSamples(segments);
  const filePath = path.join(soundsDir, `${name}.wav`);
  writeWav(filePath, samples);
  const durationMs = (samples.length / SAMPLE_RATE * 1000).toFixed(0);
  console.log(`Generated: ${name}.wav (${samples.length} samples, ${durationMs}ms)`);
}
