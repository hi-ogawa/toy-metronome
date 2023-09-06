import { exposeTinyRpc, messagePortServerAdapter } from "@hiogawa/tiny-rpc";
import { objectMapValues, range } from "@hiogawa/utils";
import { METRONOME_PARAM_SPEC, type MetronomeParamKey } from "./common";

// https://webaudio.github.io/web-audio-api/#rendering-loop
const PROCESS_SAMPLE_SIZE = 128;

export class MetronomeProcessor extends AudioWorkletProcessor {
  private sine = new Sine();
  private envelope = new Envelope();
  private params = objectMapValues(METRONOME_PARAM_SPEC, (v) => v.defaultValue);

  constructor() {
    super();
    exposeTinyRpc({
      routes: this,
      adapter: messagePortServerAdapter({
        port: this.port,
      }),
    });
    this.port.start();
  }

  setPlaying(v: boolean) {
    this.envelope.playing = v;
  }

  setParam(k: MetronomeParamKey, v: number) {
    this.params[k] = v;
  }

  override process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    // handle only first output/channel for simplicity
    const channel = outputs[0]?.[0];
    if (!channel) {
      return true;
    }

    // parameters
    const { gain, bpm, frequency, attack, decay } = this.params;

    // process sine and envelope
    for (const i of range(PROCESS_SAMPLE_SIZE)) {
      const sineValue = this.sine.next(frequency / sampleRate);
      const envelopeValue = this.envelope.next(
        1 / sampleRate,
        attack,
        decay,
        60 / bpm
      );
      channel[i] = gain * envelopeValue * sineValue;
    }
    return true;
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
  playing = false;
  private phase: number = 0;

  next(delta: number, attack: number, release: number, interval: number) {
    let value = 0.0;
    // keep playing until envelop finishes to avoid glitch
    if (!this.playing && this.phase <= delta) {
      return value;
    }
    if (this.phase < attack) {
      value = this.phase / attack;
    } else if (this.phase < attack + release) {
      value = 1 - (this.phase - attack) / release;
    }
    this.phase = (this.phase + delta) % interval;
    return value;
  }
}
