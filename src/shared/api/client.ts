import ky, { TimeoutError } from "ky";

import { env } from "@/app/env";

import { ApiError, toApiError } from "./error";

// ky 인스턴스: prefixUrl + 15s timeout. 비-2xx 응답은 ky 가 HTTPError 로 throw.
// 호출자는 catch 블록에서 normalizeApiError 로 ApiError 로 변환한다.
export const apiClient = ky.create({
  prefixUrl: env.VITE_API_BASE_URL,
  timeout: 15_000,
  retry: { limit: 0 },
});

export async function normalizeApiError(err: unknown): Promise<never> {
  // TimeoutError 는 response 가 없어 toApiError 로 변환 시 category 가 "network" 로
  // 떨어진다. UI/리트라이 정책에서 timeout 전용 분기가 적용되도록 직접 생성한다.
  if (err instanceof TimeoutError) {
    throw new ApiError({
      category: "timeout",
      status: 408,
      code: "TIMEOUT_001",
      message: "request timeout",
      cause: err,
    });
  }
  throw await toApiError(err);
}
