import { useQuery } from "@tanstack/react-query";

import { apiClient, normalizeApiError, parseOrThrow } from "@/shared/api";

import { type Chapter, ChapterListResponseSchema } from "../schemas/chapter";

import { chapterKeys } from "./keys";

async function fetchChapterList(mangaSlug: string): Promise<Chapter[]> {
  try {
    const json = await apiClient.get(`manga/${mangaSlug}/chapters`).json();
    return parseOrThrow(ChapterListResponseSchema, json, `GET /manga/${mangaSlug}/chapters`).data;
  } catch (err) {
    return normalizeApiError(err);
  }
}

export function useChapterList(mangaSlug: string) {
  return useQuery({
    queryKey: chapterKeys.listByManga(mangaSlug),
    queryFn: () => fetchChapterList(mangaSlug),
    enabled: mangaSlug.length > 0,
    staleTime: 60_000,
  });
}
