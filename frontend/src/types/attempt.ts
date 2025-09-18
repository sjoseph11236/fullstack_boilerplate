export type Question = {
	id: number;
	prompt: string;
	points: number;
	orderIndex: number; // 0-based
	type: "mcq";
	choices: string[];
};

export type PostAnswerResp = {
	correct: boolean;
	explanation?: string | null;
	points: number;
};

export type AnswerSummary = {
	questionId: number;
	prompt: string;
	correct: boolean;
	correctAnswer?: string;
	givenAnswer?: string;
	pointsAwarded: number;
};

export type AttemptSummary = {
	attemptId: number;
	score: number;
	possible: number;
	totalTimeMs: number;
	answers: AnswerSummary[];
};
