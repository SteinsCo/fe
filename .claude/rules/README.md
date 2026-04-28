# Steins Frontend Development Rules

This directory contains the comprehensive ruleset for developing the **Steins Web Frontend**, a React + TypeScript single-page application that consumes the Steins manga API.

## Overview

The **Steins Frontend** is a web client designed to:
- Browse the manga catalog (search, filter, genre/tag navigation)
- Provide an immersive reading experience (paged, vertical-scroll, RTL/LTR)
- Manage user accounts, libraries, bookmarks, and reading progress
- Stream chapter pages with prefetching and adaptive image variants
- Render server-driven content with caching, optimistic updates, and offline-tolerant fallbacks

The backend (Go API) is a separate project — these rules are scoped to the frontend codebase only.

## Ruleset Structure

The rules are organized into specialized domains:

### [01-architecture.md](01-architecture.md)
**Core Frontend Architecture and Design**

Covers:
- App layering (pages → features → shared)
- Tech stack (React 18, TypeScript 5, Vite, React Router v6, TanStack Query, Zustand, Tailwind)
- Directory structure (Feature-Sliced inspired)
- Data flow (UI ↔ TanStack Query cache ↔ HTTP API)
- Routing strategy and code splitting
- State management strategy (server state vs. client state)
- Performance budgets and bundle hygiene

Read this first to understand:
- How modules fit together (pages, features, shared)
- Where to place new code
- How API responses become rendered UI
- Caching, prefetching, and invalidation rules

### [02-component-implementation.md](02-component-implementation.md)
**Component, Routing, and API Integration Standards**

Covers:
- Component patterns (functional components, hooks, composition)
- Page vs. feature vs. UI primitive responsibilities
- React Router conventions (route layout, lazy loading, guards)
- API client (typed wrapper, request/response contract)
- Server state with TanStack Query (queries, mutations, invalidation)
- Client state with Zustand (reader settings, UI state)
- Forms with React Hook Form + Zod
- Authentication flow (JWT access + refresh, route guards)
- Reader-specific components (page manifest renderer, prefetcher)
- Image delivery (variants, lazy loading, responsive images)
- Accessibility (focus, keyboard, ARIA)

Essential for:
- Adding new pages or features
- Wiring API endpoints to UI
- Securing authenticated routes
- Building the reader experience

### [04-error-handling.md](04-error-handling.md)
**Error Handling, Logging, and Observability**

Covers:
- Error taxonomy (network, API, validation, render)
- React error boundaries (route-level, feature-level)
- TanStack Query error states and retry policy
- Toast/notification surface
- Frontend logging (browser console + remote sink)
- Web Vitals and Real-User Monitoring (RUM)
- Sentry / error reporting integration
- Graceful degradation (offline, stale cache)

Critical for:
- Preventing white-screen crashes
- Surfacing actionable errors to users
- Debugging production issues
- Tracking UX quality

### [05-testing.md](05-testing.md)
**Testing Strategy and Quality Assurance**

Covers:
- Test pyramid: Unit (Vitest) → Integration (RTL + MSW) → E2E (Playwright)
- Component testing patterns
- Hook testing (`renderHook`)
- API mocking with MSW
- Form testing (RHF + Zod)
- Accessibility testing (`jest-axe`)
- Visual regression (optional, Playwright screenshots)
- Coverage thresholds and CI integration

Important for:
- Ensuring component correctness
- Preventing regressions on the reader and catalog
- Verifying accessibility
- Maintaining test coverage

### [06-code-style.md](06-code-style.md)
**Code Style and Conventions**

Covers:
- TypeScript style (strict mode, no `any`, discriminated unions)
- React conventions (functional components, hook rules)
- Naming (PascalCase components, camelCase functions, kebab-case files)
- Imports order
- ESLint + Prettier configuration
- Comments policy (Korean primary, English secondary)
- Anti-patterns to avoid
- Git commit / branch / PR conventions

Essential for:
- Consistent codebase
- Readable code reviews
- Aligned tooling

## Quick Start Guide

### For New Frontend Developers

1. **Start Here**: Read [01-architecture.md](01-architecture.md) for system overview
2. **Code Standards**: Read [06-code-style.md](06-code-style.md) for style guidelines
3. **Set Up Environment**: Install Node 20+, pnpm, and run `pnpm install`
4. **Understand Data Flow**: Review TanStack Query patterns in [02-component-implementation.md](02-component-implementation.md)
5. **Reference Rules**: Use the relevant section while coding

### For Specific Tasks

**Adding a New Page or Feature:**
1. Review [02-component-implementation.md](02-component-implementation.md) — Component & Routing
2. Place the page under `src/pages/`, the feature module under `src/features/`
3. Add tests per [05-testing.md](05-testing.md)
4. Wire error boundaries per [04-error-handling.md](04-error-handling.md)

**Wiring a New API Endpoint:**
1. Add the typed client function in `src/shared/api/`
2. Wrap with a TanStack Query `useQuery` / `useMutation` hook in `src/features/<domain>/api/`
3. Define request/response Zod schemas alongside types
4. Add MSW handlers and tests

**Debugging Production Issues:**
1. Check Sentry / error tracking dashboard
2. Cross-reference with backend logs by `request_id`
3. Reproduce locally with the same chapter/manga IDs
4. Update runbooks in `docs/runbooks/` if needed

**Optimizing Performance:**
1. Review bundle splits via `vite build --mode analyze`
2. Audit Web Vitals (LCP, INP, CLS) in production
3. Check React DevTools Profiler for hot components
4. Apply `useMemo` / `React.memo` only with measurable benefit

## Key Principles

### 1. Reader Experience First
- The reader path (`/manga/:id` → `/chapter/:id`) is the most-used surface — its perceived latency dominates user satisfaction
- Prefetch the next chapter manifest and the next 3 page images
- Image variants (`thumbnail`/`preview`/`web`) chosen by viewport
- No layout shift while pages load (reserve dimensions from the manifest)

### 2. Type Safety
- TypeScript `strict` mode is non-negotiable
- API responses are validated by Zod at the network boundary
- No `any` — use `unknown` and narrow

### 3. Server State vs. Client State
- API-derived data lives in TanStack Query — never duplicate it into Zustand or `useState`
- Client-only state (reader direction, theme, UI toggles) lives in Zustand
- URL-derived state lives in the router — never mirror route params into local state

### 4. Accessibility
- Every interactive element is keyboard reachable
- Focus is visible and managed across route changes
- Color contrast meets WCAG AA
- Reader supports keyboard navigation (←/→, j/k, space)

### 5. Performance
- Initial JS budget: ≤ 200 KB gzipped for the catalog route
- Reader chunk lazy-loaded
- Images: WebP via `<picture>` with fallback
- Avoid blocking the main thread with synchronous work

### 6. Maintainability
- Features are self-contained directories
- Shared code is intentional, not accidental
- Tests document behavior
- ESLint + Prettier enforce style automatically

## Development Workflow

### Before Writing Code

1. **Understand the Requirement**
   - Which page or feature is affected?
   - Does it consume an existing API endpoint?
   - What states does the UI need (loading, error, empty, success)?

2. **Review Relevant Rules**
   - Component patterns ([02-component-implementation.md](02-component-implementation.md))
   - Error states ([04-error-handling.md](04-error-handling.md))
   - Test plan ([05-testing.md](05-testing.md))

3. **Design Before Implementation**
   - Sketch the component tree
   - Identify shared vs. feature-local code
   - Plan loading / error / empty states upfront
   - Consider keyboard and screen-reader UX

### While Writing Code

1. **Follow the Style Guide** ([06-code-style.md](06-code-style.md))
   - Run Prettier on save
   - Resolve all ESLint warnings before committing
   - Self-documenting names; minimal comments (WHY only)

2. **Follow the Architecture Rules**
   - Pages own routing; features own domain logic; UI primitives stay generic
   - Server state via TanStack Query; client state via Zustand
   - Validate API responses with Zod at the boundary

3. **Write Tests Alongside**
   - Unit tests for pure logic and hooks
   - Component tests with RTL + MSW for behavior
   - E2E tests for critical paths (login, read chapter, add to library)

4. **Keep It Simple**
   - Inline JSX over premature component extraction
   - Direct props over generic props soups
   - Delete dead code

### After Writing Code

1. **Self-Review** (Use [06-code-style.md](06-code-style.md) checklist)
   - Type-safe? No `any`?
   - All UI states handled (loading, error, empty, success)?
   - Accessible (keyboard, focus, contrast)?
   - Tests cover happy path + at least one error path?
   - No `console.log` left over?

2. **Quality Checks**
   - `pnpm typecheck` — no TS errors
   - `pnpm lint` — no ESLint errors
   - `pnpm test` — all tests pass, coverage threshold met
   - `pnpm build` — production build succeeds

3. **Manual Verification**
   - Start dev server (`pnpm dev`) and exercise the feature in a browser
   - Test on mobile viewport (375px) and desktop (1280px+)
   - Verify dark mode if applicable
   - Try with throttled network (Slow 3G)

## Common Patterns

### Page Component

```tsx
// src/pages/chapter/ChapterReaderPage.tsx
import { useParams } from "react-router-dom";

import { ChapterReader } from "@/features/reader/components/ChapterReader";
import { useChapterPages } from "@/features/reader/api/useChapterPages";
import { PageError, PageLoading } from "@/shared/ui/feedback";

export function ChapterReaderPage() {
  const { chapterId = "" } = useParams<{ chapterId: string }>();
  const { data, isPending, isError, error, refetch } = useChapterPages(chapterId);

  if (isPending) return <PageLoading />;
  if (isError) return <PageError error={error} onRetry={refetch} />;

  return <ChapterReader manifest={data} />;
}
```

### Feature Hook (TanStack Query)

```ts
// src/features/reader/api/useChapterPages.ts
import { useQuery } from "@tanstack/react-query";

import { fetchChapterPages } from "./fetchChapterPages";
import { chapterKeys } from "./keys";

export function useChapterPages(chapterId: string) {
  return useQuery({
    queryKey: chapterKeys.pages(chapterId),
    queryFn: () => fetchChapterPages(chapterId),
    staleTime: 10 * 60 * 1000,
    enabled: chapterId.length > 0,
  });
}
```

### API Client Function

```ts
// src/features/reader/api/fetchChapterPages.ts
import { apiClient } from "@/shared/api/client";
import { ChapterManifestSchema } from "./schemas";

export async function fetchChapterPages(chapterId: string) {
  const json = await apiClient.get(`/chapters/${chapterId}/pages`).json();
  return ChapterManifestSchema.parse(json).data;
}
```

## Integration with Claude

When working with Claude on this codebase:

1. **Reference Specific Rules**
   - "Following the component conventions from 02-component-implementation.md..."
   - "Per the error handling rules in 04-error-handling.md..."

2. **Ask for Clarification**
   - "Which pattern from the ruleset applies here?"
   - "How does this fit the architecture in 01-architecture.md?"

3. **Validate Against Rules**
   - "Does this hook follow the TanStack Query conventions?"
   - "Are these error states consistent with the ruleset?"

## Updates and Evolution

These rules are living documents and should evolve with the project.

### When to Update Rules

- New patterns emerge (e.g. moving to React Server Components, switching state libs)
- A11y or performance learnings become repeatable patterns
- Production incidents reveal a missing convention
- Tooling upgrades (Vite, ESLint, Vitest) shift defaults

### How to Update

1. Propose changes via discussion
2. Update the relevant ruleset file
3. Update this README if the structure changes
4. Communicate changes to the team
5. Update existing code to match incrementally

## Additional Resources

### External Documentation

- React: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Vite: https://vitejs.dev
- React Router: https://reactrouter.com
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand.docs.pmnd.rs
- Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Playwright: https://playwright.dev
- Web Vitals: https://web.dev/vitals/

### Internal Documentation

- API Documentation: backend repo `docs/api/`
- Component Library / Storybook: `docs/storybook/` (if present)
- Runbooks: `docs/runbooks/`
- Design System: `docs/design/`

## Getting Help

- Review the relevant ruleset section first
- Check existing components for examples
- Ask in team chat with specific questions
- Reference the ruleset section in your question

---

**Remember**: These rules exist to ensure consistency, quality, and a fast, accessible reader experience. When in doubt, follow the rules. If the rules don't cover a scenario, that's an opportunity to improve them.
