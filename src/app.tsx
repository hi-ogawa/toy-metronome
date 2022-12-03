import { mapValues } from "lodash";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useAsync } from "react-use";
import AUDIOWORKLET_URL from "./audioworklet/build/index.js?url";
import { useAnimationFrameLoop } from "./utils/use-animation-frame-loop";
import { useStableRef } from "./utils/use-stable-ref";

// TODO
// - AudioContext on/off is too slow
//   - `resume` as early as possible and control master volume to simulate on/off
//   - this would also help avoid glitch clicks
// - tempo deduction from tap
// - UI patterns
//   - nob
//   - slider
// - AudioWorkletProcessor
//   - how to pass "transpose" signal (position, bar, etc...)
//   - wasm implementation
// - hmr-friendly audio context initialization?
// - deploy
//   - test on mobile

export function App() {
  const [audio] = React.useState(() => {
    const audioContext = new AudioContext();
    const masterGainNode = new GainNode(audioContext, { gain: 0 });
    masterGainNode.connect(audioContext.destination);
    return { audioContext, masterGainNode };
  });

  const metronomeNode = useMetronomeNode({
    audioContext: audio.audioContext,
    onSuccess: (metronomeNode) => {
      metronomeNode.connect(audio.masterGainNode);
    },
  });

  const form = useForm({
    defaultValues: {
      audioState: audio.audioContext.state,
    },
  });
  const { audioState } = form.watch();

  // synchronize audioState
  useAnimationFrameLoop(() => {
    if (audioState !== audio.audioContext.state) {
      form.setValue("audioState", audio.audioContext.state);
    }
  });

  // keyboard shortcut
  useDocumentEvent("keyup", (e) => {
    if (e.key === " ") {
      togglePlay();
    }
  });

  //
  // handlers
  //

  async function togglePlay() {
    if (audioState === "suspended") {
      await audio.audioContext.resume();
      audio.masterGainNode.gain.linearRampToValueAtTime(
        1,
        audio.audioContext.currentTime + 0.1
      );
      metronomeNode.value?.connect(audio.masterGainNode);
    } else {
      audio.audioContext.suspend();
    }
  }

  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="w-xl flex flex-col items-center gap-4">
        <button
          className="border bg-gray-200 w-sm px-1 py-0.5 uppercase"
          disabled={audioState === "closed" || !metronomeNode.value}
          onClick={() => togglePlay()}
        >
          {audioState === "suspended" ? "start" : "stop"}
        </button>
        {metronomeNode.value && (
          <MetronomdeNodeComponent node={metronomeNode.value} />
        )}
      </div>
    </div>
  );
}

function MetronomdeNodeComponent({ node }: { node: AudioWorkletNode }) {
  const params = normalizeAudioParamMap(node.parameters);
  const form = useForm<Record<string, number>>({
    // 0.1 will appear as 0.10000000149011612 (probably due to single-to-double precision conversion)
    defaultValues: mapValues(params, (v) =>
      Number(v.defaultValue.toPrecision(5))
    ),
  });

  return (
    <>
      {renderField({ name: "bpm", label: "BPM", step: 1 })}
      {renderField({ name: "gain", label: "Volume", step: 0.01 })}
      {renderField({ name: "frequency", label: "Frequency", step: 1 })}
    </>
  );

  function renderField({
    name,
    label,
    step,
  }: {
    name: string;
    label: string;
    step: number;
  }) {
    const param = params[name];
    return (
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <div className="w-sm flex flex-col gap-1">
            <span className="flex gap-1">
              <span>{label} = </span>
              <input
                className="border text-center mono w-[80px]"
                type="number"
                min={param.minValue}
                max={param.maxValue}
                step={step}
                value={field.value}
                onChange={(e) => {
                  const newValue = e.target.valueAsNumber;
                  param.value = newValue;
                  field.onChange(newValue);
                }}
              />
            </span>
            <input
              className="w-full"
              type="range"
              min={param.minValue}
              max={param.maxValue}
              step={step}
              value={field.value}
              onChange={(e) => {
                const newValue = e.target.valueAsNumber;
                param.value = newValue;
                field.onChange(newValue);
              }}
            />
          </div>
        )}
      />
    );
  }
}

//
// utils
//

function useMetronomeNode({
  audioContext,
  onSuccess,
}: {
  audioContext: AudioContext;
  onSuccess: (node: AudioWorkletNode) => void;
}) {
  const onSuccessRef = useStableRef(onSuccess);

  return useAsync(async () => {
    await audioContext.audioWorklet.addModule(AUDIOWORKLET_URL);
    const node = new AudioWorkletNode(audioContext, "metronome");
    onSuccessRef.current(node);
    return node;
  });
}

// convert to normal key/value objects since AudioParamMap is too clumsy to work with
function normalizeAudioParamMap(
  audioParamMap: AudioParamMap
): Record<string, AudioParam> {
  const record: Record<string, AudioParam> = {};
  audioParamMap.forEach((v, k) => {
    record[k] = v;
  });
  return record;
}

function useDocumentEvent<K extends keyof DocumentEventMap>(
  type: K,
  handler: (e: DocumentEventMap[K]) => void
) {
  const handlerRef = useStableRef(handler);

  React.useEffect(() => {
    const handler = (e: DocumentEventMap[K]) => {
      handlerRef.current(e);
    };
    document.addEventListener(type, handler);
    return () => {
      document.removeEventListener(type, handler);
    };
  });
}
