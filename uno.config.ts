import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

// copied from https://github.com/hi-ogawa/youtube-dl-web-v2/blob/ca7c08ca6b144c235bdc4c7e307a0468052aa6fa/packages/app/uno.config.ts

export default defineConfig({
  theme: {
    colors: {
      primary: "#1890ff",
      primaryHover: "#40a9ff",
      primaryActive: "#096dd9",
      primaryContent: "white",
    },
  },
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
      },
    }),
  ],
  shortcuts: {
    spinner: `
      animate-spin
      rounded-full
      border-2 border-gray-500 border-t-gray-300 border-l-gray-300
    `,
    btn: `
      cursor-pointer
      transition
      disabled:(cursor-not-allowed opacity-50)
    `,
    "btn-ghost": `
      not-disabled:hover:(text-primary-hover)
      not-disabled:active:(text-primary-active)
    `,
    "btn-primary": `
      text-primary-content
      bg-primary
      not-disabled:hover:bg-primary-hover
      not-disabled:active:bg-primary-active
    `,
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
