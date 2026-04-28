# Architecture and Design Principles

## Core Architecture

### System Overview
- **Purpose**: Web frontend for the Steins manga reading platform
- **Initial Scope**: Catalog browsing, chapter reading, user library, search, account management
- **Design Philosophy**: Reader-first UX, type-safe data flow, accessible by default, fast on mobile

### Architectural Layers

```
┌─────────────────────────────────────────┐
│     Browser (User Agent)                │
├─────────────────────────────────────────┤
│     App Shell  (entry, providers)       │
│     - Router, QueryClient, Theme        │
├─────────────────────────────────────────┤
│     Pages  (route-level views)          │
│     - One file per route, thin glue     │
├─────────────────────────────────────────┤
│     Features  (domain modules)          │
│     - Components, hooks, API, schemas   │
│     - manga / chapter / reader / ...    │
├─────────────────────────────────────────┤
│     Shared  (cross-feature primitives)  │
│     - UI primitives, utilities, client  │
├─────────────────────────────────────────┤
│     HTTP API (Steins backend)           │
└─────────────────────────────────────────┘
```

## Design Principles

### 1. Modularity
- Each domain (manga, chapter, reader, library, user, search) MUST be a separate feature module under `src/features/`
- Features expose a small public surface — internal helpers stay private inside the feature
- UI primitives in `src/shared/ui/` are domain-agnostic; never import from `src/features/` into `src/shared/`

### 2. Type Safety
- TypeScript `strict` mode enforced project-wide
- API responses validated by Zod schemas at the network boundary
- No `any`; prefer `unknown` and narrow with type guards or schema parsing
- Discriminated unions for view models with multiple variants

### 3. Server State vs. Client State
- API-derived data lives in TanStack Query — never copied into Zustand or component state
- Client-only state (reader direction, theme, modal toggles) lives in Zustand or local `useState`
- URL is the source of truth for navigation state — read route params, never mirror them locally

### 4. Reader-First Performance
- Reader path is lazy-loaded in its own bundle chunk
- Image manifest prefetched on chapter card hover/focus
- Next 3 page images prefetched while the user reads the current page
- Layout reservations from manifest dimensions prevent CLS

### 5. Accessibility
- Every interactive element keyboard reachable (no `onClick` on `<div>`)
- Visible focus indicator preserved (no global `outline: none`)
- Color contrast WCAG AA minimum
- Reader supports `←` `→` `j` `k` `Space` keyboard controls

## Current Implementation Status

### 📋 Planned (v0.1.0 — initial release)
- **Vite + React 18** SPA with TypeScript 5
- **React Router v6** with route-level lazy loading
- **TanStack Query v5** for server state, caching, and prefetching
- **Zustand** for client state (reader settings, theme)
- **Tailwind CSS** for styling, with CSS Modules where component-scoped CSS is needed
- **React Hook Form + Zod** for forms and validation
- **ky** (or thin `fetch` wrapper) as the HTTP client
- **Vitest + React Testing Library + MSW** for unit/integration tests
- **Playwright** for end-to-end tests on critical paths
- **ESLint + Prettier** for code quality
- **Sentry** (or equivalent) for production error reporting
- **Web Vitals** beacon for RUM

### 🔮 Later
- React Server Components (if/when migrating to a meta-framework)
- Service Worker / offline reading cache
- Push notifications for new chapters
- Reader analytics dashboard
- Native-app-friendly endpoints (cursor pagination, ETags) — coordinated with backend
- Internationalization beyond ko/en (zh, ja)

## Directory Structure

The codebase follows a **Feature-Sliced inspired** layout:

```
fe/
├── public/                      # Static assets served as-is
│   ├── favicon.svg
│   └── robots.txt
│
├── src/
│   ├── app/                     # App-level wiring (entry-point composition)
│   │   ├── App.tsx              # Root component
│   │   ├── router.tsx           # Route table + lazy imports
│   │   ├── providers.tsx        # QueryClient, Theme, Toast, ErrorBoundary
│   │   └── env.ts               # Validated runtime env (import.meta.env)
│   │
│   ├── pages/                   # Route-level pages (thin glue)
│   │   ├── catalog/
│   │   │   └── CatalogPage.tsx
│   │   ├── manga/
│   │   │   └── MangaDetailPage.tsx
│   │   ├── chapter/
│   │   │   └── ChapterReaderPage.tsx
│   │   ├── library/
│   │   │   └── LibraryPage.tsx
│   │   ├── search/
│   │   │   └── SearchPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── error/
│   │       ├── NotFoundPage.tsx
│   │       └── RouteErrorPage.tsx
│   │
│   ├── features/                # Domain modules (the bulk of the app)
│   │   ├── manga/
│   │   │   ├── api/             # Query/mutation hooks, fetchers, keys
│   │   │   ├── components/      # Domain components (MangaCard, MangaHeader, ...)
│   │   │   ├── hooks/           # Domain hooks (useMangaFilters, ...)
│   │   │   ├── schemas/         # Zod schemas + inferred types
│   │   │   └── index.ts         # Public surface (re-exports)
│   │   ├── chapter/
│   │   ├── reader/              # Page renderer, prefetcher, key handlers
│   │   ├── library/             # Shelves, bookmarks, progress
│   │   ├── search/
│   │   ├── auth/                # Login, register, token refresh
│   │   └── user/                # Profile, preferences
│   │
│   ├── shared/                  # Cross-feature primitives
│   │   ├── ui/                  # Generic, presentational components
│   │   │   ├── Button/
│   │   │   ├── Dialog/
│   │   │   ├── Input/
│   │   │   ├── Spinner/
│   │   │   ├── Toast/
│   │   │   └── feedback/        # PageLoading, PageError, EmptyState
│   │   ├── api/
│   │   │   ├── client.ts        # ky/fetch wrapper, auth interceptor
│   │   │   ├── error.ts         # ApiError class + parser
│   │   │   └── types.ts         # Shared envelope types
│   │   ├── auth/                # Token store, refresh interceptor
│   │   ├── hooks/               # useDebounce, useMediaQuery, useEventListener
│   │   ├── lib/                 # Pure utilities (dates, formatters, urls)
│   │   ├── config/              # Constants, query keys roots, route paths
│   │   ├── styles/              # Tailwind base, theme tokens
│   │   └── i18n/                # Translation strings (ko, en)
│   │
│   ├── main.tsx                 # Vite entry point
│   └── vite-env.d.ts            # Vite ambient types
│
├── test/                        # Mirrors src/ — test files only
│   ├── pages/
│   ├── features/
│   ├── shared/
│   ├── setup.ts                 # Vitest setup (jest-dom, MSW server)
│   └── utils/
│       ├── render.tsx           # renderWithProviders helper
│       └── handlers.ts          # Default MSW handlers
│
├── e2e/                         # Playwright tests
│   ├── fixtures/
│   ├── reader.spec.ts
│   └── auth.spec.ts
│
├── docs/
│   ├── en/                      # English docs (source of truth)
│   └── ko/                      # Korean translation
│
├── .claude/                     # Claude AI development rules
│   └── rules/
├── .github/
├── index.html                   # Vite HTML entry
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── .prettierrc
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### Directory Purposes

**`src/app/`**: Application composition root.
- Wires the QueryClient, Router, Theme provider, ErrorBoundary, and Toaster
- The only place that imports from every other layer
- Adding a new global concern (analytics, feature flags) starts here

**`src/pages/`**: Route-level components.
- Each page corresponds to a route in `src/app/router.tsx`
- Pages are thin: read params, call feature hooks, render feature components
- Pages own loading/error/empty states for the route as a whole

**`src/features/<domain>/`**: Domain modules.
- Self-contained: API hooks, components, helpers, schemas
- Public surface re-exported via `index.ts` (only what other layers may import)
- Cross-feature imports are flagged in code review — prefer lifting shared code to `src/shared/`

**`src/shared/`**: Cross-feature primitives.
- Generic UI components (Button, Dialog, Input)
- HTTP client and auth plumbing
- Utility functions, hooks, types
- **MUST NOT** import from `src/features/` or `src/pages/` (one-way dependency)

**`test/`**: Test files.
- Mirrors `src/` — `src/features/reader/...` → `test/features/reader/...`
- Vitest setup file (`test/setup.ts`) loads jest-dom matchers and MSW

**`e2e/`**: Playwright end-to-end tests for critical user paths.

### Layering Rules

```
app  →  pages  →  features  →  shared
                     ↓
                   shared
```

| From → To | Allowed? |
|-----------|----------|
| `app` → anything | ✅ |
| `pages/*` → `features/*` | ✅ |
| `pages/*` → `shared/*` | ✅ |
| `features/<a>` → `features/<b>` | ❌ (lift to `shared/` or compose at `pages/`) |
| `features/*` → `shared/*` | ✅ |
| `shared/*` → `features/*` | ❌ |
| `shared/*` → `pages/*` | ❌ |

Enforced by ESLint `import/no-restricted-paths` and reviewed in PRs.

## Technology Stack

### Core
- **Language**: TypeScript 5+ (`strict: true`, `noUncheckedIndexedAccess: true`)
- **UI**: React 18+ (concurrent features, Suspense for lazy routes)
- **Build**: Vite 5+ with `@vitejs/plugin-react-swc`
- **Routing**: `react-router-dom@6`
- **HTTP**: `ky` (small, modern wrapper around fetch) or a hand-rolled fetch wrapper

### State Management
- **Server state**: `@tanstack/react-query@5`
- **Client state**: `zustand@4` (with `persist` middleware for theme/preferences)
- **Form state**: `react-hook-form@7` + `zod@3` (with `@hookform/resolvers/zod`)

### Styling
- **Tailwind CSS** as the primary styling system
- **CSS Modules** for one-off component-scoped styles
- **Headless UI** or **Radix** for accessible primitives (dialog, popover, menu)
- Design tokens centralised in `src/shared/styles/tokens.ts`

### Testing
- **Vitest** as the test runner (Jest-compatible API, faster on Vite)
- **React Testing Library** + `@testing-library/user-event` for component tests
- **MSW** (Mock Service Worker) for HTTP mocking in unit/integration tests
- **Playwright** for E2E
- **jest-axe** (or `@axe-core/playwright`) for accessibility assertions

### Code Quality
- **ESLint** with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`, `@typescript-eslint`
- **Prettier** for formatting (enforced in CI)
- **TypeScript** type-check as a separate CI step (`tsc --noEmit`)

### Observability
- **Sentry Browser SDK** for error reporting
- **web-vitals** library for RUM metrics → custom beacon endpoint
- Console logger wrapper that ships warnings/errors to a remote sink in production

### Package Manager
- **pnpm** (workspace support, fast installs, strict node_modules)
- Lock file (`pnpm-lock.yaml`) committed and required in CI

### Sample `package.json` dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.51.0",
    "zustand": "^4.5.0",
    "ky": "^1.4.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react-swc": "^3.7.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.5.0",
    "msw": "^2.4.0",
    "@playwright/test": "^1.46.0",
    "eslint": "^9.10.0",
    "@typescript-eslint/eslint-plugin": "^8.4.0",
    "eslint-plugin-react": "^7.36.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-jsx-a11y": "^6.10.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## Data Flow

### Read Path (most common)

```
User → Page component →
  useQuery hook (TanStack Query cache) →
    apiClient.get() → HTTP API → Zod validation →
      cache fill → component re-renders
```

1. The page component mounts and calls a feature hook (e.g. `useChapterPages(id)`)
2. TanStack Query checks its cache by `queryKey`; if fresh (within `staleTime`), data is returned immediately
3. On cache miss or stale, the fetcher hits the API, validates the response with Zod, and stores it in the cache
4. Components reading the same `queryKey` re-render synchronously
5. Background refetch may occur on focus, reconnect, or interval

### Write Path

```
User submits form → useMutation →
  apiClient.post() → HTTP API →
    on success: invalidate query keys → refetch →
      UI reflects new server state
```

1. A user action triggers a `useMutation` (`createBookmark`, `updateProgress`)
2. The mutation function calls the API client
3. On success, the mutation invalidates affected query keys
4. Affected queries refetch and the UI updates
5. Optimistic updates may pre-paint the result, with rollback on failure

### Reader Path (special case)

```
ChapterReaderPage →
  useChapterPages(id) → manifest in cache →
    <ChapterReader> renders pages →
      <PagePrefetcher> kicks off:
        - prefetch next chapter manifest (TanStack Query)
        - prefetch next 3 page images via <link rel="prefetch">
```

The reader uses TanStack Query's `prefetchQuery` plus DOM-level image prefetching to keep the next pages always-warm.

### Authentication Flow

```
LoginPage → useLogin mutation → POST /auth/login →
  store access + refresh tokens → redirect to intended route

Authed request → 401 →
  refresh interceptor → POST /auth/refresh →
    retry original request OR logout if refresh fails
```

- Access token in memory only (never `localStorage`)
- Refresh token in HttpOnly cookie (set by backend) or secure storage with rotation
- Interceptor in `apiClient` handles automatic refresh; concurrent 401s queue against a single in-flight refresh

## Routing Strategy

### Route Table (sketch)

```
/                                — CatalogPage (default landing)
/search                          — SearchPage
/manga/:mangaId                  — MangaDetailPage
/manga/:mangaId/chapter/:id      — ChapterReaderPage   (lazy chunk: "reader")
/library                         — LibraryPage         (auth required)
/library/bookmarks               — BookmarksPage       (auth required)
/me                              — ProfilePage         (auth required)
/auth/login                      — LoginPage
/auth/register                   — RegisterPage
*                                — NotFoundPage
```

### Code Splitting

- Reader, library, and auth flows are split into their own chunks via `React.lazy(() => import(...))`
- Catalog (the landing surface) ships in the main bundle
- All other pages lazy-loaded on first navigation

### Route Guards

- `<RequireAuth>` wrapper redirects to `/auth/login?next=...` for unauthenticated users
- `<RequireRole role="uploader">` for role-gated routes
- Guards live in `src/features/auth/components/`

## State Management Strategy

### Decision Matrix

| Data | Where it lives | Why |
|------|----------------|-----|
| Manga / chapter / page metadata | TanStack Query cache | Server-owned, cacheable |
| User profile | TanStack Query cache | Server-owned |
| Reading progress | TanStack Query cache + optimistic updates | Server-owned, write-heavy |
| Reader settings (direction, variant, theme) | Zustand (`persist` middleware) | Client-only, survives reload |
| UI state (modal open, drawer expanded) | Component `useState` | Local, ephemeral |
| Auth tokens | In-memory Zustand store + refresh interceptor | Security-sensitive |
| Search query | URL search params | Shareable, back-button friendly |
| Theme (light/dark) | Zustand (`persist`) + `data-theme` on `<html>` | Persistent client preference |

### Anti-Patterns
- ❌ Copying TanStack Query data into Zustand or `useState`
- ❌ Storing route params in client state
- ❌ Storing form state in Zustand (use React Hook Form)
- ❌ Putting the access token in `localStorage`

## Configuration Strategy

### Environment Variables

Vite exposes only `VITE_*` prefixed variables to the client. Validate at startup:

```ts
// src/app/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_RELEASE: z.string().default("dev"),
  VITE_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export const env = EnvSchema.parse(import.meta.env);
```

### Sample `.env` Files

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_ENV=development

# .env.staging
VITE_API_BASE_URL=https://api.staging.steins.example/api/v1
VITE_SENTRY_DSN=https://...
VITE_ENV=staging

# .env.production
VITE_API_BASE_URL=https://api.steins.example/api/v1
VITE_SENTRY_DSN=https://...
VITE_ENV=production
```

`.env.local` is gitignored and overrides any of the above for local secrets.

## Performance Considerations

### Bundle Budgets

| Chunk | Budget (gzipped) |
|-------|------------------|
| Initial (catalog landing) | ≤ 200 KB |
| Reader chunk | ≤ 120 KB |
| Each lazy page | ≤ 80 KB |
| Single image (preview variant) | ≤ 200 KB |

Monitor with `vite build` size report and a CI step that fails the build on regression.

### Caching Strategy

| Resource | Layer | TTL | Notes |
|----------|-------|-----|-------|
| Manga detail | TanStack Query | `staleTime: 5m` | Background refetch on focus |
| Chapter list (per manga) | TanStack Query | `staleTime: 1m` | Invalidate on chapter add |
| Page manifest | TanStack Query | `staleTime: 10m` | Versioned by chapter version |
| Search results | TanStack Query | `staleTime: 30s` | `placeholderData` for typing UX |
| User session | Auth store + refresh | session | Refresh interceptor |
| Static images | Browser HTTP cache + CDN | 30d | Versioned URLs from API |
| Reading progress | TanStack Query + optimistic | n/a | Write-through with rollback |

### Rendering Performance

- Lists virtualize at >100 items (`@tanstack/react-virtual`)
- `<img loading="lazy" decoding="async">` for catalog covers
- Reader pages use `<picture>` with WebP source + JPEG fallback
- Avoid layout-shifting components — reserve dimensions via aspect-ratio CSS
- `React.memo` only when profiler shows a measurable benefit

### Web Vitals Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | ≤ 2.5s on 4G |
| INP (Interaction to Next Paint) | ≤ 200ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 |
| FCP (First Contentful Paint) | ≤ 1.8s |

Reported via `web-vitals` to a backend beacon and tracked in Sentry Performance.

## Scalability Considerations

### Horizontal Scaling
- The frontend is a static bundle — scale by serving from a CDN
- No server-side rendering in v0.1.0 (consider for SEO later)

### Build Performance
- Vite's incremental rebuild keeps dev HMR < 200ms
- CI build uses `pnpm` cache and Vite's persistent cache (warm builds)

### Runtime Memory
- Reader cleans up off-screen image references aggressively
- TanStack Query cache size capped via `gcTime` (default 5min)
- Image elements removed from DOM beyond ±5 pages of the current page in vertical-scroll mode
