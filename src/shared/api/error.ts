// API 에러를 카테고리·코드 단위로 정규화한 클래스.
// UI 분기는 `category` 로, 도메인 분기는 `code` 로 처리.

export type ErrorCategory =
  | "validation"
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "network"
  | "timeout"
  | "server"
  | "unknown";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

type ApiErrorInit = {
  category: ErrorCategory;
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly category: ErrorCategory;
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = "ApiError";
    this.category = init.category;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
  }

  static is(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export function categoryFromStatus(status: number): ErrorCategory {
  if (status === 0) return "network";
  if (status === 400) return "validation";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 408 || status === 504) return "timeout";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

// ky 의 HTTPError 또는 fetch 자체 실패를 ApiError 로 변환.
export async function toApiError(err: unknown): Promise<ApiError> {
  // ky HTTPError 는 .response 를 가진다 (런타임 duck-typing).
  const maybe = err as { response?: Response; name?: string; message?: string };
  const response = maybe?.response;

  if (!response) {
    return new ApiError({
      category: "network",
      status: 0,
      code: "NET_001",
      message: maybe?.message ?? "network unreachable",
      cause: err,
    });
  }

  let body: ApiErrorBody | undefined;
  try {
    body = (await response.clone().json()) as ApiErrorBody;
  } catch {
    body = undefined;
  }

  // statusText 는 일부 프록시/HTTP/2 응답에서 빈 문자열로 내려온다.
  // ?? 는 null/undefined 만 폴백하므로 빈 문자열도 명시적으로 fallback 처리한다.
  const fallbackMessage = response.statusText || `HTTP ${response.status}`;

  return new ApiError({
    category: categoryFromStatus(response.status),
    status: response.status,
    code: body?.error?.code ?? `HTTP_${response.status}`,
    message: body?.error?.message || fallbackMessage,
    details: body?.error?.details,
    cause: err,
  });
}
