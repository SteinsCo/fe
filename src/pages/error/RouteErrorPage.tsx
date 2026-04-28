import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { PageError } from "@/shared/ui/feedback";

import { NotFoundPage } from "./NotFoundPage";

export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  return <PageError error={error} />;
}
