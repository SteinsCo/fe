import { Link } from "react-router-dom";

import { MANGA_STATUS_LABEL } from "../constants";

import type { Manga } from "../schemas/manga";

export function MangaCard({ manga }: { manga: Manga }) {
  return (
    <Link
      to={`/manga/${manga.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-800">
        {manga.cover_url ? (
          <img
            src={manga.cover_url}
            alt={`${manga.title} 표지`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
            표지 이미지 없음
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="line-clamp-2 text-base font-semibold">{manga.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
          <span>{MANGA_STATUS_LABEL[manga.status]}</span>
          <span aria-hidden="true">·</span>
          <span>{manga.language.toUpperCase()}</span>
          {manga.authors && manga.authors.length > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{manga.authors.join(", ")}</span>
            </>
          ) : null}
        </div>
        {manga.genres && manga.genres.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1">
            {manga.genres.map((g) => (
              <li
                key={g}
                className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300"
              >
                {g}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  );
}
