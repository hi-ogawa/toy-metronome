import { Transition } from "@headlessui/react";
import { mapValues } from "lodash";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAsync } from "react-use";
import AUDIOWORKLET_URL from "./audioworklet/build/index.js?url";
import { useAnimationFrameLoop } from "./utils/use-animation-frame-loop";
import { useStableRef } from "./utils/use-stable-ref";

// TODO
// - tempo deduction from tap
// - UI patterns
//   - nob
//   - slider
// - AudioWorkletProcessor
//   - how to pass "transpose" signal (position, bar, etc...)
//   - wasm implementation
// - hmr-friendly audio context initialization?

export function App() {
  return (
    <>
      <Toaster />
      <AppInner />
    </>
  );
}

const WEB_AUDIO_WARNING = "WEB_AUDIO_WARNING";

function AppInner() {
  //
  // initialize AudioContext and AudioNode
  //
  const [audio] = React.useState(() => {
    const audioContext = new AudioContext();
    // since AudioContext.resume/suspend is clicky, we control master gain for on/off
    const masterGainNode = new GainNode(audioContext, { gain: 0 });
    masterGainNode.connect(audioContext.destination);
    return { audioContext, masterGainNode };
  });

  const metronomeNode = useMetronomeNode({
    audioContext: audio.audioContext,
    onSuccess: (metronomeNode) => {
      metronomeNode.connect(audio.masterGainNode);
    },
    onError: () => {
      toast.error("failed to load metronome");
    },
  });

  //
  // synchronize AudioContext.state with UI
  //
  const [audioState, setAudioState] = React.useState(
    () => audio.audioContext.state
  );

  useAnimationFrameLoop(() => {
    if (audioState !== audio.audioContext.state) {
      setAudioState(audio.audioContext.state);
    }
    if (audio.audioContext.state === "running") {
      toast.dismiss(WEB_AUDIO_WARNING);
    }
  });

  // suggest enabling AudioContext when autoplay is not allowed
  React.useEffect(() => {
    if (audio.audioContext.state !== "running") {
      toast(
        "Web Audio is disabled before user interaction.\nPlease start it either by hitting a space key or toggling a top-right icon.",
        { icon: "⚠️", duration: Infinity, id: WEB_AUDIO_WARNING }
      );
    }
  }, []);

  //
  // metronome state
  //
  const [isOn, setIsOn] = React.useState(false);

  async function toggle() {
    audio.masterGainNode.gain.linearRampToValueAtTime(
      isOn ? 0 : 1,
      audio.audioContext.currentTime + 0.1
    );
    setIsOn(!isOn);
  }

  // keyboard shortcut
  useDocumentEvent("keyup", (e) => {
    if (e.key === " ") {
      e.stopPropagation();
      e.preventDefault();
      if (audioState === "suspended") {
        audio.audioContext.resume();
        return;
      }
      toggle();
    }
  });

  return (
    <div className="h-full w-full flex justify-center items-center relative">
      <div className="absolute right-2 top-2">
        <button
          onClick={() => {
            if (audioState === "suspended") {
              audio.audioContext.resume();
            } else if (audioState === "running") {
              audio.audioContext.suspend();
            }
          }}
        >
          {audioState === "suspended" && (
            <span className="i-ri-volume-mute-line w-6 h-6"></span>
          )}
          {audioState === "running" && (
            <span className="i-ri-volume-up-line w-6 h-6"></span>
          )}
        </button>
      </div>
      {metronomeNode.value && (
        <div className="w-full max-w-sm flex flex-col items-center gap-5 px-4">
          <MetronomdeNodeComponent node={metronomeNode.value} />
          <button
            className="btn btn-primary w-full flex justify-center items-center py-0.5"
            disabled={audioState !== "running"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggle();
            }}
          >
            {isOn ? (
              <span className="i-ri-pause-line w-6 h-6"></span>
            ) : (
              <span className="i-ri-play-line w-6 h-6"></span>
            )}
          </button>
        </div>
      )}
      <Transition
        className="absolute inset-0 flex justify-center items-center transition duration-1000 bg-white"
        show={metronomeNode.loading}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <span className="spinner w-10 h-10 !border-4" />
      </Transition>
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
          <div className="w-full flex flex-col gap-2">
            <span className="flex gap-2">
              <span>{label}</span>
              <span>=</span>
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
  onError,
}: {
  audioContext: AudioContext;
  onSuccess: (node: AudioWorkletNode) => void;
  onError: (e: unknown) => void;
}) {
  const onSuccessRef = useStableRef(onSuccess);
  const onErrorRef = useStableRef(onError);

  return useAsync(async () => {
    try {
      await audioContext.audioWorklet.addModule(AUDIOWORKLET_URL);
      const node = new AudioWorkletNode(audioContext, "metronome");
      onSuccessRef.current(node);
      return node;
    } catch (e) {
      onErrorRef.current(e);
      throw e;
    }
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
