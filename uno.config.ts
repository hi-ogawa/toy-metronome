import { antdPreset } from "@hiogawa/unocss-preset-antd";
import {
  dummyPreset,
  dummyPresetIconsRules,
  filterColorPallete,
  transformerTypescriptDsl,
} from "@hiogawa/unocss-typescript-dsl";
import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

// based on https://github.com/hi-ogawa/youtube-dl-web-v2/blob/ca7c08ca6b144c235bdc4c7e307a0468052aa6fa/packages/app/uno.config.ts

export default defineConfig({
  presets: [
    antdPreset(),
    filterColorPallete(presetUno()),
    presetIcons({
      extraProperties: {
        display: "inline-block",
      },
    }),
    dummyPreset(),
  ],
  rules: [...dummyPresetIconsRules(["ri"])],
  transformers: [
    // @ts-ignore todo: peer-dep conflict?
    transformerTypescriptDsl(),
    transformerDirectives(),
    transformerVariantGroup(),
  ],
});
