import { decibelToGain } from "../utils/conversion";

export const METRONOME_PROCESSOR_NAME = "metronome";

export const METRONOME_PARAM_SPEC = {
  bpm: {
    defaultValue: 140,
    minValue: 1,
    maxValue: 320,
  },
  gain: {
    defaultValue: decibelToGain(-10),
    minValue: decibelToGain(-40),
    maxValue: decibelToGain(10),
  },
  frequency: {
    defaultValue: 880,
    minValue: 10,
    maxValue: 3000,
  },
  attack: {
    defaultValue: 0.005,
    minValue: 0,
    maxValue: 1,
  },
  decay: {
    defaultValue: 0.05,
    minValue: 0,
    maxValue: 1,
  },
};

export type MetronomeParamKey = keyof typeof METRONOME_PARAM_SPEC;
