import fs from "node:fs";

// node --experimental-strip-types generate-wav.ts

// - bpm
// - time signature
// - number of bars
// - accent on 1st beat
// - use click sample?

function main() {
  // params
  const duration = 4;
  const sampleRate = 48000;

  // generators params
  const bpm = 140;
  const frequency = 880;
  const attack = 0.005;
  const decay = 0.05;

  // generators
  const sine = new Sine();
  const envelope = new Envelope();

  // buffer (f32)
  const numSamples = duration * sampleRate;
  const buffer_f32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sineValue = sine.next(frequency / sampleRate);
    let envelopeValue = envelope.next(1 / sampleRate, attack, decay, 60 / bpm);
    buffer_f32[i] = sineValue * envelopeValue;
  }

  // buffer (s16)
  const buffer_s16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buffer_s16[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(buffer_f32[i] * 32767))
    );
  }

  // ffmpeg -f f32le -ar 48000 -ac 1 -i test_f32le_48000_1.raw output.wav
  fs.writeFileSync("./test_f32le_48000_1.raw", buffer_f32);

  // ffmpeg -f s16le -ar 48000 -ac 1 -i test_s16le_48000_1.raw output.wav
  fs.writeFileSync("./test_s16le_48000_1.raw", buffer_s16);

  // output as .wav (pcm_f32le, mono)
  fs.writeFileSync("./test.wav", encode(buffer_s16, sampleRate));
}

/**
 * @param data
 * @param f sample rate
 * https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
 */
function encode(data: Int16Array, f: number) {
  const nc = 1; // mono
  const ns = data.length;
  const m = data.byteLength / data.length;
  const pad = (m * nc * ns) & 1;
  return joinBuffers([
    text("RIFF"),
    u32(4 + 24 + 8 + nc * ns * m + pad),
    text("WAVE"),
    text("fmt "),
    u32(16),
    u16(1), // WAVE_FORMAT_PCM
    u16(nc),
    u32(f),
    u32(f * m * nc), // bytes per sec
    u16(m * nc), // block alignment
    u16(8 * m), // bits per sample
    text("data"),
    u32(m * nc * ns),
    data.buffer,
    text(pad ? "\x00" : ""),
  ]);

  function u32(n: number) {
    return new Uint32Array([n]).buffer;
  }

  function u16(n: number) {
    return new Uint16Array([n]).buffer;
  }

  function text(s: string) {
    return new TextEncoder().encode(s).buffer;
  }

  function joinBuffers(buffers: ArrayBufferLike[]) {
    let total = 0;
    for (const buffer of buffers) {
      total += buffer.byteLength;
    }

    let result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    return result;
  }
}

class Sine {
  private phase: number = 0;

  next(delta: number): number {
    const value = Math.sin(2 * Math.PI * this.phase);
    this.phase = (this.phase + delta) % 1.0;
    return value;
  }
}

class Envelope {
  playing = true;
  private phase: number = 0;

  next(delta: number, attack: number, decay: number, interval: number) {
    let value = 0.0;
    // keep playing until envelop finishes to avoid glitch
    if (!this.playing && this.phase <= delta) {
      return value;
    }
    if (this.phase < attack) {
      value = this.phase / attack;
    } else if (this.phase < attack + decay) {
      value = 1 - (this.phase - attack) / decay;
    }
    this.phase = (this.phase + delta) % interval;
    return value;
  }
}

main();
