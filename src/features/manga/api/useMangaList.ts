import { useQuery } from "@tanstack/react-query";

import { apiClient, normalizeApiError, parseOrThrow } from "@/shared/api";

import { type Manga, MangaListResponseSchema } from "../schemas/manga";

import { mangaKeys } from "./keys";

async function fetchMangaList(): Promise<Manga[]> {
  try {
    const json = await apiClient.get("manga").json();
    return parseOrThrow(MangaListResponseSchema, json, "GET /manga").data;
  } catch (err) {
    return normalizeApiError(err);
  }
}

export function useMangaList() {
  return useQuery({
    queryKey: mangaKeys.list(),
    queryFn: fetchMangaList,
    staleTime: 60_000,
  });
}
