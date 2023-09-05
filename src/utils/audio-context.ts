import { once } from "@hiogawa/utils";
import AUDIOWORKLET_URL from "../audioworklet/build/index.js?url";

export let audioContext: AudioContext;

// maybe should delay so that the browser might allow autoplay (i.e. start unpaused)?
export function initAudioContext() {
  audioContext = new AudioContext();
}

export const initMetronome = once(async () => {
  await audioContext.audioWorklet.addModule(AUDIOWORKLET_URL);
  const node = new AudioWorkletNode(audioContext, "metronome");
  node.connect(audioContext.destination);
  return node;
});
