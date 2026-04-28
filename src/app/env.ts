import { z } from "zod";

// 환경변수는 부트스트랩 시점에 1회 검증한다.
// 검증 실패는 즉시 throw → 잘못된 빌드가 production에 도달하는 것을 방지.
const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api/v1"),
  VITE_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export const env = EnvSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENV: import.meta.env.VITE_ENV ?? import.meta.env.MODE,
});

export type Env = z.infer<typeof EnvSchema>;
