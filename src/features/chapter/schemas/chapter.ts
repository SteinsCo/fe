import { z } from "zod";

import { ListMetaSchema } from "@/features/manga/schemas/manga";

export const ChapterSchema = z.object({
  id: z.string(),
  manga_id: z.string(),
  manga_slug: z.string(),
  number: z.string(),
  title: z.string().optional(),
  language: z.string().optional(),
  page_count: z.number().int().nonnegative(),
  published_at: z.string().datetime().optional(),
});

export type Chapter = z.infer<typeof ChapterSchema>;

export const ChapterListResponseSchema = z.object({
  data: z.array(ChapterSchema),
  meta: ListMetaSchema,
});
export type ChapterListResponse = z.infer<typeof ChapterListResponseSchema>;
