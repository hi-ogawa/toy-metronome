/**
 * @param data
 * @param f sample rate
 * https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
 */
export function encodeWav(data: Int16Array, f: number) {
  const nc = 1; // mono
  const ns = data.length;
  const m = data.byteLength / data.length;
  const pad = (m * nc * ns) & 1;
  return joinBuffers([
    text("RIFF"),
    u32(4 + 24 + 8 + nc * ns * m + pad),
    text("WAVE"),
    text("fmt "),
    u32(16),
    u16(1), // WAVE_FORMAT_PCM
    u16(nc),
    u32(f),
    u32(f * m * nc), // bytes per sec
    u16(m * nc), // block alignment
    u16(8 * m), // bits per sample
    text("data"),
    u32(m * nc * ns),
    data.buffer,
    text(pad ? "\x00" : ""),
  ]);

  function u32(n: number) {
    return new Uint32Array([n]).buffer;
  }

  function u16(n: number) {
    return new Uint16Array([n]).buffer;
  }

  function text(s: string) {
    return new TextEncoder().encode(s).buffer;
  }

  function joinBuffers(buffers: ArrayBufferLike[]) {
    let total = 0;
    for (const buffer of buffers) {
      total += buffer.byteLength;
    }

    let result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    return result;
  }
}

export function castF32ToS16(buffer: Float32Array) {
  const buffer_s16 = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    buffer_s16[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(buffer[i] * 32767))
    );
  }
  return buffer_s16;
}
