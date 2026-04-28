import { useQuery } from "@tanstack/react-query";

import { apiClient, normalizeApiError, parseOrThrow } from "@/shared/api";

import { type Manifest, ManifestResponseSchema } from "../schemas/manifest";

import { readerKeys } from "./keys";

async function fetchChapterManifest(chapterId: string): Promise<Manifest> {
  try {
    const json = await apiClient.get(`chapters/${chapterId}/pages`).json();
    return parseOrThrow(
      ManifestResponseSchema,
      json,
      `GET /chapters/${chapterId}/pages`,
    ).data;
  } catch (err) {
    return normalizeApiError(err);
  }
}

export function useChapterManifest(chapterId: string) {
  return useQuery({
    queryKey: readerKeys.manifest(chapterId),
    queryFn: () => fetchChapterManifest(chapterId),
    enabled: chapterId.length > 0,
    staleTime: 10 * 60_000,
  });
}
