export interface CreateAttemptBody {
	quizId: number;
	userId?: number;
}

export interface Attempt {
	id: number;
	userId: number;
	assignmentId: number;
	status: string;
	startedAt: string;
}

export type AttemptRow = {
	id: number;
	user_id: number;
	assignment_id: number;
	status: "in_progress" | "submitted";
	started_at: string;
};

export type CreatedAttemptRow = {
	id: number;
	user_id: number;
	assignment_id: number;
	status: "in_progress" | "submitted";
	started_at: string;
};

export type QuestionRow = {
	id: number;
	prompt: string;
	choices: string;
	points: number;
	order_index: number;
	type: string;
};

export type CreateAnswerBody = {
	questionId: number;
	answer: { choiceIndex: number };
};
