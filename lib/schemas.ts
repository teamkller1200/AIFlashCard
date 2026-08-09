import { z }  from "zod";

//フラッシュカードのデータ構造
export const FlashCardSchema = z.object({
	id: z.number(),
	question: z.string(),
	answer: z.string(),
});

// APIから返ってくるレスポンス全体のデータ構造（カードの配列）
export const FlashCardResponseSchema = z.object({
	cards: z.array(FlashCardSchema),
});

// TypeScriptの型として使用できるようにエクスポート
export type FlashCard = z.infer<typeof FlashCardSchema>;
export type FlashCardRespone = z.infer<typeof FlashCardResponseSchema>;

//定数
export const MAX_INPUT_LENGTH = 4000;
export const DEFAULT_CARD_COUNT = 3;