# AI フラッシュカード生成

学習資料を貼り付けると、AI（Gemini API）が自動で一問一答形式のフラッシュカードを生成する Web アプリケーションです。

## 技術スタック

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Google Gen AI SDK (Gemini API)**
- **Zod**

## 始め方

```bash
npm install
npm run dev
```

### 環境変数

`.env.local` ファイルを作成し、以下の変数を設定してください：

```
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

API キーは [Google AI Studio](https://aistudio.google.com/) で取得できます。

## 機能

- テキスト入力からフラッシュカードを自動生成
- 生成枚数（1〜10件）を指定可能
- カードの表裏めくり表示
- レスポンシブデザイン