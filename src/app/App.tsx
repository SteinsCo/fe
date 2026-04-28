import { RouterProvider } from "react-router-dom";

import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { PageError } from "@/shared/ui/feedback";

import { AppProviders } from "./providers";
import { router } from "./router";

export function App() {
  return (
    <ErrorBoundary fallback={<PageError error={new Error("앱 초기화 실패")} />}>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
