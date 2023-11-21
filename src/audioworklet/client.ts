import {
  type TinyRpcProxy,
  messagePortClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { once } from "@hiogawa/utils";
import { METRONOME_PROCESSOR_NAME } from "./common";
import AUDIOWORKLET_URL from "./index?worker&url";
import type { MetronomeProcessor } from "./metronome";

// singleton
export let metronomeNode: AudioWorkletNode;
export let metronomeRpc: TinyRpcProxy<MetronomeProcessor>;

export const initMetronomeNode = once(async (audioContext: AudioContext) => {
  await audioContext.audioWorklet.addModule(AUDIOWORKLET_URL);
  metronomeNode = new AudioWorkletNode(audioContext, METRONOME_PROCESSOR_NAME);
  metronomeNode.connect(audioContext.destination);
  metronomeRpc = proxyTinyRpc({
    adapter: messagePortClientAdapter({
      port: metronomeNode.port,
    }),
  });
  metronomeNode.port.start();
});
