import { z } from "zod";

export const METRONOME_PROCESSOR_NAME = "metronome";

export const CUSTOM_MESSAGE_SCHEMA = z.object({
  type: z.enum(["reset"]),
});

export type CustomMessageSchema = z.infer<typeof CUSTOM_MESSAGE_SCHEMA>;
