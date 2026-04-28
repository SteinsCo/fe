import { Link, useParams } from "react-router-dom";

import { ChapterReader, useChapterManifest } from "@/features/reader";
import { EmptyState, PageError, PageLoading } from "@/shared/ui/feedback";

export function ChapterReaderPage() {
  const { slug = "", chapterId = "" } = useParams<{ slug: string; chapterId: string }>();
  const { data, isPending, isError, error, refetch } = useChapterManifest(chapterId);

  if (isPending) return <PageLoading label="챕터를 불러오는 중..." />;
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;
  if (data.pages.length === 0) return <EmptyState message="페이지가 없는 챕터입니다." />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <Link
          to={`/manga/${slug || data.manga_slug}`}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← {data.manga_slug} 상세
        </Link>
        <div className="text-sm text-neutral-300">
          챕터 {data.number} · {data.page_count}p
        </div>
      </header>
      <ChapterReader manifest={data} />
    </div>
  );
}
