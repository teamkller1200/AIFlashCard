"use client";

import { useState } from "react";
import { MAX_INPUT_LENGTH, DEFAULT_CARD_COUNT, MIN_CARD_COUNT, MAX_CARD_COUNT } from "@/lib/schemas";
import type { FlashCard } from "@/lib/schemas";

export default function Home() {
	const [text, setText] = useState("");
	const [cards, setCards] = useState<FlashCard[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);

	const canSubmit =
		text.trim().length > 0 && text.length <= MAX_INPUT_LENGTH && !isLoading;

	const handleSubmit = async () => {
		if (!canSubmit) return;

		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, count: cardCount }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "カードの生成に失敗しました");
			}

			const data = await res.json();
			setCards(data.cards);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "予期しないエラーが発生しました"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
			<header className="text-center">
				<h1 className="text-3xl font-bold tracking-tight">
					AI フラッシュカード生成
				</h1>
				<p className="mt-2 text-zinc-500">
					学習資料を貼り付けると、フラッシュカードを自動生成します。
				</p>
			</header>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
				<label
					htmlFor="source"
					className="text-sm font-medium text-zinc-600"
				>
					学習資料を入力
				</label>
				<textarea
					id="source"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="学習したい内容をここに貼り付けてください"
					rows={7}
					maxLength={MAX_INPUT_LENGTH}
					disabled={isLoading}
					className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-relaxed text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-50 disabled:text-zinc-400"
				/>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-4">
						<span className="text-xs">
							{text.length} / {MAX_INPUT_LENGTH}
						</span>
						<label
							htmlFor="count"
							className="flex items-center gap-2 text-xs text-zinc-600"
						>
							生成枚数
							<select
								id="count"
								value={cardCount}
								onChange={(e) => setCardCount(Number(e.target.value))}
								disabled={isLoading}
								className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
							>
								{Array.from(
									{ length: MAX_CARD_COUNT - MIN_CARD_COUNT + 1 },
									(_, i) => MIN_CARD_COUNT + i
								).map((n) => (
									<option key={n} value={n}>
										{n}件
									</option>
								))}
							</select>
						</label>
					</div>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={handleSubmit}
						className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
					>
						{isLoading ? "生成中..." : "カード生成"}
					</button>
				</div>
			</section>

			{cards.length > 0 && (
				<section>
					<h2 className="mb-3 text-lg font-semibold">
						生成されたカード（{cards.length}件）
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{cards.map((card) => (
							<FlipCard key={card.id} card={card} />
						))}
					</div>
				</section>
			)}
		</main>
	);
}

function FlipCard({ card }: { card: FlashCard }) {
	const [flipped, setFlipped] = useState(false);

	return (
		<div
			className="[perspective:1200px]"
			onClick={() => setFlipped((f) => !f)}
		>
			<div
				className={`relative h-48 w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] ${
					flipped ? "[transform:rotateY(180deg)]" : ""
				}`}
			>
				<div className="absolute inset-0 flex flex-col rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm [backface-visibility:hidden]">
					<span className="text-xs font-medium uppercase tracking-wide text-indigo-500">
						Q{card.id}
					</span>
					<p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-zinc-800">
						{card.question}
					</p>
					<span className="text-xs text-zinc-400">タップして回答を表示</span>
				</div>

				<div className="absolute inset-0 flex flex-col rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
					<span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
						A{card.id}
					</span>
					<p className="mt-3 flex-1 text-sm leading-relaxed text-emerald-900">
						{card.answer}
					</p>
					<span className="text-xs text-emerald-500/70">タップして戻る</span>
				</div>
			</div>
		</div>
	);
}