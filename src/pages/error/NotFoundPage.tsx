import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-neutral-400">요청하신 경로가 존재하지 않습니다.</p>
      <Link
        to="/"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
      >
        카탈로그로
      </Link>
    </div>
  );
}
