import { createBrowserRouter } from "react-router-dom";

import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { ChapterReaderPage } from "@/pages/chapter/ChapterReaderPage";
import { NotFoundPage } from "@/pages/error/NotFoundPage";
import { RouteErrorPage } from "@/pages/error/RouteErrorPage";
import { MangaDetailPage } from "@/pages/manga/MangaDetailPage";

import { RootLayout } from "./RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "manga/:slug", element: <MangaDetailPage /> },
      { path: "manga/:slug/chapter/:chapterId", element: <ChapterReaderPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
