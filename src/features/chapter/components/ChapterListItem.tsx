import { Link } from "react-router-dom";

import type { Chapter } from "../schemas/chapter";

export function ChapterListItem({ chapter }: { chapter: Chapter }) {
  // 챕터 표시: 번호 + (선택) 제목 + 페이지 수
  const label = chapter.title ? `${chapter.number} · ${chapter.title}` : `${chapter.number}`;
  return (
    <Link
      to={`/manga/${chapter.manga_slug}/chapter/${chapter.id}`}
      className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 transition hover:border-neutral-600"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-neutral-400">{chapter.page_count}p</span>
    </Link>
  );
}
