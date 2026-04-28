import type { Page } from "../schemas/manifest";

type Props = {
  page: Page;
  eager: boolean;
};

export function ReaderPage({ page, eager }: Props) {
  return (
    <figure className="flex w-full flex-col items-center gap-1">
      <img
        src={page.url}
        alt={`${page.index} 페이지`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        // 프로토타입: width/height 가 매니페스트에 없어 자연 비율로 표시. CLS 는 후속 task.
        className="h-auto w-full max-w-3xl rounded-md bg-neutral-800"
        // fetchPriority 는 React 18.3 부터 지원. 첫 페이지에 한해 high.
        {...(eager ? { fetchPriority: "high" as const } : {})}
      />
      <figcaption className="text-xs text-neutral-500">
        {page.index} / {page.mime_type.replace("image/", "")}
      </figcaption>
    </figure>
  );
}
