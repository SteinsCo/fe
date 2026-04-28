import { useQuery } from "@tanstack/react-query";

import { apiClient, normalizeApiError, parseOrThrow } from "@/shared/api";

import { type Manga, MangaDetailResponseSchema } from "../schemas/manga";

import { mangaKeys } from "./keys";

async function fetchMangaDetail(slug: string): Promise<Manga> {
  try {
    const json = await apiClient.get(`manga/${slug}`).json();
    return parseOrThrow(MangaDetailResponseSchema, json, `GET /manga/${slug}`).data;
  } catch (err) {
    return normalizeApiError(err);
  }
}

export function useMangaDetail(slug: string) {
  return useQuery({
    queryKey: mangaKeys.detail(slug),
    queryFn: () => fetchMangaDetail(slug),
    enabled: slug.length > 0,
    staleTime: 5 * 60_000,
  });
}
