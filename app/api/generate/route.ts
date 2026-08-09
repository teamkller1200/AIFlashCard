import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
	FlashCardResponseSchema,
	MAX_INPUT_LENGTH,
	DEFAULT_CARD_COUNT,
} from "@/lib/schemas";
import NextNodeServer from "next/dist/server/next-server";

export const runtime = "nodejs";

//OpenAIクライアントの初期化
const client = new OpenAI();

//受け取るリクエストの形式をZodで定義
const GenerateRequestSchema = z.object({
	text: z.string().min(1).max(MAX_INPUT_LENGTH),
});

//OpenAI APIエラー処理
function handleOpenAIError(error: unknown): NextResponse {
	if (error instanceof OpenAI.APIError) {
		const status = error.status;
		let message = "OpenAI APIでエラーが発生しました";

		if (status === 401) {
			message = "APIキーが無効です";
		} else if (status === 429) {
			message = "リクエストが多すぎます";
		} else if (status === 400) {
			message = "リクエスト内容が正しくありません";
		} else if (status && status >= 500) {
			message = "OpenAI側で障害が発生しています";
		}

		return NextResponse.json({ error: message }, { status: status ?? 500 });
	}

	if (error instanceof OpenAI.APIConnectionTimeoutError) {
		return NextResponse.json(
			{ error: "タイムアウト" },
			{ status: 504 }
		);
	}

	return NextResponse.json(
		{ error: "サーバーエラー" },
		{ status: 500 }
	);
}

export async function POST(req: Request) {
	//リクエストボディをjsonにパース
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json(
			{ error: "リクエストボディが不正です" },
			{ status: 400 }
		);
	}
	//リクエストをZodで検証
	const parsed = GenerateRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "入力テキストは１～${MAX_INPUT_LENGTH}文字で入力してください" },
			{ status: 400 }
		);
	}

	try {
		//OpenAi APIへリクエスト
		const completion = await client.chat.completions.parse({
			model: process.env.OPENAI_MODEL ?? "gpt-4o",
			messages: [
				{
					role: "system",
					content: [
						`あなたは学習用のフラッシュカードを作成するアシスタントです。`,
						`ユーザーが入力した学習資料から、一問一答形式のカードを${DEFAULT_CARD_COUNT}件生成してください。`,
						`質問は学習内容の要点を確認できるものにし、回答は簡潔かつ正確にしてください。`,
						`出力は必ず定義されたJSONスキーマに従ってください。`,
					].join("\n"),
				},
				{ role: "user", content: parsed.data.text },
			],
			response_format: zodResponseFormat(
				FlashCardResponseSchema,
				"flash_cards"
			),
		});

		const generated = completion.choices[0]?.message?.parsed;

		//レスポンスの検証
		if(!generated) {
			return NextResponse.json(
				{ error: "カードを生成できませんでした" },
				{ status:500 }
			);
		}

		const validated = FlashCardResponseSchema.safeParse(generated);
		if(!validated.success) {
			return NextResponse.json(
				{ error: "生成されたデータが不正でした" },
				{ status: 502 }
			);
		}

		return NextResponse.json(validated.data);
	} catch (error) {
		return handleOpenAIError(error);
	}
}