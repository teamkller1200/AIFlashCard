import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FlashCardResponseSchema, MAX_INPUT_LENGTH, DEFAULT_CARD_COUNT, MIN_CARD_COUNT, MAX_CARD_COUNT } from "@/lib/schemas";

export const runtime = "nodejs";

// Gemini クライアントの初期化
const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// 受け取るリクエストの形式を Zod で定義
const GenerateRequestSchema = z.object({
	text: z.string().min(1).max(MAX_INPUT_LENGTH),
	count: z
		.number()
		.int()
		.min(MIN_CARD_COUNT)
		.max(MAX_CARD_COUNT)
		.default(DEFAULT_CARD_COUNT),
});

// エラーハンドリング
function handleApiError(error: unknown): NextResponse {
	const message =
		error instanceof Error ? error.message : "サーバーエラーが発生しました";
	return NextResponse.json({ error: message }, { status: 500 });
}

// Gemini API の Structured Outputs に渡す JSON Schema（手動定義）
const flashCardResponseJsonSchema = {
	type: "object",
	properties: {
		cards: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "number" },
					question: { type: "string" },
					answer: { type: "string" },
				},
				required: ["id", "question", "answer"],
				propertyOrdering: ["id", "question", "answer"],
			},
		},
	},
	required: ["cards"],
	propertyOrdering: ["cards"],
};

export async function POST(req: Request) {
	// リクエストボディを JSON にパース
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json(
			{ error: "リクエストボディが不正です" },
			{ status: 400 }
		);
	}
	const parsed = GenerateRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: `入力テキストは１～${MAX_INPUT_LENGTH}文字で入力してください` },
			{ status: 400 }
		);
	}

	try {
		// Gemini API へリクエスト（Structured Outputs を使用）

		const response = await client.models.generateContent({
			model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
			contents: [
				{
					role: "user",
					parts: [
						{
							text: [
								"あなたは学習用のフラッシュカードを作成するアシスタントです。",
								`ユーザーが入力した学習資料から、一問一答形式のカードを${parsed.data.count}件生成してください。`,
								"質問は学習内容の要点を確認できるものにし、回答は簡潔かつ正確にしてください。",
								"出力は必ず定義されたJSONスキーマに従ってください。",
								"",
								"### 学習資料",
								parsed.data.text,
							].join("\n"),
						},
					],
				},
			],
			config: {
				responseMimeType: "application/json",
				responseJsonSchema: flashCardResponseJsonSchema,
			},
		});

		const raw = JSON.parse(response.text ?? "{}");

		// レスポンスの検証
		const validated = FlashCardResponseSchema.safeParse(raw);
		if (!validated.success) {
			return NextResponse.json(
				{ error: "生成されたデータが不正でした" },
				{ status: 502 }
			);
		}

		return NextResponse.json(validated.data);
	} catch (error) {
		return handleApiError(error);
	}
}