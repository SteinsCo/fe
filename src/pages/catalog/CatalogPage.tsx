import { MangaCard, useMangaList } from "@/features/manga";
import { EmptyState, PageError, PageLoading } from "@/shared/ui/feedback";

export function CatalogPage() {
  const { data, isPending, isError, error, refetch } = useMangaList();

  if (isPending) return <PageLoading label="카탈로그를 불러오는 중..." />;
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;
  if (data.length === 0) return <EmptyState message="등록된 만화가 없습니다." />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">만화 카탈로그</h1>
        <p className="text-sm text-neutral-400">총 {data.length}편</p>
      </header>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.map((manga) => (
          <li key={manga.id}>
            <MangaCard manga={manga} />
          </li>
        ))}
      </ul>
    </div>
  );
}
