import { Transition } from "@headlessui/react";
import { useLocalStorage } from "@rehooks/local-storage";
import { identity, mapValues, range, sum } from "lodash";
import React from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAsync } from "react-use";
import AUDIOWORKLET_URL from "./audioworklet/build/index.js?url";
import type { CustomMessageSchema } from "./audioworklet/common";
import { decibelToGain, gainToDecibel } from "./utils/conversion";
import { tinyassert } from "./utils/tinyassert";
import { useAnimationFrameLoop } from "./utils/use-animation-frame-loop";
import { useStableRef } from "./utils/use-stable-ref";
import { useThemeState } from "./utils/use-theme-state";

export function App() {
  return (
    <>
      <Toaster
        toastOptions={{
          className: "!bg-[var(--colorBgElevated)] !text-[var(--colorText)]",
        }}
      />
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
        "Web Audio is disabled before user interaction.\nPlease start it either by pressing a left icon or hitting a space key.",
        {
          icon: (
            <button
              className="btn btn-ghost flex items-center"
              onClick={() => audio.audioContext.resume()}
            >
              <span className="i-ri-volume-up-line w-6 h-6"></span>
            </button>
          ),
          duration: Infinity,
          id: WEB_AUDIO_WARNING,
        }
      );
    }
  }, []);

  //
  // metronome state
  //
  const [isOn, setIsOn] = React.useState(false);

  async function toggle() {
    if (isOn) {
      audio.masterGainNode.gain.linearRampToValueAtTime(
        0,
        audio.audioContext.currentTime + 0.1
      );
    } else {
      metronomeNode.value?.port.postMessage({
        type: "reset",
      } satisfies CustomMessageSchema);
      audio.masterGainNode.gain.value = 1;
    }
    setIsOn(!isOn);
  }

  // keyboard shortcut
  useDocumentEvent("keyup", (e) => {
    if (e.key === " ") {
      // prevent space key to trigger button click
      e.preventDefault();
      e.stopPropagation();
      if (audioState === "suspended") {
        audio.audioContext.resume();
        return;
      }
      toggle();
    }
  });

  return (
    <div className="h-full w-full flex justify-center items-center relative">
      <div className="absolute right-3 top-3 flex gap-3">
        <button
          className="btn btn-ghost flex items-center"
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
        <ThemeButton />
        <a
          className="flex items-center btn btn-ghost"
          href="https://github.com/hi-ogawa/toy-metronome"
          target="_blank"
        >
          <span className="i-ri-github-line w-6 h-6"></span>
        </a>
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
        className="absolute inset-0 flex justify-center items-center transition duration-1000 bg-[var(--colorBgElevated)]"
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

const STORAGE_PREFIX = "metronome-audiot-param";

function MetronomdeNodeComponent({ node }: { node: AudioWorkletNode }) {
  const params = React.useMemo(
    () => normalizeAudioParamMap(node.parameters),
    []
  );

  const storages = mapValues(params, (v, k) =>
    useLocalStorage<number>(`${STORAGE_PREFIX}-${k}`, v.defaultValue)
  );

  React.useEffect(() => {
    for (const [k, [v]] of Object.entries(storages)) {
      params[k].value = v;
    }
  }, []);

  const form = useForm<Record<string, number>>({
    // 0.1 will appear as 0.10000000149011612 (probably due to single-to-double precision conversion)
    defaultValues: mapValues(storages, ([storageValue]) =>
      Number(storageValue.toPrecision(5))
    ),
  });
  const formValues = form.watch();

  function onChange(name: string, value: number) {
    const param = params[name];
    const [, setStorage] = storages[name];
    if (Number.isFinite(value)) {
      param.value = value;
      form.setValue(name, value);
      setStorage(value);
    }
  }

  useDocumentEvent("keyup", (e) => {
    if (document.activeElement instanceof HTMLInputElement) {
      return;
    }

    const bpm = Math.floor(formValues["bpm"] / 10) * 10;
    if (e.key === "j") {
      e.preventDefault();
      e.stopPropagation();
      onChange("bpm", bpm - 10);
    }
    if (e.key === "l") {
      e.preventDefault();
      e.stopPropagation();
      onChange("bpm", bpm + 10);
    }

    const db = Math.round(gainToDecibel(formValues["gain"]));
    if (e.key === "J") {
      e.preventDefault();
      e.stopPropagation();
      onChange("gain", decibelToGain(db - 1));
    }
    if (e.key === "L") {
      e.preventDefault();
      e.stopPropagation();
      onChange("gain", decibelToGain(db + 1));
    }
  });

  return (
    <>
      {renderField({ name: "bpm", label: "BPM", step: 1 })}
      {renderField({
        name: "gain",
        label: "Volume (dB)",
        step: 0.1,
        toFormat: gainToDecibel,
        fromFormat: decibelToGain,
      })}
      {renderField({ name: "frequency", label: "Frequency", step: 1 })}
    </>
  );

  //
  // render utils
  //

  function renderField({
    name,
    label,
    step,
    toFormat = identity,
    fromFormat = identity,
  }: {
    name: string;
    label: string;
    step: number;
    toFormat?: (value: number) => number;
    fromFormat?: (value: number) => number;
  }) {
    const param = params[name];
    const value = formValues[name];

    const [temporary, setTemporary] = React.useState(
      toFormat(value).toFixed(1)
    );
    React.useEffect(() => {
      setTemporary(toFormat(value).toFixed(1));
    }, [value]);

    return (
      <div className="w-full flex flex-col gap-2">
        <span className="flex gap-2 items-center">
          <span>{label}</span>
          <span>=</span>
          <input
            className="border text-center mono w-[80px]"
            value={temporary}
            onChange={(e) => setTemporary(e.target.value)}
            onBlur={() => setTemporary(toFormat(value).toFixed(1))}
            onKeyUp={(e) => {
              tinyassert(e.target instanceof HTMLInputElement);
              if (e.key === "Enter") {
                onChange(name, fromFormat(Number(temporary)));
              }
            }}
          />
          <span className="flex-1"></span>
          {name === "bpm" && (
            <BpmDetectionButton
              onChange={(value) => onChange(name, fromFormat(value))}
            />
          )}
        </span>
        <input
          className="w-full"
          type="range"
          min={toFormat(param.minValue)}
          max={toFormat(param.maxValue)}
          step={step}
          value={toFormat(value)}
          onChange={(e) => onChange(name, fromFormat(e.target.valueAsNumber))}
        />
      </div>
    );
  }
}

function BpmDetectionButton({
  onChange,
}: {
  onChange: (value: number) => void;
}) {
  const [times, setTimes] = React.useState<number[]>([]);

  function onClick() {
    const now = Date.now();
    const newTimes = [...times, now].filter((t) => now - t < 20000).slice(-12);
    const bpm = deriveBpm(newTimes);
    if (bpm) {
      onChange(bpm);
    }
    setTimes(newTimes);
  }

  return (
    <button
      title="Tap it to derive BPM"
      className="btn btn-ghost flex items-center"
      onClick={() => onClick()}
    >
      <span className="i-ri-fingerprint-line w-4 h-4"></span>
    </button>
  );
}

function deriveBpm(times: number[]): number | undefined {
  if (times.length <= 4) return;
  const avg_msec =
    sum(range(times.length - 1).map((i) => times[i + 1] - times[i])) /
    (times.length - 1);
  const inv_hz = avg_msec / 1000 / 60;
  return Math.floor(1 / inv_hz);
}

function ThemeButton() {
  const [theme, setTheme] = useThemeState();
  return (
    <button
      className="flex items-center btn btn-ghost"
      disabled={!theme}
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      <span
        className={cls(
          theme === "dark" ? "i-ri-sun-line" : "i-ri-moon-line",
          "w-6 h-6"
        )}
      ></span>
    </button>
  );
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

function cls(...values: unknown[]): string {
  return values.filter(Boolean).join(" ");
}
