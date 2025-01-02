import fs from "node:fs";
import { encodeWav, f32_to_s16, s16_to_f32 } from "./src/utils/wav.ts";

// node --experimental-strip-types generate-wav.ts

// - bpm
// - time signature
// - number of bars
// - accent on 1st beat
// - use click sample?

function main() {
  // constant
  const sampleRate = 48000;

  // params
  const duration = 4;

  // generators params
  const bpm = 140;
  const frequency = 880;
  const attack = 0.005;
  const decay = 0.05;

  // generators
  const sine = new Sine();
  const envelope = new Envelope();
  const samplePlayer = new SamplePlayer(
    Float32Array.from(
      new Uint16Array(fs.readFileSync("./click-high.raw")),
      s16_to_f32
    )
  );

  // buffer (f32)
  const numSamples = duration * sampleRate;
  const buffer_f32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sineValue = sine.next(frequency / sampleRate);
    let envelopeValue = envelope.next(1 / sampleRate, attack, decay, 60 / bpm);
    buffer_f32[i] = sineValue * envelopeValue;

    samplePlayer.next;
  }

  // buffer (s16)
  // const buffer_s16 = new Int16Array(numSamples);
  // for (let i = 0; i < numSamples; i++) {
  //   buffer_s16[i] = Math.max(
  //     -32768,
  //     Math.min(32767, Math.round(buffer_f32[i] * 32767))
  //   );
  // }

  // // ffmpeg -f f32le -ar 48000 -ac 1 -i test_f32le_48000_1.raw output.wav
  // fs.writeFileSync("./test_f32le_48000_1.raw", buffer_f32);

  // // ffmpeg -f s16le -ar 48000 -ac 1 -i test_s16le_48000_1.raw output.wav
  // fs.writeFileSync("./test_s16le_48000_1.raw", buffer_s16);

  // output as .wav (pcm_f32le, mono)
  fs.writeFileSync(
    "./test.wav",
    encodeWav(Int16Array.from(buffer_f32, f32_to_s16), sampleRate)
  );
}

class Sine {
  private phase: number = 0; // [0, 1)

  next(delta: number): number {
    const value = Math.sin(2 * Math.PI * this.phase);
    this.phase = (this.phase + delta) % 1.0;
    return value;
  }
}

class Envelope {
  private phase: number = 0; // in second

  next(delta: number, attack: number, decay: number, interval: number) {
    let value = 0.0;
    if (this.phase < attack) {
      value = this.phase / attack;
    } else if (this.phase < attack + decay) {
      value = 1 - (this.phase - attack) / decay;
    }
    this.phase = (this.phase + delta) % interval;
    return value;
  }
}

class SamplePlayer {
  private phase: number = 0; // sample
  private samples: Float32Array;
  private playing = false;

  constructor(samples: Float32Array) {
    this.samples = samples;
  }

  next(hit: boolean) {
    if (hit) {
      this.playing = true;
      this.phase = 0;
    }
    let value = 0;
    if (this.playing) {
      value = this.samples[this.phase];
    }
    this.phase++;
    if (this.phase === this.samples.length) {
      this.playing = false;
    }
    return value;
  }
}

main();
