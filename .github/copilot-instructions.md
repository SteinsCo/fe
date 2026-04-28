# GitHub Copilot Instructions

## Language
- All responses and code review comments MUST be written in **Korean (한국어)**
- Technical terms (React, TypeScript, Vite, TanStack Query, Zustand 등) may remain in English
- Code itself (identifiers, TSDoc comments) follows the conventions below

---

## Project Overview

**Steins Frontend** is the React + TypeScript single-page application that consumes the Steins manga API — a reader-first web client for browsing series, reading chapters, and managing personal libraries.

```
┌─────────────────────────────────────────┐
│     Browser (User Agent)                │
├─────────────────────────────────────────┤
│     App Shell  (router, providers)      │
├─────────────────────────────────────────┤
│     Pages  (route-level views)          │
├─────────────────────────────────────────┤
│     Features  (domain modules)          │
│     manga / chapter / reader / library  │
├─────────────────────────────────────────┤
│     Shared  (UI primitives, api, lib)   │
├─────────────────────────────────────────┤
│     HTTP API (Steins backend)           │
└─────────────────────────────────────────┘
```

**Tech Stack**: React 18+, TypeScript 5+, Vite 5+, React Router v6, TanStack Query v5, Zustand, Tailwind CSS, React Hook Form + Zod, Vitest + React Testing Library + MSW, Playwright (E2E), pnpm

---

## Branch Naming Convention

```
{category}/#{issue-number}/{short-kebab-summary}
```

| Category | 용도 |
|----------|------|
| `feature/` | 새로운 기능 구현 및 추가 |
| `fix/` | 버그 수정 |
| `refactor/` | 구조 변경 및 리팩토링 |
| `docs/` | 문서 작업 |
| `chore/` | 빌드·CI·도구 등 잡무 |

**규칙:**
- 이슈 번호는 `#` 접두사 포함 (예: `#15`)
- 요약은 영문 소문자 + 하이픈(-) + 30자 이내
- 변경 대상 모듈/컴포넌트명 중심으로 간결하게 표현

**예시:**
```
feature/#15/chapter-reader-page
feature/#16/manga-catalog-list
feature/#17/library-shelves
feature/#18/auth-login-form
feature/#19/reader-keyboard-shortcuts
fix/#7/reader-shortcut-modal-conflict
fix/#9/manga-card-image-cls
refactor/#4/features-reader-restructure
docs/#2/component-implementation-rules
chore/#3/eslint-v9-upgrade
```

---

## Git Commit Convention

### Format

```
[{CATEGORY}]: {변경 내용}
```

### Categories

| Category | 용도 |
|----------|------|
| `FEAT` | 기능 구현 및 추가 |
| `FIX` | 버그 수정 |
| `REFAC` | 구조 변경, 리팩토링 |
| `DOCS` | 문서 작업, 주석, 프롬프트 변경 |
| `CHORE` | 빌드·CI·도구·의존성 등 잡무 (코드 외 부가 작업) |

### 작성 규칙

> **⚠️ 커밋 메시지는 반드시 한국어로 작성**

1. 언어: 한국어 (영어 사용 금지)
2. 형식: 명사형 종결 (예: "구현", "수정", "추가")
3. 내용: 변경 사항의 전체 요약 + 모듈별 변경점 명시

### 예시

```
[FEAT]: chapter reader 페이지 manifest 로딩 구현

- ChapterReaderPage 라우트 추가
- useChapterPages TanStack Query 훅 작성
- PagePrefetcher 컴포넌트로 next-3 이미지 prefetch
```

```
[FIX]: reader keyboard shortcut 모달 열림 상태에서 충돌 수정

- useReaderShortcuts에서 Dialog open 시 listener 비활성화
- ARIA-modal 컨텍스트 감지 로직 추가
```

```
[REFAC]: features/reader 디렉토리 재구성

- components/hooks/api 분리
- 공용 prefetcher를 shared가 아닌 reader 내부로 이동
```

```
[CHORE]: ESLint v9 / typescript-eslint v8 업그레이드

- flat config 마이그레이션
- jsx-a11y / import 룰 재구성
```

```
[DOCS]: Component 구현 룰셋 작성

- TanStack Query / Zustand 패턴 정리
- 라우팅 / 폼 / 인증 섹션 추가
```

---

## Code Style Guide (TypeScript / React)

### Compiler & Formatting

- **TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`
- **Prettier**: 100 열, 2 spaces, 더블쿼트, 세미콜론, 트레일링 컴마 all
- **ESLint** + `react-hooks` + `jsx-a11y` + `import` + `@typescript-eslint`

### Imports — Group and Order

```ts
// React / built-in
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// External packages
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";

// Internal aliases (@/...)
import { apiClient } from "@/shared/api/client";
import { Button } from "@/shared/ui/Button";

// Relative
import { ChapterToolbar } from "./ChapterToolbar";
import styles from "./ChapterReader.module.css";
```

### Naming Conventions

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | camelCase | `chapterCount`, `fetchManga` |
| 모듈 상수 | UPPER_SNAKE_CASE | `MAX_PAGES_PER_CHAPTER` |
| 컴포넌트 | PascalCase | `MangaCard`, `ChapterReader` |
| 훅 | useCamelCase | `useChapterPages` |
| 타입/인터페이스 | PascalCase | `Manga`, `ButtonProps` |
| 컴포넌트 파일 | PascalCase.tsx | `MangaCard.tsx` |
| 비-컴포넌트 파일 | camelCase.ts | `useChapterPages.ts` |
| 테스트 파일 | `<source>.test.{ts,tsx}` | `MangaCard.test.tsx` |
| Boolean | `is/has/should/can` 접두 | `isLoading`, `hasNextPage` |
| 이벤트 핸들러 props | `on<Event>` | `onClick`, `onPageChange` |

### Component Anatomy

```tsx
// 1. Imports (grouped)
// 2. Module constants
// 3. Types (props 먼저)
// 4. Component (function 키워드 사용)
//    4a. Hooks → 4b. Handlers → 4c. Effects → 4d. Early returns → 4e. Render
// 5. Sub-components / file-private helpers

export function ChapterReader({ manifest }: ChapterReaderProps) {
  const direction = useReaderSettings((s) => s.direction);
  // ...
  return <section data-direction={direction}>{/* ... */}</section>;
}
```

### Function Design

- 함수당 최대 ~50줄
- 위치 인자 최대 3개 (초과 시 options 객체로 묶기)
- Pure 우선, 부수효과는 명시적으로
- async/await 일관 사용 (then/catch 혼용 금지)

### Anti-Patterns (금지)

```ts
// ❌ any
function parse(input: any) { return input.id; }
// ✅ unknown + Zod
function parse(input: unknown): { id: string } { return Schema.parse(input); }
```

```tsx
// ❌ Derived state in useState
const [pages, setPages] = useState<Page[]>([]);
const [pageCount, setPageCount] = useState(0); // duplicates pages.length
// ✅ Derive on render
const pageCount = pages.length;
```

```tsx
// ❌ Index as key for reorderable lists
{pages.map((p, i) => <Page key={i} page={p} />)}
// ✅ Stable id
{pages.map((p) => <Page key={p.id} page={p} />)}
```

```ts
// ❌ Floating promise
mutate(input);
// ✅ Await or explicit void
await mutate(input);
void prefetchNext(id);
```

```ts
// ❌ Tokens in localStorage
localStorage.setItem("access_token", token);
// ✅ in-memory store + HttpOnly refresh cookie
authStore.getState().setAccessToken(token);
```

```ts
// ❌ Deep feature path import
import { MangaCard } from "@/features/manga/components/MangaCard";
// ✅ Public surface
import { MangaCard } from "@/features/manga";
```

### State Management

| 데이터 | 위치 | 이유 |
|--------|------|------|
| API 응답 (manga, chapter, page, progress) | TanStack Query | 서버 소유, 캐시·재요청 |
| Reader 설정 (direction, variant, theme) | Zustand (`persist`) | 클라이언트 전용, 영속 |
| UI 상태 (모달, 드로어) | `useState` | 로컬, 일시적 |
| 폼 상태 | React Hook Form | 검증·제어 입력 통합 |
| 인증 토큰 (access) | in-memory Zustand | 보안 (refresh는 HttpOnly cookie) |
| 검색·필터 쿼리 | URL search params | 공유·뒤로가기 친화 |

### Layering

```
app  →  pages  →  features  →  shared
```

- pages → features (✅), pages → shared (✅)
- features → shared (✅)
- features → 다른 feature (❌, shared로 올리거나 page에서 합성)
- shared → features/pages (❌)

ESLint `import/no-restricted-paths`로 강제.

---

## Comments Convention

**언어 정책:**
- 인라인 주석: **한국어 우선**, 영어 기술 용어 혼용 허용
- TSDoc (exported API): **영어 우선**, 한국어 설명 아래에 추가
- 주석 원칙: **WHY만 설명** (WHAT은 코드로 표현, 당연한 내용 금지)

```ts
/**
 * Fetches the page manifest for a chapter.
 * chapter의 page manifest를 조회합니다.
 *
 * Throws `ApiError(category: "not_found")` when the chapter does not exist.
 */
export async function fetchChapterPages(chapterId: string): Promise<ChapterManifest> {
  // 다음 chapter manifest를 prefetch — reader 체감 latency 감소
  void queryClient.prefetchQuery({ queryKey: chapterKeys.pages(chapterId), queryFn });
  // ...
}
```

**TODO 형식:**
```ts
// TODO(juhy0987): 무한 스크롤 도입 — useInfiniteQuery로 교체 (#42)
// TODO: prefetch hint를 manifest에 포함 (모바일 reader 성능)
```

---

## Error Handling

- 모든 라우트는 error boundary로 감쌉니다 (`react-router-dom`의 `errorElement`)
- API 응답은 항상 Zod로 boundary에서 검증
- `ApiError`로 normalize → `category` 기반으로 UI 분기
- `console.log` 금지 (`log.*` 헬퍼 사용; `no-console` ESLint 룰 적용)

```ts
import { ApiError } from "@/shared/api/error";

if (ApiError.is(error) && error.category === "not_found") {
  return <ChapterNotFound chapterId={chapterId} />;
}
```

### Error Categories

```
network / timeout / server / rate_limit
auth / forbidden / not_found / conflict / validation
render / config / unknown
```

### Retry 원칙 (TanStack Query)

| 카테고리 | 재시도 | 비고 |
|----------|--------|------|
| network/timeout/server | 2회 | exponential backoff |
| rate_limit | 1회 | `Retry-After` 헤더 우선 |
| auth (401) | refresh 1회 | 인터셉터가 처리 |
| validation/not_found/forbidden/conflict | 0회 | 영구 오류 |

---

## Logging

**Logger API** — `src/shared/observability/logger.ts`의 `log.*` 헬퍼만 사용:

```ts
import { log } from "@/shared/observability/logger";

log.info("manga list fetched", { route: "/manga", count: data.length });
log.warn("retrying after error", { attempt: 2, error_code: error.code });
log.error("chapter manifest fetch failed", {
  chapter_id: chapterId,
  request_id: error.requestId,
  error_code: error.code,
});
```

**규칙:**
- `console.log` 금지 (`warn`/`error`만 ESLint에서 허용)
- 항상 structured fields, 문자열 보간 금지
- 필드 키는 백엔드 로그와 grep 호환을 위해 `snake_case` 유지
- 표준 키: `route`, `request_id`, `chapter_id`, `manga_id`, `user_id`, `error_code`, `query_key`, `duration_ms`, `status_code`

**Log Levels:**

| Level | 용도 |
|-------|------|
| `debug` | 개발/진단 (production에서 no-op) |
| `info` | 정상 마일스톤 (production에서 no-op, 필요시 RUM beacon) |
| `warn` | 처리는 됐지만 비정상 (재시도, fallback) |
| `error` | 작업 실패, Sentry로 전송 |

---

## Testing

### Naming Pattern

```ts
describe("ChapterReader", () => {
  it("renders the page manifest in RTL order when direction is rtl", () => {});
  it("shows an error message when the manifest fails to load", () => {});
});
```

### Test Structure (AAA)

```tsx
import { renderWithProviders } from "@/../test/utils/render";
import { MangaCard } from "@/features/manga/components/MangaCard";
import { buildManga } from "@/../test/factories/manga";

it("renders the title and links to the detail page", () => {
  // Arrange
  const manga = buildManga({ title: "Test Manga" });

  // Act
  const { getByRole } = renderWithProviders(<MangaCard manga={manga} />);

  // Assert
  expect(getByRole("link", { name: /test manga/i })).toHaveAttribute("href", `/manga/${manga.id}`);
});
```

### Coverage 기준

| 대상 | 최소 커버리지 |
|------|---------------|
| `src/` 전체 | 70% |
| `src/features/auth/` | 90% |
| `src/features/reader/` | 90% |
| `src/shared/api/` | 95% |

### Test 파일 위치

소스와 **같은 디렉토리에 두지 않음** — 별도 `test/` 디렉토리 사용 (구조 mirror):

```
test/
├── setup.ts
├── utils/
│   ├── render.tsx
│   ├── msw-server.ts
│   └── handlers.ts
├── factories/
│   └── manga.ts
├── features/
│   ├── manga/components/MangaCard.test.tsx
│   └── reader/components/ChapterReader.test.tsx
├── pages/
│   └── chapter/ChapterReaderPage.test.tsx
└── shared/
    └── api/error.test.ts
```

### MSW로 네트워크 모킹

- 모든 unit/integration 테스트에서 실제 네트워크 호출 금지
- 기본 핸들러는 `test/utils/handlers.ts`, 케이스별 override는 `server.use(...)`
- `onUnhandledRequest: "error"` 설정으로 누락된 모킹 즉시 실패

### Loading / Error / Empty / Success

데이터를 페치하는 컴포넌트는 4가지 상태에 대한 테스트 모두 작성.

### E2E (Playwright)

핵심 사용자 경로는 E2E로 보장:
1. 카탈로그 → 만화 상세 → chapter reader 진입
2. 로그인 → 라이브러리 추가 → 새로고침 후 유지 확인
3. Reader → `→` 키로 페이지 이동 → 종료 시 진행 저장
4. 검색 → 결과 클릭 → 상세 진입
5. 로그아웃 → 보호 라우트 접근 시 로그인으로 리다이렉트

---

## Configuration Files (YAML / JSON)

- 들여쓰기: 2 spaces
- 키: 백엔드와 공유되는 경우 snake_case, FE 도구 설정은 camelCase (Vite, ESLint 등)
- 비자명한 값에는 단위/의미 주석 추가

```yaml
# 환경 정보 메타 (예시)
api:
  base_url: "https://api.steins.example/api/v1"
  timeout_ms: 15000  # 15s — 백엔드 핸들러 write timeout과 동기화
```

---

## File Organization

### File Naming

- 컴포넌트: `PascalCase.tsx` (`MangaCard.tsx`)
- 훅 / 유틸: `camelCase.ts` (`useChapterPages.ts`)
- 테스트: `<source>.test.{ts,tsx}`
- 스타일: `<Component>.module.css`
- 자산: `kebab-case`

### File Structure (TS/TSX 내부 순서)

```ts
// 1. Imports (grouped)
// 2. Module constants
// 3. Types
// 4. Component / main export
// 5. Sub-components / file-private helpers
```

### Public Module Surface

```ts
// src/features/manga/index.ts
export { MangaCard } from "./components/MangaCard";
export { useMangaList } from "./api/useMangaList";
export type { Manga } from "./schemas/manga";
```

다른 layer는 deep path가 아닌 `@/features/manga` 인덱스에서만 import.

---

## Documentation

- `README.md` (root): **영어**로 작성, 상단에 한국어 링크 포함
- 한국어 번역: `docs/ko/README.md`
- TSDoc: 영어 우선, 한국어 설명 병기
- 문서 업데이트 시 영어 먼저, 한국어 번역 후 동기화

문서 관련 커밋 메시지:
```
[DOCS]: [기능명] 문서 업데이트 (en+ko)
```

---

## Issue Convention

### 이슈 타이틀 형식

```
[{CATEGORY}] 이슈 타이틀
```

| Category | 용도 | 라벨 | 템플릿 |
|----------|------|------|--------|
| `FEATURE` | 새로운 기능 요청 및 구현 | `feature` | `feature.md` |
| `BUG` | 버그 리포트 및 수정 | `bug` | `bug.md` |
| `REFACTOR` | 코드 구조 개선, 리팩토링 | `refactor` | `refactor.md` |
| `CHORE` | 문서 작업, 의존성 업데이트 등 코드 외 부가 작업 | `chore` | `chore.md` |

**예시:**
```
[FEATURE] Chapter reader 페이지 구현
[BUG] Reader keyboard shortcut 모달 열림 상태에서 충돌
[REFACTOR] features/reader 디렉토리 재구성
[CHORE] ESLint v9 업그레이드
[CHORE] Component 구현 문서 작성
```

### 이슈 템플릿별 작성 규칙

**FEATURE** (`.github/ISSUE_TEMPLATE/feature.md`):

| 섹션 | 설명 |
|------|------|
| 어떤 기능인가요? | 구현할 기능의 목적과 배경을 간략히 서술 |
| 무엇을 하나요? | 구현 단위를 task 체크리스트로 나열 |
| 참고 자료 | 관련 문서, 링크, 설계 자료 |

**BUG** (`.github/ISSUE_TEMPLATE/bug.md`):

| 섹션 | 설명 |
|------|------|
| 무엇을 수정하나요? | 버그 현상과 예상 동작을 서술 |
| 참고 자료 | 로그, 스크린샷, 재현 방법 |

**REFACTOR** (`.github/ISSUE_TEMPLATE/refactor.md`):

| 섹션 | 설명 |
|------|------|
| 무엇을 개선하나요? | 현재 문제점과 개선 목표를 서술 |
| 무엇을 하나요? | 개선 작업을 task 체크리스트로 나열 |
| 참고 자료 | 관련 문서, 링크 |

**CHORE** (`.github/ISSUE_TEMPLATE/chore.md`):

| 섹션 | 설명 |
|------|------|
| 어떤 작업인가요? | 작업의 목적과 배경을 간략히 서술 |
| 무엇을 하나요? | 작업 항목을 task 체크리스트로 나열 |
| 참고 자료 | 관련 문서, 링크 |

### 이슈 ↔ 브랜치 ↔ PR ↔ 커밋 연결

```
이슈: [FEATURE] Chapter reader 페이지 구현 (이슈 #15)
  ↓
브랜치: feature/#15/chapter-reader-page
  ↓
커밋: [FEAT]: ChapterReaderPage 라우트 + manifest 훅 추가
  ↓
PR 타이틀: [FEAT#15] Chapter reader 페이지 구현
PR 라벨: feature
```

> 이슈 카테고리(FEATURE)와 커밋/브랜치/PR 카테고리(FEAT)는 약어가 다를 수 있다. 위 매핑을 기준으로 맞춘다.

| 이슈 | 브랜치 prefix | 커밋/PR |
|------|---------------|---------|
| `FEATURE` | `feature/` | `FEAT` |
| `BUG` | `fix/` | `FIX` |
| `REFACTOR` | `refactor/` | `REFAC` |
| `CHORE` | `chore/` 또는 `docs/` | `CHORE` (코드 외 잡무) 또는 `DOCS` (순수 문서 작업) |

---

## Pull Request Convention

### PR 타이틀 형식

CI (`PR Title Lint`) 가 정규식으로 엄격 강제합니다:
`^\[(FEAT|FIX|REFAC|DOCS|CHORE)#[0-9]+\]:? .+`

```
[{CATEGORY}#{이슈번호}] PR 타이틀
[{CATEGORY}#{이슈번호}]: PR 타이틀   (콜론 형태도 허용)
```

| Category | 용도 |
|----------|------|
| `FEAT` | 기능 구현 및 추가 |
| `FIX` | 버그 수정 |
| `REFAC` | 구조 변경, 리팩토링 |
| `DOCS` | 문서 작업 |
| `CHORE` | 빌드·CI·도구 등 잡무 |

**통과 예시:**
```
[FEAT#15] Chapter reader 페이지 구현
[FEAT#15]: Chapter reader 페이지 구현
[FIX#7] reader shortcut 모달 충돌 수정
[REFAC#4] features/reader 디렉토리 재구성
[DOCS#2] Component 구현 룰셋 작성
[CHORE#117] ESLint v9 업그레이드
```

**거부 예시 (CI 실패):**
- `[FEAT]: 이슈번호 누락` — `#이슈번호` 필수
- `[FEAT 119]: # 대신 공백` — 반드시 `#` 사용
- `[FEAT#abc]: 숫자 아닌 이슈번호` — 숫자만 허용
- `[FEATXX#1]: 잘못된 카테고리` — 위 5개만 허용
- `[FEAT#1]설명` — `]` 또는 `:` 뒤 공백 필수
- `feat#1: 소문자` — 카테고리는 대문자만 허용

### PR 본문 — 템플릿 작성 규칙

PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 폼을 그대로 사용한다.

```markdown
## 연관 이슈
- #{이슈번호}

## 구현 내용
- {변경사항 1}
- {변경사항 2}
- ...

## TODO
-

## 논의 사항
-
```

**섹션별 작성 원칙:**

| 섹션 | 규칙 |
|------|------|
| **연관 이슈** | 반드시 연관 이슈 번호 링크 (`- Closes #15`) |
| **구현 내용** | 변경사항과 관련 핵심 컴포넌트/훅을 명시. **반드시 작성** |
| **TODO** | 보완이 필요한 항목이 없으면 그대로 둠 (`- `) |
| **논의 사항** | 논의가 필요한 항목이 없으면 그대로 둠 (`- `) |

> **⚠️ 작업 내용(구현 내용)만 채우고, TODO·논의 사항에 기재할 내용이 없으면 빈 항목(`- `)을 지우지 않고 그대로 남긴다.**

### 라벨

PR 카테고리에 맞는 라벨을 지정:

| 라벨 | 적용 조건 |
|------|-----------|
| `feature` | FEAT 카테고리 PR |
| `bug` | FIX 카테고리 PR |
| `refactor` | REFAC 카테고리 PR |
| `documentation` | DOCS 카테고리 PR |
| `breaking change` | 하위 호환성을 깨는 변경 포함 시 추가 |
| `wip` | 작업이 완료되지 않은 draft PR |

### Tasks (체크리스트)

PR 생성 시 구현 내용에 따라 관련 task를 자동으로 추가:

**FEAT PR:**
- [ ] 컴포넌트/훅/스키마 정의 완료
- [ ] TanStack Query / Zustand 연결 완료
- [ ] Loading / Error / Empty / Success 상태 구현
- [ ] 단위 + 컴포넌트 테스트 (커버리지 충족)
- [ ] 접근성 (키보드 / focus / aria) 점검
- [ ] TSDoc 작성 (exported API)
- [ ] (해당 시) E2E 시나리오 추가

**FIX PR:**
- [ ] 버그 재현 테스트 작성
- [ ] 수정 사항 구현
- [ ] 기존 테스트 통과 확인
- [ ] 회귀 테스트 추가

**REFAC PR:**
- [ ] 기존 동작 변경 없음 확인
- [ ] 기존 테스트 통과 확인
- [ ] 불필요한 코드 제거

**DOCS PR:**
- [ ] 영어 문서 작성/수정
- [ ] 한국어 번역 동기화

### PR 예시

```markdown
## 연관 이슈
- Closes #15

## 구현 내용
- `src/features/reader/` 모듈에 ChapterReader 컴포넌트 + useChapterPages 훅 추가
- `src/pages/chapter/ChapterReaderPage.tsx`에서 라우트 연결
- PagePrefetcher로 next-3 이미지 prefetch 적용
- MSW 핸들러 + RTL 단위 테스트, Playwright E2E 추가

## TODO
-

## 논의 사항
-
```

---

## Code Review Checklist

PR 제출 전 확인:

- [ ] 커밋 메시지가 한국어 + `[CATEGORY]:` 형식을 따름
- [ ] 브랜치명이 `{category}/#{issue}/{kebab-summary}` 형식을 따름
- [ ] `any` 미사용 (`unknown` + Zod 사용)
- [ ] `console.log` 미사용 (`log.*` 헬퍼 사용)
- [ ] 사용하지 않는 import / 변수 없음 (ESLint clean)
- [ ] UI 상태 4종 (loading/error/empty/success) 모두 처리
- [ ] 키보드 접근 / focus / aria 점검
- [ ] `<img>`에 `alt`, `width`, `height`, `loading` 지정
- [ ] 폼은 React Hook Form + Zod 사용
- [ ] 서버 데이터는 TanStack Query (직접 `fetch` + `useEffect` 금지)
- [ ] 테스트 포함 (커버리지 기준 충족)
- [ ] Magic number 없음 (상수 사용)
- [ ] 함수 ≤ 50줄, 위치 인자 ≤ 3개
- [ ] Floating promise 없음 (`await` 또는 `void`)
- [ ] Import 그룹 순서 준수
- [ ] 주석은 WHY만 (한국어 우선, TSDoc은 영어 우선)
- [ ] Layering 위반 없음 (features 끼리 직접 import 금지)
