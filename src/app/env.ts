import { z } from "zod";

// 환경변수는 부트스트랩 시점에 1회 검증한다.
// 검증 실패는 즉시 throw → 잘못된 빌드가 production에 도달하는 것을 방지.
//
// VITE_ENV 는 운영 분기용(development/staging/production)이며,
// vitest / 임의 커스텀 mode(local 등)에서도 부트스트랩이 죽지 않도록
// MODE 폴백 시 알 수 없는 값은 development 로 정규화한다.
const RuntimeEnv = z.enum(["development", "staging", "production"]);

function normalize(value: string | undefined): z.infer<typeof RuntimeEnv> {
  const parsed = RuntimeEnv.safeParse(value);
  return parsed.success ? parsed.data : "development";
}

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api/v1"),
  VITE_ENV: RuntimeEnv.default("development"),
});

export const env = EnvSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENV: normalize(import.meta.env.VITE_ENV ?? import.meta.env.MODE),
});

export type Env = z.infer<typeof EnvSchema>;
