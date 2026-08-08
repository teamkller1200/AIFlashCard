import { z } from "zod";

export const FlashCardSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
});

export const FlashCardResponseSchema = z.object({
  cards: z.array(FlashCardSchema),
});

export type FlashCard = z.infer<typeof FlashCardSchema>;
export type FlashCardResponse = z.infer<typeof FlashCardResponseSchema>;
