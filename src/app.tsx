import { getTheme, setTheme } from "@hiogawa/theme-script";
import { useTinyStoreStorage } from "@hiogawa/tiny-store/dist/react";
import {
  objectEntries,
  objectMapValues,
  range,
  tinyassert,
} from "@hiogawa/utils";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { initMetronomeNode, metronomeRpc } from "./audioworklet/client";
import {
  METRONOME_PARAM_SPEC,
  type MetronomeParamKey,
} from "./audioworklet/common";
import { audioContext } from "./utils/audio-context";
import { decibelToGain, gainToDecibel } from "./utils/conversion";
import { useAsync } from "./utils/query";
import { useStableRef } from "./utils/use-stable-ref";

export function App() {
  return (
    <>
      <Toaster
        toastOptions={{
          className: "!bg-colorBgElevated !text-colorText",
        }}
      />
      <AppInner />
    </>
  );
}

function AppInner() {
  // initialize audio worklet node
  const initMetronomeQuery = useAsync({
    queryFn: () => initMetronomeNode(audioContext),
    onError(e) {
      console.error(e);
      toast.error("failed to load metronome");
    },
  });

  // sync metronome play state with UI
  const [playing, setPlaying] = React.useState(false);

  async function toggle() {
    if (initMetronomeQuery.status !== "success") return;

    // browser doesn't allow autoplay, so manually resume on first user gesture.
    // hopefully this won't make glitch sound.
    if (!playing && audioContext.state === "suspended") {
      await audioContext.resume();
    }
    metronomeRpc.setPlaying(!playing);
    setPlaying(!playing);
  }

  // keyboard shortcut
  useDocumentEvent("keyup", (e) => {
    if (e.key === " ") {
      // prevent space key from triggering button click
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  });

  return (
    <div className="h-full w-full flex justify-center items-center relative">
      <div className="absolute right-3 top-3 flex gap-3">
        {initMetronomeQuery.status === "loading" && (
          <span className="antd-spin w-6 h-6"></span>
        )}
        <ThemeButton />
        <a
          className="antd-btn antd-btn-ghost flex items-center"
          href="https://github.com/hi-ogawa/toy-metronome"
          target="_blank"
        >
          <span className="i-ri-github-line w-6 h-6"></span>
        </a>
      </div>
      {initMetronomeQuery.status === "success" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-5 px-4">
          <MetronomdeNodeComponent />
          <button
            className={cls(
              "antd-btn antd-btn-primary w-full flex justify-center items-center py-0.5",
              !playing && "brightness-75"
            )}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggle();
            }}
          >
            {playing ? (
              <span className="i-ri-pause-line w-6 h-6"></span>
            ) : (
              <span className="i-ri-play-line w-6 h-6"></span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}

const STORAGE_PREFIX = "metronome-audiot-param";

function MetronomdeNodeComponent() {
  // the data in the localstorage is the ground truth.
  // we sync it to audioworklet state.
  const storages = objectMapValues(METRONOME_PARAM_SPEC, (spec, k) =>
    useTinyStoreStorage(`${STORAGE_PREFIX}-${k}`, spec.defaultValue)
  );

  // effect inside loop since object keys are fixed
  for (const [k, [v]] of objectEntries(storages)) {
    React.useEffect(() => {
      metronomeRpc.setParam(k, v);
    }, [v]);
  }

  const formValues = objectMapValues(storages, ([storageValue]) =>
    Number(storageValue.toPrecision(5))
  );

  function onChange(name: MetronomeParamKey, value: number) {
    if (Number.isFinite(value)) {
      storages[name][1](value);
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
    toFormat = (v) => v,
    fromFormat = (v) => v,
  }: {
    name: MetronomeParamKey;
    label: string;
    step: number;
    toFormat?: (value: number) => number;
    fromFormat?: (value: number) => number;
  }) {
    const value = formValues[name];

    // okay-ish to run hook in render helper since no conditionals
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
            className="antd-input text-center w-[80px]"
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
          min={toFormat(METRONOME_PARAM_SPEC[name].minValue)}
          max={toFormat(METRONOME_PARAM_SPEC[name].maxValue)}
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
      className="antd-btn antd-btn-ghost flex items-center"
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
  return (
    <button
      className="antd-btn antd-btn-ghost flex items-center"
      onClick={() => setTheme(getTheme() === "dark" ? "light" : "dark")}
    >
      <span className="dark:i-ri-sun-line light:i-ri-moon-line !w-6 !h-6" />
    </button>
  );
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

function sum(ls: number[]): number {
  return ls.reduce((x, y) => x + y, 0);
}
