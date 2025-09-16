import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

type AnswerSummary = {
	questionId: number;
	prompt: string;
	correct: boolean;
	correctAnswer?: string;
	givenAnswer?: string;
	pointsAwarded: number;
};

type AttemptSummary = {
	attemptId: number;
	score: number;
	possible: number;
	totalTimeMs: number;
	answers: AnswerSummary[];
};

export function SummaryPage() {
	const { id: attemptId } = useParams<{ id: string }>();

	const [summary, setSummary] = useState<AttemptSummary | null>(null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!attemptId) return;
		fetch(`http://localhost:3001/attempts/${attemptId}/summary`)
			.then((res) => {
				if (!res.ok) throw new Error(`Failed with status ${res.status}`);
				return res.json();
			})
			.then(setSummary)
			.catch(setError);
	}, [attemptId]);

	if (error) return <div>An error has occurred: {error.message}</div>;
	if (!summary) return <div className="text-center p-8">Loading...</div>;

	const minutes = Math.floor(summary.totalTimeMs / 60000);
	const seconds = Math.floor((summary.totalTimeMs % 60000) / 1000);

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Quiz Summary</h1>

			<div className="mb-4">
				<p className="text-lg">
					Score:{" "}
					<span className="font-semibold">
						{summary.score} / {summary.possible}
					</span>
				</p>
				<p className="text-lg">
					Time:{" "}
					<span className="font-semibold">
						{minutes}:{seconds.toString().padStart(2, "0")}
					</span>
				</p>
			</div>

			<h2 className="text-xl font-semibold mb-2">Questions</h2>
			<ul className="space-y-3">
				{summary.answers.map((a) => (
					<li
						key={a.questionId}
						className={`p-3 rounded border ${
							a.correct
								? "bg-green-50 border-green-200"
								: "bg-red-50 border-red-200"
						}`}
					>
						<div className="font-medium">{a.prompt}</div>
						<div>
							{a.correct ? (
								<span className="text-green-700">✅ Correct</span>
							) : (
								<span className="text-red-700">
									❌ Incorrect (Your answer: {a.givenAnswer}, Correct:{" "}
									{a.correctAnswer})
								</span>
							)}
						</div>
					</li>
				))}
			</ul>

			<div className="mt-6">
				<Link
					to="/"
					className="px-4 py-2 rounded border hover:bg-gray-50 text-blue-700 font-medium"
				>
					Back to Home
				</Link>
			</div>
		</div>
	);
}
