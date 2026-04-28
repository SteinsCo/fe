import { ApiError } from "@/shared/api";

type ErrorViewProps = {
  error: unknown;
  onRetry?: () => void;
};

export function PageLoading({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center text-neutral-400"
    >
      {label}
    </div>
  );
}

export function PageError({ error, onRetry }: ErrorViewProps) {
  const message = messageFor(error);
  return (
    <div
      role="alert"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
    >
      <p className="text-lg font-medium">문제가 발생했습니다.</p>
      <p className="text-sm text-neutral-400">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-neutral-400">{message}</div>
  );
}

function messageFor(error: unknown): string {
  if (!ApiError.is(error)) return "예상치 못한 오류가 발생했습니다.";
  // SCHEMA_001 은 백엔드 contract 불일치 — 진단 메시지(endpoint 등)가 raw 로 노출되지
  // 않도록 일반화된 사용자 문구로 우선 매핑한다. 상세는 로깅·Sentry 채널로만.
  if (error.code === "SCHEMA_001") return "서버 응답 형식이 예상과 다릅니다.";
  switch (error.category) {
    case "network":
      return "네트워크 연결을 확인해주세요.";
    case "timeout":
      return "요청이 시간 초과되었습니다.";
    case "not_found":
      return "요청한 항목을 찾을 수 없습니다.";
    case "rate_limit":
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    case "server":
      return "일시적인 서버 오류입니다. 곧 복구됩니다.";
    case "auth":
      return "로그인이 필요합니다.";
    case "forbidden":
      return "이 작업을 수행할 권한이 없습니다.";
    case "validation":
    case "conflict":
      return error.message || "오류가 발생했습니다.";
    default:
      // unknown/internal 등 분류 외 코드의 raw message 는 디버깅 정보일 수 있어 노출 금지.
      return "오류가 발생했습니다.";
  }
}
