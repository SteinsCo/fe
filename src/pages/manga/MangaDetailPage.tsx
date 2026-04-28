import { Link, useParams } from "react-router-dom";

import { ChapterListItem, useChapterList } from "@/features/chapter";
import { type Manga, useMangaDetail } from "@/features/manga";
import { EmptyState, PageError, PageLoading } from "@/shared/ui/feedback";

const STATUS_LABEL: Record<Manga["status"], string> = {
  ongoing: "연재 중",
  completed: "완결",
  hiatus: "휴재",
  cancelled: "중단",
};

export function MangaDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const detail = useMangaDetail(slug);
  const chapters = useChapterList(slug);

  if (detail.isPending) return <PageLoading label="만화 정보를 불러오는 중..." />;
  if (detail.isError)
    return <PageError error={detail.error} onRetry={() => void detail.refetch()} />;

  const manga = detail.data;

  return (
    <div className="flex flex-col gap-8">
      <Link to="/" className="self-start text-sm text-neutral-400 hover:text-neutral-200">
        ← 카탈로그로
      </Link>

      <header className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[2/3] w-full max-w-[200px] flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800">
          {manga.cover_url ? (
            <img
              src={manga.cover_url}
              alt={`${manga.title} 표지`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
              표지 이미지 없음
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-3xl font-semibold">{manga.title}</h1>

          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-300">
            <div className="flex gap-1">
              <dt className="text-neutral-500">상태</dt>
              <dd>{STATUS_LABEL[manga.status]}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-neutral-500">언어</dt>
              <dd>{manga.language.toUpperCase()}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-neutral-500">읽기 방향</dt>
              <dd>{manga.reading_dir.toUpperCase()}</dd>
            </div>
            {manga.authors && manga.authors.length > 0 ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">작가</dt>
                <dd>{manga.authors.join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          {manga.genres && manga.genres.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {manga.genres.map((g) => (
                <li
                  key={g}
                  className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300"
                >
                  {g}
                </li>
              ))}
            </ul>
          ) : null}

          {manga.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">
              {manga.description}
            </p>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">챕터 목록</h2>
        <ChapterListBody mangaSlug={slug} list={chapters} />
      </section>
    </div>
  );
}

type ChapterListBodyProps = {
  mangaSlug: string;
  list: ReturnType<typeof useChapterList>;
};

function ChapterListBody({ list }: ChapterListBodyProps) {
  if (list.isPending) return <PageLoading label="챕터 목록을 불러오는 중..." />;
  if (list.isError) return <PageError error={list.error} onRetry={() => void list.refetch()} />;
  if (list.data.length === 0) return <EmptyState message="아직 등록된 챕터가 없습니다." />;
  return (
    <ul className="flex flex-col gap-2">
      {list.data.map((chapter) => (
        <li key={chapter.id}>
          <ChapterListItem chapter={chapter} />
        </li>
      ))}
    </ul>
  );
}
