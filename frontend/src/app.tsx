import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout";
import { QuizPage } from "@/pages/quiz";
import { RootPage } from "@/pages/root";
import { AttemptPage } from "@/pages/attempt";
import { SummaryPage } from "@/pages/summary";
import { rootPath, quizPath, attemptPath, summaryPath } from "@/paths";

const router = createBrowserRouter([
	{
		path: rootPath.pattern,
		element: <Layout />,
		children: [
			{
				path: rootPath.pattern,
				element: <RootPage />,
			},
			{
				path: quizPath.pattern,
				element: <QuizPage />,
			},
			{
				path: attemptPath.pattern,
				element: <AttemptPage />,
			},
			{
				path: summaryPath.pattern,
				element: <SummaryPage />,
			},
		],
	},
]);

export function App() {
	return <RouterProvider router={router} />;
}
