import { METRONOME_PROCESSOR_NAME } from "./common";
import { MetronomeProcessor } from "./metronome";

import { repro } from "./repro";

function reproOk() {
  import("./repro")
}

// this triggers injection of `__vite__injectQuery`
function reproNotOk() {
  import("./repro".slice())
}

registerProcessor(METRONOME_PROCESSOR_NAME, MetronomeProcessor);
