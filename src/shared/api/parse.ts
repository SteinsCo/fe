import { ApiError } from "./error";

import type { z } from "zod";

// Zod 검증 실패는 백엔드 contract 와의 불일치를 의미하므로 명시적인 ApiError 로 격상.
// 호출자는 ApiError(category: "unknown", code: "SCHEMA_001") 로 일관되게 처리.
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError({
      category: "unknown",
      status: 0,
      code: "SCHEMA_001",
      message: `API response schema mismatch: ${context}`,
      details: { issues: result.error.issues },
      cause: result.error,
    });
  }
  return result.data;
}
