import type { Quiz } from "@/components/quiz";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { normalizeError } from "@/lib/error";
import { attemptsApiUrl, quizApiUrl, rootPath } from "@/paths";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export function QuizPage() {
	const { id } = useParams();
	if (!id) throw new Error("Quiz id param is required");

	const quizId = Number(id);

	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [starting, setStarting] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		fetch(quizApiUrl({ id }))
			.then((res) => res.json())
			.then(setQuiz)
			.catch(setError);
	}, [id]);

	async function onContinue() {
		try {
			setStarting(true);
			const res = await fetch(attemptsApiUrl({}), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quizId, userId: 1 }), // MVP: hardcode userId
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(`Failed to start: ${res.status} ${msg}`);
			}
			const data = (await res.json()) as { attempt: { id: number } };
			navigate(`/attempt/${data.attempt.id}`);
		} catch (e: unknown) {
			normalizeError(e);
		} finally {
			setStarting(false);
		}
	}

	if (error)
		return (
			<div className="text-red-500 p-4">
				<p className="font-bold mb-1">An error has occurred:</p>
				<p>{error.message}</p>
			</div>
		);

	if (!quiz) return <div className="text-center p-8">Loading...</div>;

	return (
		<Card className="w-[600px] mx-auto">
			<CardHeader className="pb-8">
				<CardTitle>{quiz.title}</CardTitle>
				<CardDescription>{quiz.description}</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="space-y-4">
					<button
						type="button"
						onClick={onContinue}
						disabled={starting}
						className="rounded-lg px-4 py-2 border hover:bg-muted disabled:opacity-60"
					>
						Continue
					</button>
				</div>
			</CardContent>

			<CardFooter className="flex justify-between pt-8">
				<Link
					to={rootPath.pattern}
					className="text-muted-foreground hover:text-blue-600"
				>
					Back to home page
				</Link>
			</CardFooter>
		</Card>
	);
}
