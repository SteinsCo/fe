import { ReaderPage } from "./ReaderPage";

import type { Manifest } from "../schemas/manifest";

const DIR_LABEL: Record<Manifest["reading_dir"], string> = {
  ltr: "좌→우 (LTR)",
  rtl: "우→좌 (RTL)",
  vertical: "세로 스크롤",
};

export function ChapterReader({ manifest }: { manifest: Manifest }) {
  // 프로토타입은 모든 reading_dir 을 vertical-scroll 로 통일 렌더.
  // 페이지 단위 / RTL 가로 펼침은 후속 이슈로 분리.
  return (
    <section
      data-testid="reader"
      data-reading-dir={manifest.reading_dir}
      className="flex flex-col items-center gap-4"
      aria-label={`챕터 ${manifest.number} 리더`}
    >
      <p className="text-xs text-neutral-500">읽기 방향: {DIR_LABEL[manifest.reading_dir]}</p>
      {manifest.pages.map((page) => (
        <ReaderPage key={page.index} page={page} eager={page.index === 1} />
      ))}
    </section>
  );
}
