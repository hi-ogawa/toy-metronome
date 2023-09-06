import {
  type TinyRpcProxy,
  messagePortClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { once } from "@hiogawa/utils";
import AUDIOWORKLET_URL from "./build/index.js?url";
import { METRONOME_PROCESSOR_NAME } from "./common";
import type { MetronomeProcessor } from "./metronome";

// singleton
export let metronomeNode: AudioWorkletNode;
export let metronomeRpcProxy: TinyRpcProxy<MetronomeProcessor>;

export const initMetronomeNode = once(async (audioContext: AudioContext) => {
  await audioContext.audioWorklet.addModule(AUDIOWORKLET_URL);
  metronomeNode = new AudioWorkletNode(audioContext, METRONOME_PROCESSOR_NAME);
  metronomeNode.connect(audioContext.destination);
  metronomeRpcProxy = proxyTinyRpc({
    adapter: messagePortClientAdapter({
      port: metronomeNode.port,
    }),
  });
  metronomeNode.port.start();
});
