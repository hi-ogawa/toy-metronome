export let audioContext: AudioContext;

// maybe should delay so that the browser might allow autoplay (i.e. start unpaused)?
export function initAudioContext() {
  audioContext = new AudioContext();
}
