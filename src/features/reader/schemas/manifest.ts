import { z } from "zod";

import { ReadingDirSchema } from "@/features/manga/schemas/manga";

export const PageSchema = z.object({
  index: z.number().int().positive(),
  url: z.string(),
  byte_size: z.number().int().nonnegative(),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  checksum: z.string(),
});

export type Page = z.infer<typeof PageSchema>;

export const ManifestSchema = z.object({
  chapter_id: z.string(),
  manga_id: z.string(),
  manga_slug: z.string(),
  number: z.string(),
  reading_dir: ReadingDirSchema,
  page_count: z.number().int().nonnegative(),
  pages: z.array(PageSchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export const ManifestResponseSchema = z.object({
  data: ManifestSchema,
});
export type ManifestResponse = z.infer<typeof ManifestResponseSchema>;
