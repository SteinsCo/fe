import { z } from "zod";

export const MangaStatusSchema = z.enum(["ongoing", "completed", "hiatus", "cancelled"]);
export type MangaStatus = z.infer<typeof MangaStatusSchema>;

export const ReadingDirSchema = z.enum(["ltr", "rtl", "vertical"]);
export type ReadingDir = z.infer<typeof ReadingDirSchema>;

export const MangaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  alt_titles: z.array(z.string()).optional(),
  description: z.string().optional(),
  cover_url: z.string().optional(),
  authors: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  status: MangaStatusSchema,
  language: z.string(),
  reading_dir: ReadingDirSchema,
  published_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Manga = z.infer<typeof MangaSchema>;

export const ListMetaSchema = z
  .object({
    count: z.number().int().nonnegative().optional(),
  })
  .optional();

export const MangaListResponseSchema = z.object({
  data: z.array(MangaSchema),
  meta: ListMetaSchema,
});
export type MangaListResponse = z.infer<typeof MangaListResponseSchema>;

export const MangaDetailResponseSchema = z.object({
  data: MangaSchema,
});
export type MangaDetailResponse = z.infer<typeof MangaDetailResponseSchema>;
