# toy-metronome

Experimenting with Web Audio API `AudioWorklet`.

```sh
# development
pnpm i
pnpm dev

# release
vercel projects add metronome-hiro18181
vercel link -p metronome-hiro18181
pnpm build
pnpm release:production
```

![image](https://user-images.githubusercontent.com/4232207/206905102-c76a6635-d546-4c20-97e2-6ae5dd59da31.png)

## references

- https://webaudio.github.io/web-audio-api
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- https://github.com/mdn/webaudio-examples
- https://gitlab.com/lv2/lv2/-/blob/8726bffa337e6374b04d0739df2812798b2c8858/plugins/eg-metro.lv2/metro.c
- https://gitlab.com/hiogawa/some-looper/-/blob/7af9a7721f78e15c54f5a1436df58d59a82f2cd1/some_looper_metro.cc
