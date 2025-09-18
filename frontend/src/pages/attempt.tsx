import { normalizeError } from "@/lib/error";
import {
	answerAttemptApiUrl,
	nextAttemptApiUrl,
	submitAttemptApiUrl,
} from "@/paths";
import type { PostAnswerResp, Question } from "@/types/attempt";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function AttemptPage() {
	const { id: attemptId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState<Question | null>(null);
	const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<{
		correct: boolean;
		text?: string;
	} | null>(null);

	const questionNumber = useMemo(() => (q ? q.orderIndex + 1 : undefined), [q]);

	const loadNext = useCallback(async () => {
		if (!attemptId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(nextAttemptApiUrl({ id: attemptId }));
			if (res.status === 204) {
				await fetch(submitAttemptApiUrl({ id: attemptId }), {
					method: "POST",
				});
				navigate(`/summary/${attemptId}`);
				return;
			}
			if (!res.ok) throw new Error(`Failed to load next (${res.status})`);
			const data = (await res.json()) as { question: Question };
			setQ(data.question);
			setChoiceIndex(null);
			setFeedback(null);
		} catch (e: unknown) {
			setError(normalizeError(e).message);
		} finally {
			setLoading(false);
		}
	}, [attemptId, navigate]);

	useEffect(() => {
		loadNext();
	}, [loadNext]);

	const onNext = async () => {
		if (!attemptId || !q || choiceIndex == null) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await fetch(answerAttemptApiUrl({ id: attemptId }), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ questionId: q.id, answer: { choiceIndex } }),
			});

			if (!res.ok) {
				const msg = await res.text().catch(() => "");
				throw new Error(`Failed to save/grade: ${res.status} ${msg}`);
			}
			const data = (await res.json()) as PostAnswerResp;
			setFeedback({
				correct: data.correct,
				text: data.explanation ?? undefined,
			});
			// brief pause so the student sees feedback
			setTimeout(loadNext, 800);
		} catch (e: unknown) {
			setError(normalizeError(e).message);
		} finally {
			setSubmitting(false);
		}
	};

	if (!attemptId) {
		return <div className="p-6 text-red-600">Missing attempt id.</div>;
	}

	if (error) {
		return (
			<div className="max-w-xl mx-auto p-6">
				<div className="text-red-600 font-semibold mb-2">
					An error has occurred
				</div>
				<pre className="text-sm text-red-800 bg-red-50 p-3 rounded">
					{error}
				</pre>
				<button
					type="button"
					className="mt-3 px-4 py-2 rounded border hover:bg-gray-50"
					onClick={loadNext}
				>
					Retry
				</button>
			</div>
		);
	}

	if (loading || !q) {
		return (
			<div className="text-center p-8 text-muted-foreground">Loading…</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			{/* Header */}
			<div className="mb-4 flex items-baseline justify-between">
				<div className="text-sm text-muted-foreground">
					Question {questionNumber} • {q.points} pt{q.points !== 1 ? "s" : ""}
				</div>
				<button
					type="button"
					className="text-sm text-blue-700 hover:underline"
					onClick={() => navigate("/")}
				>
					Exit
				</button>
			</div>

			{/* Prompt */}
			<h1 className="text-xl font-semibold mb-4">{q.prompt}</h1>

			{/* Choices */}
			<div className="space-y-2">
				{q.choices?.map((c, idx) => (
					<label
						key={`${q.id}-${idx}`}
						className={`block cursor-pointer rounded border p-3 ${
							choiceIndex === idx
								? "border-blue-500 ring-1 ring-blue-300"
								: "border-gray-200"
						}`}
					>
						<input
							type="radio"
							name="choice"
							className="mr-2"
							checked={choiceIndex === idx}
							onChange={() => setChoiceIndex(idx)}
						/>
						{c}
					</label>
				))}
			</div>

			{/* Feedback */}
			{feedback && (
				<div
					className={`mt-4 rounded p-3 text-sm ${
						feedback.correct
							? "bg-green-50 text-green-700"
							: "bg-rose-50 text-rose-700"
					}`}
				>
					{feedback.correct ? "✅ Correct" : "❌ Incorrect"}
					{feedback.text ? (
						<span className="ml-1">– {feedback.text}</span>
					) : null}
				</div>
			)}

			{/* Actions */}
			<div className="mt-6">
				<button
					type="button"
					className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
					disabled={choiceIndex == null || submitting}
					onClick={onNext}
				>
					{submitting ? "Checking…" : "Next"}
				</button>
			</div>
		</div>
	);
}
