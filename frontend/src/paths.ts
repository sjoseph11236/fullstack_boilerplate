import { type Params, path as pathFactory } from "static-path";

const SERVER_HOST = import.meta.env.VITE_BACKEND_SERVER || "localhost:3001";
export const SERVER_ORIGIN = `http://${SERVER_HOST}`;

const apiUrlFactory = <T extends string>(pattern: T) => {
	const builder = pathFactory(pattern);
	return (params: Params<T>) => SERVER_ORIGIN + builder(params);
};

// api urls
export const quizApiUrl = apiUrlFactory("/quizzes/:id");
export const quizzesApiUrl = apiUrlFactory("/quizzes");
export const attemptsApiUrl = apiUrlFactory("/attempts");
export const nextAttemptApiUrl = apiUrlFactory("/attempts/:id/next");
export const answerAttemptApiUrl = apiUrlFactory("/attempts/:id/answers");
export const submitAttemptApiUrl = apiUrlFactory("/attempts/:id/submit");
export const summaryApiUrl = apiUrlFactory("/attempts/:id/summary");

// local routes
export const rootPath = pathFactory("/");
export const quizPath = pathFactory("/quizzes/:id");
export const quizzesPath = pathFactory("/quizzes");
export const attemptPath = pathFactory("/attempt/:id");
export const summaryPath = pathFactory("/summary/:id");
