# Component, Routing, and API Integration Standards

## Layering Inside a Feature

Every feature module under `src/features/<domain>/` follows the same internal layering:

```
components/   ← presentational + container components for the domain
hooks/        ← domain hooks (filtering, derived state, key handlers)
api/          ← TanStack Query hooks + fetcher functions + query keys
schemas/      ← Zod schemas + inferred TS types
index.ts      ← Public surface (re-exports)
```

- **Components** consume hooks; they MUST NOT call `fetch` directly
- **API hooks** (`useXxxQuery`, `useXxxMutation`) are the only things that touch `apiClient`
- **Schemas** define request/response shapes — types are inferred via `z.infer<...>`, not hand-written
- **index.ts** re-exports only what other layers may import — keep it small

## Component Patterns

### Functional Components Only

```tsx
// ✅ Functional + named export
export function MangaCard({ manga }: MangaCardProps) {
  return <article>{manga.title}</article>;
}

// ❌ Default exports (harder to grep, awkward auto-imports)
export default function MangaCard(...) {}

// ❌ Class components
```

Exceptions: `React.lazy()` requires a default export from the *page* file:
```tsx
// src/pages/chapter/ChapterReaderPage.tsx
export default function ChapterReaderPage() { ... }
```

### Component Anatomy

```tsx
// 1. Imports (grouped; see code-style.md)
import { type ReactNode } from "react";

import { clsx } from "clsx";

import { useChapterPages } from "@/features/reader/api/useChapterPages";
import { Button } from "@/shared/ui/Button";

// 2. Types — props first, helper types after
type ChapterReaderProps = {
  chapterId: string;
  onChapterEnd?: () => void;
  className?: string;
};

// 3. Component
export function ChapterReader({ chapterId, onChapterEnd, className }: ChapterReaderProps) {
  const { data } = useChapterPages(chapterId);
  // ... hooks (queries, state, refs)
  // ... derived values
  // ... handlers
  // ... early returns
  // ... render
  return <section className={clsx("reader", className)}>{/* ... */}</section>;
}

// 4. Sub-components (if small; otherwise their own file)
function ReaderToolbar() { ... }
```

### Props Conventions

- Destructure props in the parameter list; default values inline
- Mark optional props with `?:`; never use `undefined` in the type
- Prefer `children: ReactNode` over render props; expose composition slots when flexibility is needed
- For event handlers use the `on<Event>` prefix (`onSubmit`, `onPageChange`)

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

export function Button({ variant = "primary", size = "md", isLoading = false, children, onClick }: ButtonProps) {
  // ...
}
```

### Composition Over Configuration

```tsx
// ✅ Composition
<Card>
  <Card.Header>
    <Card.Title>{manga.title}</Card.Title>
  </Card.Header>
  <Card.Body>{manga.description}</Card.Body>
</Card>

// ❌ Mega-prop component
<Card title={manga.title} description={manga.description} headerVariant="..." />
```

### Hooks Rules

- Hooks at the top of the function, before any conditional returns
- Hook names start with `use`; only call hooks from React components or other hooks
- Custom hooks live next to their feature; cross-feature hooks live in `src/shared/hooks/`
- Memoize derived values with `useMemo` only when measurable; default to recomputation

### Pages vs. Features vs. UI Primitives

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| **Page** (`src/pages/*Page.tsx`) | Read route params, call feature hooks, choose layout, handle route-level error/loading | `ChapterReaderPage`, `MangaDetailPage` |
| **Feature component** (`src/features/<d>/components/`) | Domain UI that knows the shape of the domain | `ChapterReader`, `MangaCard`, `LibraryShelf` |
| **UI primitive** (`src/shared/ui/`) | Generic, presentational, domain-agnostic | `Button`, `Dialog`, `Spinner`, `Toast` |

A feature component MAY use UI primitives. A UI primitive MUST NOT depend on any feature.

## Routing

### Route Table Structure

```tsx
// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";

const ChapterReaderPage = lazy(() => import("@/pages/chapter/ChapterReaderPage"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "manga/:mangaId", element: <MangaDetailPage /> },
      { path: "manga/:mangaId/chapter/:chapterId", element: <ChapterReaderPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "library", element: <LibraryPage /> },
          { path: "me", element: <ProfilePage /> },
        ],
      },
      { path: "auth/login", element: <LoginPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
```

### Routing Conventions

- Routes defined centrally in `src/app/router.tsx`; pages are imported there only
- Lazy-load anything not on the catalog landing path
- Wrap auth-required routes with `<RequireAuth>` (redirects to `/auth/login?next=...`)
- `errorElement` MUST be set on the root route (and may be overridden per branch)
- Use `<Suspense fallback={<PageLoading />}>` outside lazy boundaries

### Route Parameters

```tsx
import { useParams } from "react-router-dom";

export function ChapterReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  if (!chapterId) throw new Response("missing chapterId", { status: 400 });
  // ...
}
```

- Always destructure with a typed generic
- Treat missing required params as a routing bug — throw a `Response` so the route error boundary handles it

### Search Params

```tsx
import { useSearchParams } from "react-router-dom";

const [params, setParams] = useSearchParams();
const query = params.get("q") ?? "";

const onChange = (next: string) => {
  setParams((prev) => {
    const p = new URLSearchParams(prev);
    if (next) p.set("q", next);
    else p.delete("q");
    return p;
  });
};
```

- Search params are **the** state for filterable lists — never duplicate into `useState`
- Debounce input → URL with `useDebouncedCallback` (300ms default)

## API Client

### Client Setup

```ts
// src/shared/api/client.ts
import ky from "ky";

import { env } from "@/app/env";
import { authStore } from "@/shared/auth/store";
import { ApiError } from "./error";

export const apiClient = ky.create({
  prefixUrl: env.VITE_API_BASE_URL,
  timeout: 15_000,
  retry: { limit: 0 },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = authStore.getState().accessToken;
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        request.headers.set("X-Request-Id", crypto.randomUUID());
      },
    ],
    beforeError: [
      async (error) => {
        return ApiError.fromKyError(error);
      },
    ],
  },
});
```

### Typed Fetcher Functions

Each feature exposes thin fetcher functions colocated with the query hook:

```ts
// src/features/manga/api/fetchMangaList.ts
import { apiClient } from "@/shared/api/client";
import { MangaListResponseSchema, type MangaListResponse } from "../schemas/manga";

export type MangaListParams = {
  page?: number;
  pageSize?: number;
  genre?: string;
  status?: "ongoing" | "completed" | "hiatus";
  language?: string;
};

export async function fetchMangaList(params: MangaListParams = {}): Promise<MangaListResponse> {
  const json = await apiClient.get("manga", { searchParams: cleanParams(params) }).json();
  return MangaListResponseSchema.parse(json);
}
```

### Schema Validation

```ts
// src/features/manga/schemas/manga.ts
import { z } from "zod";

export const MangaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  cover_url: z.string().url(),
  authors: z.array(z.string()),
  genres: z.array(z.string()),
  status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
  language: z.string().length(2),
  reading_dir: z.enum(["ltr", "rtl", "vertical"]),
  view_count: z.number().int().nonnegative(),
  rating: z.number().min(0).max(10),
  published_at: z.string().datetime(),
});

export type Manga = z.infer<typeof MangaSchema>;

export const MangaListResponseSchema = z.object({
  data: z.array(MangaSchema),
  meta: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    next_cursor: z.string().nullable().optional(),
  }),
});

export type MangaListResponse = z.infer<typeof MangaListResponseSchema>;
```

Rules:
- API responses use `snake_case` (server contract); types preserve that. Convert to `camelCase` only at the component boundary if needed (rare)
- `z.infer<typeof Schema>` is the **only** source of types for API data — never hand-write a duplicate `interface`
- Schema files live under `src/features/<domain>/schemas/`

## Server State with TanStack Query

### Query Keys

Centralize query key factories per feature:

```ts
// src/features/manga/api/keys.ts
export const mangaKeys = {
  all: ["manga"] as const,
  lists: () => [...mangaKeys.all, "list"] as const,
  list: (params: MangaListParams) => [...mangaKeys.lists(), params] as const,
  details: () => [...mangaKeys.all, "detail"] as const,
  detail: (id: string) => [...mangaKeys.details(), id] as const,
};
```

- Hierarchical so `invalidateQueries({ queryKey: mangaKeys.lists() })` covers all list variants
- All keys exported from a single `keys.ts` per feature

### Query Hooks

```ts
// src/features/manga/api/useMangaList.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchMangaList, type MangaListParams } from "./fetchMangaList";
import { mangaKeys } from "./keys";

export function useMangaList(params: MangaListParams) {
  return useQuery({
    queryKey: mangaKeys.list(params),
    queryFn: () => fetchMangaList(params),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
```

### Mutation Hooks

```ts
// src/features/library/api/useAddToLibrary.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/client";
import { libraryKeys } from "./keys";

export function useAddToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { mangaId: string; shelf: string }) =>
      apiClient.post("me/library", { json: input }).json(),
    onSuccess: (_, { mangaId }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.detail(mangaId) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.lists() });
    },
  });
}
```

### Optimistic Updates

Use for high-frequency, low-risk mutations (reading progress, like toggles):

```ts
useMutation({
  mutationFn: (input: ProgressInput) => apiClient.put(`me/progress/${input.mangaId}`, { json: input }).json(),
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey: progressKeys.detail(input.mangaId) });
    const prev = queryClient.getQueryData(progressKeys.detail(input.mangaId));
    queryClient.setQueryData(progressKeys.detail(input.mangaId), input);
    return { prev };
  },
  onError: (_err, input, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(progressKeys.detail(input.mangaId), ctx.prev);
  },
  onSettled: (_data, _err, input) => {
    queryClient.invalidateQueries({ queryKey: progressKeys.detail(input.mangaId) });
  },
});
```

### Default QueryClient Config

```ts
// src/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (ApiError.is(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});
```

## Client State with Zustand

### When to Use Zustand

- Reader settings (direction, image variant, brightness)
- Theme (light/dark)
- Auth tokens (in-memory)
- UI shell state shared across many routes (e.g. sidebar collapsed)

### Store Shape

```ts
// src/features/reader/store/readerSettings.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ImageVariant = "thumbnail" | "preview" | "web";
type ReadingDir = "ltr" | "rtl" | "vertical";

type ReaderSettingsState = {
  variant: ImageVariant;
  direction: ReadingDir;
  brightness: number;
  setVariant: (v: ImageVariant) => void;
  setDirection: (d: ReadingDir) => void;
  setBrightness: (n: number) => void;
};

export const useReaderSettings = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      variant: "preview",
      direction: "rtl",
      brightness: 1.0,
      setVariant: (variant) => set({ variant }),
      setDirection: (direction) => set({ direction }),
      setBrightness: (brightness) => set({ brightness }),
    }),
    { name: "steins:reader-settings", version: 1 },
  ),
);
```

### Selector Hooks

Always select narrowly to avoid unnecessary re-renders:

```tsx
// ✅ Selector — re-renders only when `direction` changes
const direction = useReaderSettings((s) => s.direction);

// ❌ Whole store — re-renders on every state change
const settings = useReaderSettings();
```

## Forms (React Hook Form + Zod)

### Login Form Example

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("must be a valid email"),
  password: z.string().min(10, "must be at least 10 characters"),
});
type LoginInput = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });
  const login = useLogin();

  const onSubmit = handleSubmit(async (values) => {
    await login.mutateAsync(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <label>
        <span>Email</span>
        <input type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </label>
      <label>
        <span>Password</span>
        <input type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </label>
      <Button type="submit" isLoading={isSubmitting}>Sign in</Button>
    </form>
  );
}
```

### Form Conventions

- One Zod schema per form, colocated with the component
- Always pair `<input>` with a `<label>` (visible or `sr-only`)
- Mark errors via `aria-invalid` and `<p role="alert">`
- `autoComplete` set on every relevant field
- Disable the submit button via `formState.isSubmitting`, not local state
- Server-side errors merged into the form via `setError`

## Authentication

### Token Storage

```ts
// src/shared/auth/store.ts
import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

export const authStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
}));
```

- Access token: in memory only (Zustand store, no `persist`)
- Refresh token: HttpOnly cookie set by the backend
- Never write tokens to `localStorage` or `sessionStorage`

### Refresh Flow

```ts
// src/shared/api/refreshInterceptor.ts
let refreshPromise: Promise<string> | null = null;

async function refresh(): Promise<string> {
  refreshPromise ??= (async () => {
    const res = await fetch(`${env.VITE_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      authStore.getState().setAccessToken(null);
      throw new Error("refresh failed");
    }
    const { access_token } = await res.json();
    authStore.getState().setAccessToken(access_token);
    return access_token;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}
```

- Concurrent 401s share a single in-flight refresh
- On refresh failure → clear tokens and redirect to `/auth/login?next=...`

### Route Guard

```tsx
// src/features/auth/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authStore } from "@/shared/auth/store";

export function RequireAuth() {
  const accessToken = authStore((s) => s.accessToken);
  const location = useLocation();
  if (!accessToken) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
```

## Reader Components

### Page Manifest Renderer

```tsx
// src/features/reader/components/ChapterReader.tsx
type Props = { manifest: ChapterManifest };

export function ChapterReader({ manifest }: Props) {
  const direction = useReaderSettings((s) => s.direction);
  const variant = useReaderSettings((s) => s.variant);

  return (
    <section data-testid="reader" data-direction={direction}>
      {manifest.pages.map((page) => (
        <ReaderPage key={page.index} page={page} variant={variant} />
      ))}
      <PagePrefetcher manifest={manifest} ahead={3} />
    </section>
  );
}
```

### Reader Conventions

- The reader MUST receive a manifest that already includes `width` / `height` per page → use them to reserve aspect-ratio space and avoid CLS
- The reader supports keyboard nav: `←` `→` (paged), `j` `k` `Space` (scroll). Use a `useReaderShortcuts(refs)` hook
- Image element uses `loading="lazy"` except for the first page (`loading="eager"` and `fetchpriority="high"`)
- Use `<picture>` to deliver WebP with a JPEG fallback when both keys exist in the manifest
- Off-screen pages beyond ±5 in vertical-scroll mode are unmounted to free memory

### Prefetcher

```tsx
// src/features/reader/components/PagePrefetcher.tsx
import { useEffect } from "react";

export function PagePrefetcher({ manifest, ahead }: { manifest: ChapterManifest; ahead: number }) {
  useEffect(() => {
    const upcoming = manifest.pages.slice(0, ahead);
    const links = upcoming.map((p) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "image";
      link.href = p.url;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, [manifest, ahead]);
  return null;
}
```

Plus a TanStack Query prefetch for the next chapter manifest:
```ts
queryClient.prefetchQuery({ queryKey: chapterKeys.pages(nextChapterId), queryFn: () => fetchChapterPages(nextChapterId) });
```

## Image Delivery

### Variant Selection

```ts
function pickVariant(viewportWidth: number): ImageVariant {
  if (viewportWidth < 480) return "thumbnail";
  if (viewportWidth < 1024) return "preview";
  return "web";
}
```

Or driven by `srcset`:
```tsx
<img
  src={page.urls.preview}
  srcSet={`${page.urls.thumbnail} 256w, ${page.urls.preview} 640w, ${page.urls.web} 1280w`}
  sizes="(max-width: 480px) 100vw, (max-width: 1024px) 80vw, 1280px"
  width={page.width}
  height={page.height}
  alt={`Page ${page.index}`}
  loading={page.index === 1 ? "eager" : "lazy"}
  decoding="async"
/>
```

### Rules

- Always set `width` and `height` to lock the aspect ratio
- Always set `alt` (page index, chapter title) — never empty
- `loading="lazy"` for non-first images
- `decoding="async"` on every `<img>`

## Accessibility

### Baseline Requirements

| Concern | Rule |
|---------|------|
| Keyboard | Every interactive element reachable with Tab; focus order matches visual order |
| Focus | Visible focus ring on every interactive element |
| ARIA | Use semantic HTML first (`<button>`, `<a>`, `<nav>`); reach for ARIA only when semantics aren't enough |
| Labels | Every `<input>` has a `<label>` (visible or `sr-only`) |
| Live regions | Toasts and async errors announced via `aria-live="polite"` |
| Color | WCAG AA contrast (≥ 4.5:1 for body text) |
| Motion | Respect `prefers-reduced-motion` for animations |

### Patterns

```tsx
// ✅ Semantic
<button onClick={onSave}>Save</button>

// ❌ Anti-pattern
<div onClick={onSave}>Save</div>
```

```tsx
// ✅ Visible focus
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">…</button>
```

```tsx
// Reduced motion
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
```

### A11y Testing
- Each new component requires at least one RTL test that asserts a labeled, keyboard-reachable role
- `jest-axe` runs in component tests for color/aria smoke checks
- Playwright runs `@axe-core/playwright` on key pages in CI

## Code Splitting

```tsx
// src/app/router.tsx
const ChapterReaderPage = lazy(() => import("@/pages/chapter/ChapterReaderPage"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
```

- Each page is its own chunk by default
- Heavy feature modules can be split further (e.g. reader settings panel)
- Wrap lazy boundaries in `<Suspense fallback={<PageLoading />}>`

## Public Surface (`index.ts`)

```ts
// src/features/manga/index.ts
export { MangaCard } from "./components/MangaCard";
export { MangaHeader } from "./components/MangaHeader";
export { useMangaDetail } from "./api/useMangaDetail";
export { useMangaList } from "./api/useMangaList";
export type { Manga, MangaListResponse } from "./schemas/manga";
```

- Only re-export what other layers may import
- Internal helpers stay un-exported
- Pages and other features import from `@/features/manga` (the index), never from deep paths

## Repository / Service Patterns — Frontend Adaptation

The backend uses handler → service → repository. The frontend equivalent:

| Backend | Frontend |
|---------|----------|
| Handler | Page component |
| Service | Feature hook (`useChapterReader`) |
| Repository | API hook (`useChapterPages`) |

Pages call feature hooks. Feature hooks compose API hooks and client state. API hooks talk to the API client. Pages MUST NOT call `apiClient` directly.

```tsx
// ✅ Page → feature hook → API hook
function ChapterReaderPage() {
  const { chapterId = "" } = useParams<{ chapterId: string }>();
  const { manifest, prefetchNext } = useChapterReader(chapterId);
  return <ChapterReader manifest={manifest} onEnd={prefetchNext} />;
}

// ❌ Page calling API directly
function ChapterReaderPage() {
  const { data } = useQuery({ queryFn: () => apiClient.get(`/chapters/${id}/pages`).json() });
}
```
