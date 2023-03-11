import { z } from "zod";

export const METRONOME_PROCESSOR_NAME = "metronome";

export const CUSTOM_MESSAGE_SCHEMA = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setState"),
    data: z.object({ playing: z.boolean() }),
  }),
  // unused
  z.object({ type: z.literal("reset") }),
]);

export type CustomMessageSchema = z.infer<typeof CUSTOM_MESSAGE_SCHEMA>;
