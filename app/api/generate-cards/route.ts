import { NextResponse } from "next/server";
import OpenAI from "openai";
import { FlashCardResponseSchema } from "@/lib/schemas"; // スキーマ定義ファイルをインポート

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// カード生成APIのエンドポイント
export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // OpenAI APIへのリクエスト
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 要件定義書に基づき、最新モデルを指定
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant designed to output flashcards in JSON format.
          Please generate 3 flashcards (question and answer pairs) based on the provided text.
          The output MUST be a JSON object matching the following schema:
          ${JSON.stringify(FlashCardResponseSchema.schema())}`, // ZodスキーマをJSON形式で渡す
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" }, // Structured Outputsを有効化
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: "Failed to generate flashcards" },
        { status: 500 }
      );
    }

    // レスポンスをJSONとしてパース
    const generatedData = JSON.parse(responseContent);

    // Zodスキーマによるバリデーション
    const validatedData = FlashCardResponseSchema.parse(generatedData);

    return NextResponse.json(validatedData);

  } catch (error: any) {
    console.error("Error generating flashcards:", error);

    // Zodのバリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid response format from AI", details: error.errors },
        { status: 422 } // Unprocessable Entity
      );
    }

    // OpenAI APIのエラーやその他のエラー
    if (error.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
