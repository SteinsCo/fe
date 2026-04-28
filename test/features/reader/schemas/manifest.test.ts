import { describe, expect, it } from "vitest";

import { ManifestSchema } from "@/features/reader/schemas/manifest";

describe("ManifestSchema", () => {
  const valid = {
    chapter_id: "steins-sample__0001",
    manga_id: "steins-sample",
    manga_slug: "steins-sample",
    number: "0001",
    reading_dir: "rtl",
    page_count: 1,
    pages: [
      {
        index: 1,
        url: "/api/v1/chapters/steins-sample__0001/pages/1/image",
        byte_size: 242,
        mime_type: "image/png",
        checksum: "sha-256:GqMCyFFpV0z921xLTFEd6gN+WN9cW/12LFIBbfnKNP4=",
      },
    ],
  };

  it("parses a valid manifest payload", () => {
    const parsed = ManifestSchema.parse(valid);
    expect(parsed.chapter_id).toBe("steins-sample__0001");
    expect(parsed.pages).toHaveLength(1);
    expect(parsed.reading_dir).toBe("rtl");
  });

  it("rejects an unsupported reading_dir", () => {
    expect(() => ManifestSchema.parse({ ...valid, reading_dir: "diagonal" })).toThrow();
  });

  it("rejects a non-positive page index", () => {
    const invalid = {
      ...valid,
      pages: [{ ...valid.pages[0], index: 0 }],
    };
    expect(() => ManifestSchema.parse(invalid)).toThrow();
  });
});
