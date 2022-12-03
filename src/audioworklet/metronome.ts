import { range } from "lodash";
import { z } from "zod";

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
  private audioBufferOffset: number = 0; // integer
  private beatFrameOffset: number = 0; // integer

  constructor() {
    super();
  }

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
        defaultValue: 0.1,
        minValue: 0,
        maxValue: 2,
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

    const gain = parameters[PARAM_KEYS.gain][0];

    const bpm = parameters[PARAM_KEYS.bpm][0];
    const numFramesPerBeat = Math.floor((sampleRate * 60) / bpm);

    const frequency = parameters[PARAM_KEYS.frequency][0];
    const audioBufferSize = sampleRate / frequency;
    this.audioBufferOffset %= audioBufferSize;

    const attackDuration = parameters[PARAM_KEYS.attack][0];
    const decayDuration = parameters[PARAM_KEYS.decay][0];
    const attackOffset = attackDuration * sampleRate;
    const decayOffset = decayDuration * sampleRate;

    for (const i of range(PROCESS_SAMPLE_SIZE)) {
      this.audioBufferOffset %= audioBufferSize;
      this.beatFrameOffset %= numFramesPerBeat;

      // compute coefficent based on frame offset and attack/decay
      let coeff = 0;
      if (this.beatFrameOffset < attackOffset) {
        coeff = this.beatFrameOffset / attackOffset;
      } else if (this.beatFrameOffset < attackOffset + decayOffset) {
        coeff = 1 - (this.beatFrameOffset - attackOffset) / decayOffset;
      }
      const sin = Math.sin(
        (2 * Math.PI * frequency * this.audioBufferOffset) / sampleRate
      );
      channel[i] = gain * coeff * sin;

      this.audioBufferOffset++;
      this.beatFrameOffset++;
    }
    return true;
  }
}
