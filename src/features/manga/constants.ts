import type { Manga } from "./schemas/manga";

// 상태 라벨은 카드 / 상세 / 향후 필터 UI 등 여러 곳에서 동일하게 쓰이므로 단일 소스로 둔다.
export const MANGA_STATUS_LABEL: Record<Manga["status"], string> = {
  ongoing: "연재 중",
  completed: "완결",
  hiatus: "휴재",
  cancelled: "중단",
};
