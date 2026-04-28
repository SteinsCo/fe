# Code Style and Conventions

## Core Principles

### Readability First
- Code should be self-documenting
- Clear naming over clever code
- Simplicity over complexity
- Remove unnecessary code

### Minimal Comments
- Only comment WHY, not WHAT
- Code should explain itself through naming
- Remove commented-out code
- Avoid redundant comments

### No Over-Engineering
- Solve current problems, not future ones
- Avoid premature abstraction
- Delete unused code completely
- Keep it simple

## TypeScript Style Guide

### Compiler Settings (non-negotiable)

```json
// tsconfig.json (compilerOptions)
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "exactOptionalPropertyTypes": true,
  "isolatedModules": true,
  "verbatimModuleSyntax": true
}
```

### `any` is Banned

```ts
// ❌ any
function parse(input: any) { return input.id; }

// ✅ unknown + narrow
function parse(input: unknown): string {
  if (typeof input === "object" && input !== null && "id" in input && typeof input.id === "string") {
    return input.id;
  }
  throw new Error("invalid input");
}

// ✅ Better — Zod at the boundary
function parse(input: unknown): { id: string } {
  return ParseSchema.parse(input);
}
```

### `type` vs. `interface`

- Default to `type` for objects, unions, and aliases
- Use `interface` only when you need declaration merging or `extends` chains
- Be consistent within a file

```ts
// ✅
type Manga = { id: string; title: string };
type ReaderState = "idle" | "loading" | "ready" | "error";
type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant: "primary" | "secondary" };
```

### Discriminated Unions for Variants

```ts
// ✅
type Result<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: T };

function render(r: Result<Manga>) {
  switch (r.status) {
    case "loading": return <Spinner />;
    case "error":   return <ErrorView error={r.error} />;
    case "success": return <MangaView data={r.data} />;
  }
}
```

### Type Imports

```ts
// ✅ Type-only import
import { type ReactNode } from "react";
import type { Manga } from "@/features/manga";

// ❌ Mixed value/type import
import { Manga } from "@/features/manga";
```

`verbatimModuleSyntax` enforces this in the compiler.

### Avoid Non-Null Assertions

```ts
// ❌
const el = document.getElementById("root")!;

// ✅
const el = document.getElementById("root");
if (!el) throw new Error("#root not found");
```

Allowed in tests (`test/**`) where the input is guaranteed by the surrounding setup.

## Formatting

1. **Indentation**: 2 spaces (Prettier default for TS/JS/JSX)
2. **Line Length**: max 100 characters (`printWidth: 100`)
3. **Quotes**: double quotes (`singleQuote: false`)
4. **Semicolons**: required
5. **Trailing commas**: all (`trailingComma: "all"`)

```jsonc
// .prettierrc
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxSingleQuote": false
}
```

### Imports — Group and Order

```ts
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

Enforced by `eslint-plugin-import` with this order:
1. Built-in / `react`
2. External packages
3. Internal aliases (`@/...`)
4. Parent / sibling imports
5. CSS / asset imports last

### Blank Lines

- One blank line between import groups
- One blank line between top-level declarations
- No blank line at the start/end of a function body

## Naming Conventions

| Item | Rule | Example |
|------|------|---------|
| Variables / functions | `camelCase` | `chapterCount`, `httpClient`, `fetchManga` |
| Constants | `UPPER_SNAKE_CASE` (module-level immutable) | `MAX_PAGES_PER_CHAPTER`, `DEFAULT_TIMEOUT_MS` |
| Local "constants" | `camelCase` | `const initialValue = ...` |
| React components | `PascalCase` | `MangaCard`, `ChapterReader` |
| Hooks | `useCamelCase` | `useChapterPages`, `useReaderShortcuts` |
| Types / interfaces | `PascalCase` | `Manga`, `ChapterManifest`, `ButtonProps` |
| Type-only generics | Single uppercase or descriptive `PascalCase` | `T`, `TData`, `TError` |
| Enums (avoid) | Use `as const` unions instead | |
| Files (TSX components) | `PascalCase.tsx` | `MangaCard.tsx`, `ChapterReader.tsx` |
| Files (other TS) | `camelCase.ts` | `useChapterPages.ts`, `formatChapterNumber.ts` |
| Test files | `<source>.test.{ts,tsx}` | `MangaCard.test.tsx` |
| CSS Modules | `<Component>.module.css` | `ChapterReader.module.css` |

### Booleans

- Prefix with `is`, `has`, `should`, `can`, `will`
- Examples: `isLoading`, `hasNextPage`, `shouldPrefetch`, `canEdit`

### Event Handlers

- Props: `on<Event>` (`onClick`, `onSubmit`, `onPageChange`)
- Local handlers: `handle<Event>` (`handleSubmit`, `handlePageChange`)

```tsx
function ChapterToolbar({ onPageChange }: Props) {
  const handlePrev = () => onPageChange(currentPage - 1);
  // ...
}
```

## React Conventions

### Functional Components

- Always functional + named exports (default exports only on lazy-loaded pages)
- Destructure props in the parameter list
- Use the `function` keyword (not arrow functions) for top-level components — better stack traces and `displayName`

```tsx
// ✅
export function MangaCard({ manga }: MangaCardProps) {
  return <article>{manga.title}</article>;
}

// ❌ arrow at top level (still allowed for sub-components and callbacks)
export const MangaCard = ({ manga }: MangaCardProps) => <article>{manga.title}</article>;
```

### Hook Rules

- Top of the function, before any conditional return
- Custom hook names start with `use`
- Cleanup in `useEffect` returns when needed
- `useEffect` dependency array: complete and explicit (`react-hooks/exhaustive-deps`)

```tsx
// ✅
useEffect(() => {
  const sub = subscribe(onEvent);
  return () => sub.unsubscribe();
}, [onEvent]);
```

### Conditional Rendering

```tsx
// ✅ Ternary for two outcomes
{isLoading ? <Spinner /> : <Result data={data} />}

// ✅ Early return for many states
if (isPending) return <PageLoading />;
if (isError) return <PageError error={error} />;
return <Content data={data} />;

// ❌ Nested ternaries
{isLoading ? <Spinner /> : isError ? <Err /> : data ? <Result /> : <Empty />}
```

### Lists and Keys

```tsx
// ✅ Stable, unique key
{pages.map((page) => <ReaderPage key={page.id} page={page} />)}

// ❌ Index as key when items can reorder
{pages.map((page, i) => <ReaderPage key={i} page={page} />)}
```

### State

- One `useState` per logically independent piece of state
- Group related state into a `useReducer` when transitions become complex
- Don't store derived values in state — compute them on render

```tsx
// ❌ Derived state in useState
const [pages, setPages] = useState<Page[]>([]);
const [pageCount, setPageCount] = useState(0); // duplicates pages.length

// ✅ Derive
const pageCount = pages.length;
```

### Refs

- `useRef` for DOM nodes and mutable values that don't trigger re-renders
- Forward refs only when the parent legitimately needs DOM access

### Memoization

- Default: don't memoize. Profile first
- `useMemo` for expensive computations or when downstream `React.memo` depends on referential stability
- `useCallback` only for callbacks passed to memoized children or hook deps

## Component Anatomy (Order Inside a File)

```tsx
// 1. Imports (grouped)
import { ... } from "react";
import { ... } from "@/shared/...";

// 2. Constants
const MAX_PAGES_VISIBLE = 20;

// 3. Types
type ChapterReaderProps = { ... };

// 4. Component
export function ChapterReader(props: ChapterReaderProps) {
  // 4a. Hooks (queries, state, refs, derived)
  // 4b. Handlers
  // 4c. Effects
  // 4d. Early returns
  // 4e. Render
}

// 5. Sub-components (small, file-private)
function ReaderToolbar() { ... }

// 6. Helpers (pure, file-private)
function buildKey(p: Page) { ... }
```

## Error Handling

### `try / catch` Patterns

```ts
// ✅ Narrow what you catch
try {
  await login(values);
} catch (error) {
  if (ApiError.is(error)) {
    setError("password", { message: error.message });
    return;
  }
  log.error("unexpected login error", { error });
  throw error;
}
```

### Promise Patterns

```ts
// ✅ async/await
const data = await fetchManga(id);

// ❌ Avoid mixing then/catch with async/await
const data = await fetchManga(id).then((d) => d.data).catch(() => null);

// ❌ Floating promises
fetchManga(id);

// ✅ Either await or `void` it intentionally
void prefetchNext(id);
```

`@typescript-eslint/no-floating-promises` enforces this.

### Error Messages

- Lowercase, no trailing punctuation
- Pattern: `"<verb> <noun> [<id>]: <reason>"`

```ts
throw new Error(`fetch chapter ${chapterId}: ${reason}`);
```

## Function Design

1. **Small Functions**: Max ~50 lines. Extract heavy branches.
2. **Parameter Count**: Max 3 positional params. More → take an `options` object.
3. **No Output Parameters**: Return values; don't mutate inputs.
4. **Pure When Possible**: Make side effects explicit (and rare).
5. **Async by Default for IO**: Never block on `await` inside loops without thought.

```ts
// ✅ Options object
type FetchMangaListParams = { page?: number; pageSize?: number; genre?: string };
function fetchMangaList(params: FetchMangaListParams = {}) { ... }

// ❌ Many positional args
function fetchMangaList(page: number, pageSize: number, genre: string, lang: string) { ... }
```

## Comments Convention

**Language Policy** (matches the backend project):
- **Inline comments**: Korean primary, English technical terms allowed
- **Public API doc comments** (TSDoc): English first, Korean explanation underneath
- **Encoding**: UTF-8

**Principles**:
- Keep comments minimal and essential
- Explain WHY, never WHAT
- Korean for explanations, English for technical terms

### Function Doc (TSDoc, exported)

```ts
/**
 * Fetches the page manifest for a chapter.
 * 주어진 chapter의 page manifest를 조회합니다.
 *
 * Throws `ApiError(category: "not_found")` when the chapter does not exist
 * or has not finished processing.
 *
 * @example
 * const manifest = await fetchChapterPages("ch-1");
 * console.log(manifest.pages.length);
 */
export async function fetchChapterPages(chapterId: string): Promise<ChapterManifest> {
  // ...
}
```

### Inline Comments — Explain Why

```ts
// ✅ Korean WHY
// 다음 페이지를 미리 prefetch하여 reader 체감 latency 감소
queryClient.prefetchQuery({ queryKey: chapterKeys.pages(nextId), queryFn: () => fetchChapterPages(nextId) });

// ✅ Mixed (technical term in English)
// access token이 만료되면 refresh interceptor가 자동으로 재발급
const data = await apiClient.get("me").json();

// ❌ Restating what the code says
// 현재 페이지 인덱스를 1 증가시킨다
const next = current + 1;
```

### TODO Comments

```ts
// TODO(juhy0987): 무한 스크롤 도입 — useInfiniteQuery로 교체 (#42)
// TODO: prefetch hint를 manifest에 포함 (모바일 reader 성능)

// ❌ No context
// TODO: fix this
```

## CSS Conventions

### Tailwind First

- Use Tailwind utility classes for layout, spacing, color, typography
- Use `clsx` + `tailwind-merge` for conditional classes
- Group classes: layout → spacing → typography → color → state

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(...inputs));

<button
  className={cn(
    "inline-flex items-center justify-center rounded-md",
    "px-4 py-2",
    "text-sm font-medium",
    "bg-blue-600 text-white",
    "hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500",
    isLoading && "opacity-50 pointer-events-none",
    className,
  )}
>
  ...
</button>
```

### CSS Modules (when Tailwind is awkward)

- Component-scoped, complex selectors, animations
- File next to the component: `ChapterReader.module.css`
- Class names in `camelCase`

```css
/* ChapterReader.module.css */
.viewport {
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
}
```

### Theming

- Design tokens centralized in `src/shared/styles/tokens.ts` and surfaced as CSS variables on `:root`
- Dark mode toggled with `data-theme="dark"` on `<html>` (read by Tailwind via `darkMode: ["class", "[data-theme=dark]"]`)

## Configuration Files

### YAML / JSON Style

- 2-space indentation
- snake_case keys to match backend (when shared); camelCase otherwise (Vite, ESLint configs)
- Comment non-obvious values

```yaml
# Example shared config (e.g. environment metadata)
api:
  base_url: "https://api.steins.example/api/v1"
  timeout_ms: 15000  # 15s — matches backend handler write timeout
```

## File Organization

### File Naming

- React components: `PascalCase.tsx` (`MangaCard.tsx`)
- Hooks / utility modules: `camelCase.ts` (`useChapterPages.ts`)
- Test files: `<source>.test.{ts,tsx}` (`MangaCard.test.tsx`)
- Assets: `kebab-case` (`manga-default-cover.svg`)
- Style files: match the component (`MangaCard.module.css`)

### File Structure (TS/TSX)

```ts
// 1. Imports (grouped)
// 2. Module-level constants
// 3. Types
// 4. Component or main export
// 5. Sub-components / file-private helpers
```

### Folder Per Component (when it grows)

```
src/shared/ui/Button/
├── Button.tsx
├── Button.module.css
├── Button.stories.tsx       # optional, Storybook
└── index.ts                 # re-exports
```

## Performance Guidelines

### List Virtualization

```tsx
// ✅ For lists > 100 items
import { useVirtualizer } from "@tanstack/react-virtual";

const v = useVirtualizer({ count: items.length, getScrollElement: () => parentRef.current, estimateSize: () => 80 });
```

### Image Loading

```tsx
// ✅
<img
  src={page.url}
  width={page.width}
  height={page.height}
  loading={page.index === 1 ? "eager" : "lazy"}
  decoding="async"
  alt={`Page ${page.index}`}
/>
```

### Avoid Re-Renders

- Lift static config out of the component (or wrap in `useMemo` with `[]`)
- Co-locate state with the component that uses it
- Split contexts so unrelated consumers don't re-render together
- Reach for `React.memo` only when the profiler proves it pays off

## Anti-Patterns

### 1. Magic Numbers

```ts
// ❌
if (pages.length > 500) return error;

// ✅
const MAX_PAGES_PER_CHAPTER = 500;
if (pages.length > MAX_PAGES_PER_CHAPTER) return error;
```

### 2. Deeply Nested JSX

```tsx
// ❌
<div>{a && <div>{b && <div>{c && <div>...</div>}</div>}</div>}</div>

// ✅ Early return + extraction
if (!a || !b || !c) return null;
return <Component />;
```

### 3. `useEffect` Misuse

```tsx
// ❌ Computing derived values in effect
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// ✅ Derive on render
const fullName = `${first} ${last}`;
```

### 4. Floating Promises

```ts
// ❌
mutate(input);

// ✅
await mutate(input);
// or
void mutate(input);
```

### 5. Inline Object/Array Props That Defeat Memoization

```tsx
// ❌ New reference every render — defeats child memo
<List items={data ?? []} />

// ✅ Stable reference when needed
const items = useMemo(() => data ?? [], [data]);
<List items={items} />
```

### 6. Import from Deep Feature Paths

```ts
// ❌
import { MangaCard } from "@/features/manga/components/MangaCard";

// ✅
import { MangaCard } from "@/features/manga";
```

### 7. Storing Tokens in `localStorage`

```ts
// ❌
localStorage.setItem("access_token", token);

// ✅ in-memory store + HttpOnly refresh cookie
authStore.getState().setAccessToken(token);
```

## Logging

### Logger API

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

### Logging Rules

- No raw `console.log` in committed code (`no-console` ESLint rule, allow `warn`/`error`)
- Always include structured fields, never string concatenation
- Field keys in `snake_case` to match backend logs (cross-system grep)
- See [04-error-handling.md](04-error-handling.md) → "Field Naming"

## Git Commit Conventions

### Commit Message Format

```
[{카테고리}]: {변경 내용}
```

### Categories

- **FEAT**: 기능 구현 및 추가
- **FIX**: 버그 수정
- **REFAC**: 구조 변경, 리팩토링
- **DOCS**: 문서 작업, 주석, 프롬프트 변경
- **CHORE**: 빌드·CI·도구·의존성 등 잡무 (코드 외 부가 작업)

### 작성 규칙

> **⚠️ 모든 커밋 메시지는 한국어로 작성**

1. 언어: 반드시 한국어 (영어 사용 금지)
2. 형식: 명사형 종결 (예: "구현", "수정", "추가")
3. 내용: 변경 사항의 전체적인 요약 + 모듈별 변경점 명시

### Examples

**기능 구현 및 추가:**
```
[FEAT]: chapter reader 페이지 manifest 로딩 구현

- ChapterReaderPage 라우트 추가
- useChapterPages TanStack Query 훅 작성
- PagePrefetcher 컴포넌트로 next-3 이미지 prefetch
```

```
[FEAT]: TanStack Query 기반 manga catalog 페이지 구현

- useMangaList 훅 작성 (genre/status 필터 지원)
- MangaCard 컴포넌트 + MSW 핸들러 추가
- 무한 스크롤은 후속 이슈로 분리
```

**버그 수정:**
```
[FIX]: reader keyboard shortcut 모달 열림 상태에서 충돌 수정

- useReaderShortcuts에서 Dialog open 시 listener 비활성화
- ARIA-modal 컨텍스트 감지 로직 추가
```

**구조 변경 및 리팩토링:**
```
[REFAC]: features/reader 디렉토리 재구성

- components/hooks/api 분리
- 공용 prefetcher를 shared가 아닌 reader 내부로 이동
```

**문서 작업:**
```
[DOCS]: Component 구현 룰셋 (02-component-implementation.md) 작성

- TanStack Query / Zustand 패턴 정리
- 라우팅 / 폼 / 인증 섹션 추가
```

**잡무:**
```
[CHORE]: ESLint v9 / typescript-eslint v8 업그레이드

- flat config 마이그레이션
- jsx-a11y / import 룰 재구성
```

### Branch Naming Convention

```
{카테고리}/#{이슈번호}/{핵심-변경-대상-요약}
```

#### 브랜치 대분류

- **feature/**: 새로운 기능 구현 및 추가 (FEAT 커밋 대응)
- **fix/**: 버그 수정 (FIX 커밋 대응)
- **refactor/**: 구조 변경 및 리팩토링 (REFAC 커밋 대응)
- **docs/**: 문서 작업 (DOCS 커밋 대응)
- **chore/**: 빌드·CI·도구 등 잡무 (CHORE 커밋 대응)

#### 브랜치명 작성 규칙

1. **형식**: `{카테고리}/#{이슈번호}/{핵심-변경-대상-요약}`
2. **이슈번호**: GitHub 이슈 번호를 `#` 접두사와 함께 표기 (예: `#15`)
3. **핵심 변경 대상 요약**: 영문 소문자, 단어 구분은 하이픈(-), 30자 이내
4. **내용**: 변경 대상 모듈/컴포넌트명 중심으로 간결하게 표현

#### Branch Name Examples

```bash
feature/#15/chapter-reader-page
feature/#16/manga-catalog-list
feature/#17/library-shelves
feature/#18/auth-login-form
feature/#19/reader-keyboard-shortcuts
feature/#20/tanstack-query-setup

fix/#7/reader-shortcut-modal-conflict
fix/#9/manga-card-image-cls

refactor/#4/features-reader-restructure
refactor/#8/api-client-error-mapper

docs/#2/component-implementation-rules
docs/#9/git-conventions

chore/#3/eslint-v9-upgrade
chore/#5/vite-cache-tuning
```

## File Organization

### File Naming Recap

- Components: `PascalCase.tsx`
- Hooks / utilities: `camelCase.ts`
- Tests: `<source>.test.{ts,tsx}`
- Styles: `<Component>.module.css`
- Assets: `kebab-case`

### Public Module Surface

```ts
// src/features/manga/index.ts
export { MangaCard } from "./components/MangaCard";
export { MangaHeader } from "./components/MangaHeader";
export { useMangaDetail } from "./api/useMangaDetail";
export { useMangaList } from "./api/useMangaList";
export type { Manga } from "./schemas/manga";
```

- Cross-feature consumers MUST import from the index, never deep paths
- ESLint `import/no-restricted-paths` enforces the layering boundary

## Documentation

### Language Requirements

**Code Documentation (TSDoc)**:
- **Primary**: English
- **Secondary**: Korean
- **Format**: English first, then Korean explanation
- **Encoding**: UTF-8

**Documentation Files** (`docs/`):
- **MUST** write English first; Korean translation in a parallel directory
- **Directory structure**:
  ```
  docs/
  ├── en/         # English (source of truth)
  │   ├── README.md
  │   ├── architecture.md
  │   └── components.md
  └── ko/         # Korean translation
      ├── README.md
      ├── architecture.md
      └── components.md
  ```
- **Naming**: `docs/en/<file>.md` and `docs/ko/<file>.md`
- **Sync**: Keep both versions in lockstep; commit message marks the scope: `[DOCS]: [기능명] 문서 업데이트 (en+ko)`

**README Files** (root level):
- Root `README.md` in **English**
- Link to Korean: `docs/ko/README.md`
- Language selector at the top:
  ```markdown
  # Steins Frontend

  **[한국어](docs/ko/README.md)** | English
  ```

### Component / Module Documentation

```ts
/**
 * Renders a single chapter as a sequence of pages.
 * chapter를 페이지 시퀀스로 렌더링하는 reader 컴포넌트.
 *
 * Receives a fully resolved manifest — fetching is the page component's
 * responsibility. Supports paged and vertical-scroll modes via the reader
 * settings store.
 *
 * @example
 * <ChapterReader manifest={manifest} />
 */
export function ChapterReader(props: ChapterReaderProps) { ... }
```

### README Structure

**README.md** (Root, English):
```markdown
# Steins Frontend

**[한국어](docs/ko/README.md)** | English

> Web client for the Steins manga reading platform

## Overview

A React + TypeScript SPA that delivers the Steins reader experience:
catalog browsing, immersive chapter reading, personal libraries, and search.

## Tech Stack

- React 18 + TypeScript 5
- Vite 5 (build & dev server)
- React Router v6 (routing)
- TanStack Query v5 (server state)
- Zustand (client state)
- Tailwind CSS (styling)
- Vitest + React Testing Library + Playwright (testing)

## Getting Started

### Requirements
- Node.js 20+
- pnpm 9+

### Installation
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Documentation

**English**:
- [Architecture](docs/en/architecture.md)
- [Components](docs/en/components.md)
- [Code Style](docs/en/code-style.md)

**한국어**:
- [아키텍처](docs/ko/architecture.md)
- [컴포넌트](docs/ko/components.md)
- [코드 스타일](docs/ko/code-style.md)

## License
MIT
```

### Update Policy

When updating documentation:
1. Update the English version first
2. Update the Korean translation to match
3. Mark the commit message: `[DOCS]: [기능명] 문서 업데이트 (en+ko)`

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] No `any` (use `unknown` + narrow, or Zod)
- [ ] No `console.log` (use `log.*` helpers)
- [ ] No unused imports / variables (ESLint will flag)
- [ ] All UI states handled (loading, error, empty, success)
- [ ] Keyboard accessible (Tab, Enter/Space on interactive elements)
- [ ] Visible focus indicator
- [ ] `<img>` has `alt`, `width`, `height`, `loading`
- [ ] Forms validated with Zod + RHF
- [ ] Server data via TanStack Query (no `useEffect` + `fetch`)
- [ ] Tests cover happy path + at least one error path
- [ ] No magic numbers — extract constants
- [ ] Functions ≤ 50 lines, ≤ 3 positional params
- [ ] No floating promises (`await` or `void`)
- [ ] Imports follow group order
- [ ] Comments explain WHY, never WHAT
- [ ] Korean in inline comments / commit messages; English in TSDoc primary
