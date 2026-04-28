import ky, { TimeoutError } from "ky";

import { env } from "@/app/env";

import { toApiError } from "./error";

// ky 인스턴스: prefixUrl + 15s timeout. 비-2xx 응답은 ky 가 HTTPError 로 throw.
// 호출자는 catch 블록에서 normalizeApiError 로 ApiError 로 변환한다.
export const apiClient = ky.create({
  prefixUrl: env.VITE_API_BASE_URL,
  timeout: 15_000,
  retry: { limit: 0 },
});

export async function normalizeApiError(err: unknown): Promise<never> {
  if (err instanceof TimeoutError) {
    throw await toApiError({ message: "request timeout" });
  }
  throw await toApiError(err);
}
