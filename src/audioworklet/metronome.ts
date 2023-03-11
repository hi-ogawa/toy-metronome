import { range } from "lodash";
import { z } from "zod";
import { decibelToGain } from "../utils/conversion";
import { CUSTOM_MESSAGE_SCHEMA } from "./common";

// https://webaudio.github.io/web-audio-api/#rendering-loop
const PROCESS_SAMPLE_SIZE = 128;

const PARAM_KEYS_SCHEMA = z.enum([
  "bpm",
  "gain",
  "frequency",
  "attack",
  "decay",
]);
const PARAM_KEYS = PARAM_KEYS_SCHEMA.Values;

export class MetronomeProcessor extends AudioWorkletProcessor {
  private sine = new Sine();
  private envelope = new Envelope();

  constructor() {
    super();
    this.port.onmessage = this.handleMessage;
  }

  private handleMessage = (e: MessageEvent) => {
    const message = CUSTOM_MESSAGE_SCHEMA.parse(e.data);
    switch (message.type) {
      case "setState": {
        this.envelope.playing = message.data.playing;
        return;
      }
    }
  };

  static override get parameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        name: PARAM_KEYS.bpm,
        defaultValue: 140,
        minValue: 1,
        maxValue: 320,
        automationRate: "k-rate",
      },
      {
        name: PARAM_KEYS.gain,
        defaultValue: decibelToGain(-10),
        minValue: decibelToGain(-40),
        maxValue: decibelToGain(10),
        automationRate: "k-rate",
      },
      {
        name: PARAM_KEYS.frequency,
        defaultValue: 880,
        minValue: 10,
        maxValue: 3000,
        automationRate: "k-rate",
      },
      {
        name: PARAM_KEYS.attack,
        defaultValue: 0.005,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate",
      },
      {
        name: PARAM_KEYS.decay,
        defaultValue: 0.05,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate",
      },
    ];
  }

  override process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    // handle only first output/channel for simplicity
    const channel = outputs[0]?.[0];
    if (!channel) {
      return true;
    }

    // parameters
    const gain = parameters[PARAM_KEYS.gain][0];
    const bpm = parameters[PARAM_KEYS.bpm][0];
    const frequency = parameters[PARAM_KEYS.frequency][0];
    const attackDuration = parameters[PARAM_KEYS.attack][0];
    const decayDuration = parameters[PARAM_KEYS.decay][0];

    for (const i of range(PROCESS_SAMPLE_SIZE)) {
      const sineValue = this.sine.next(frequency / sampleRate);
      const envelopeValue = this.envelope.next(
        1 / sampleRate,
        attackDuration,
        decayDuration,
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
