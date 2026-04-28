# Testing and Quality Assurance Rules

## Testing Philosophy

### Core Principles

1. **Test User Behavior, Not Implementation**
   - Query by accessible role / label / text — not by `data-testid` unless necessary
   - Drive interactions with `@testing-library/user-event`, not by calling component methods
   - Assert on what the user sees, not on internal state

2. **Test Coverage Targets**
   - Minimum 70% statement coverage for `src/`
   - 90%+ for `src/features/auth/` (security-critical)
   - 90%+ for `src/features/reader/` (core UX)
   - 100% for `src/shared/api/error.ts` and the API client

3. **Test Pyramid**
   ```
        E2E (Playwright) — 10%
       ┌──────────────────────┐
       │ Integration (RTL+MSW)│ — 30%
       ├──────────────────────┤
       │ Unit (Vitest)        │ — 60%
       └──────────────────────┘
   ```

4. **Test Isolation**
   - No tests touch the real network — MSW intercepts every fetch
   - Each test gets its own QueryClient (no cross-test cache pollution)
   - Tests run in parallel by default — never depend on test order

5. **Test Naming**
   ```ts
   // Pattern: describe(<unit>) → it("does <expected> when <scenario>")
   describe("ChapterReader", () => {
     it("renders the page manifest in RTL order when direction is rtl", () => {});
     it("shows an error message when the manifest fails to load", () => {});
   });
   ```

## Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Test runner | Vitest | Jest-compatible, runs on the Vite pipeline |
| Component | React Testing Library + user-event | DOM-driven assertions |
| HTTP mocking | MSW (Mock Service Worker) | Network-level mocks shared with E2E |
| Hooks | `@testing-library/react` `renderHook` | Hook-only tests |
| A11y smoke | jest-axe | Axe rules during component tests |
| E2E | Playwright | Critical user paths, real browser |
| Visual (optional) | Playwright screenshots | Pixel diff for design-critical surfaces |

## Vitest Setup

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/main.tsx",
        "src/app/router.tsx",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
```

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { server } from "./utils/msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

## Test Organization

### Directory Structure

All tests live under `test/` and **mirror `src/`**:

```
test/
├── setup.ts                              # Vitest setup
├── utils/
│   ├── render.tsx                        # renderWithProviders helper
│   ├── msw-server.ts                     # Node MSW server
│   └── handlers.ts                       # Default handlers
├── pages/
│   ├── catalog/CatalogPage.test.tsx
│   └── chapter/ChapterReaderPage.test.tsx
├── features/
│   ├── manga/
│   │   ├── components/MangaCard.test.tsx
│   │   ├── api/useMangaList.test.tsx
│   │   └── schemas/manga.test.ts
│   ├── chapter/
│   ├── reader/
│   └── auth/
├── shared/
│   ├── ui/Button.test.tsx
│   └── api/error.test.ts
└── e2e/                                   # Playwright (optional sibling layout)
```

**Rules:**
- `src/features/reader/components/ChapterReader.tsx` → `test/features/reader/components/ChapterReader.test.tsx`
- File extension: `.test.tsx` for components, `.test.ts` for non-React modules
- One test file per source file when feasible

### Test Helpers

```tsx
// test/utils/render.tsx
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions & { route?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? "/"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}
```

## Unit Tests

### What to Test

| Layer | What to test |
|-------|-------------|
| Pure functions (`src/shared/lib/`) | Inputs → outputs, edge cases |
| Zod schemas | Valid input parses, invalid input throws with the expected issue |
| Hooks | State transitions, derived values, cleanup |
| Stores (Zustand) | Action results, persistence layer |
| Reducers / state machines | Transitions for all defined events |

### Pure Function Test

```ts
// test/shared/lib/formatChapterNumber.test.ts
import { describe, it, expect } from "vitest";
import { formatChapterNumber } from "@/shared/lib/format";

describe("formatChapterNumber", () => {
  it.each([
    [1, "1"],
    [12.5, "12.5"],
    [100, "100"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatChapterNumber(input)).toBe(expected);
  });

  it("throws on negative numbers", () => {
    expect(() => formatChapterNumber(-1)).toThrow();
  });
});
```

### Hook Test

```tsx
// test/features/reader/hooks/useReaderShortcuts.test.tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useReaderShortcuts } from "@/features/reader/hooks/useReaderShortcuts";

describe("useReaderShortcuts", () => {
  it("calls onNext when ArrowRight is pressed", () => {
    const onNext = vi.fn();
    renderHook(() => useReaderShortcuts({ onNext, onPrev: vi.fn() }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(onNext).toHaveBeenCalledOnce();
  });
});
```

### Schema Test

```ts
// test/features/manga/schemas/manga.test.ts
import { describe, it, expect } from "vitest";
import { MangaSchema } from "@/features/manga/schemas/manga";

describe("MangaSchema", () => {
  it("parses a valid manga payload", () => {
    const parsed = MangaSchema.parse({ /* ...valid fixture... */ });
    expect(parsed.id).toBe("01J...");
  });

  it("rejects an invalid status", () => {
    expect(() => MangaSchema.parse({ /* ...with status: "burning"... */ })).toThrow();
  });
});
```

## Component Tests

### Pattern (Arrange / Act / Assert)

```tsx
// test/features/manga/components/MangaCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/../test/utils/render";
import { MangaCard } from "@/features/manga/components/MangaCard";
import { buildManga } from "@/../test/factories/manga";

describe("MangaCard", () => {
  it("renders the title and author", () => {
    const manga = buildManga({ title: "Test Manga", authors: ["Author A"] });
    const { getByRole } = renderWithProviders(<MangaCard manga={manga} />);

    expect(getByRole("link", { name: /test manga/i })).toBeInTheDocument();
    expect(getByRole("link", { name: /test manga/i })).toHaveAttribute(
      "href", `/manga/${manga.id}`,
    );
  });

  it("calls onClick when activated", async () => {
    const onClick = vi.fn();
    const { user, getByRole } = renderWithProviders(<MangaCard manga={buildManga()} onClick={onClick} />);

    await user.click(getByRole("link"));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Component Test Rules

1. **Query priority** (RTL guidance):
   1. `getByRole`
   2. `getByLabelText`
   3. `getByPlaceholderText`
   4. `getByText`
   5. `getByDisplayValue`
   6. `getByAltText`
   7. `getByTitle`
   8. `getByTestId` (last resort)

2. **Use `user-event`, not `fireEvent`** — it simulates real user interactions (focus, hover, keypress)

3. **Always `await`** user-event calls and `findBy*` queries

4. **Avoid testing implementation details** — internal state, prop names of children, CSS class strings

### Loading / Error / Empty States

Every fetching component MUST have tests for all four states:

```tsx
describe("CatalogPage", () => {
  it("shows a loading indicator while fetching", () => { /* MSW delays response */ });
  it("renders results on success", async () => { /* MSW returns data */ });
  it("shows an error message when the request fails", async () => { /* MSW returns 500 */ });
  it("shows an empty state when there are no results", async () => { /* MSW returns [] */ });
});
```

## API Mocking with MSW

### Server Setup

```ts
// test/utils/msw-server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### Default Handlers

```ts
// test/utils/handlers.ts
import { http, HttpResponse } from "msw";

import { buildManga } from "../factories/manga";

const baseUrl = "http://localhost:8080/api/v1";

export const handlers = [
  http.get(`${baseUrl}/manga`, () => {
    return HttpResponse.json({
      data: [buildManga()],
      meta: { page: 1, page_size: 20, total: 1 },
    });
  }),

  http.get(`${baseUrl}/chapters/:id/pages`, ({ params }) => {
    return HttpResponse.json({
      data: {
        chapter_id: params.id,
        manga_id: "manga-1",
        version: 1,
        reading_dir: "rtl",
        pages: [
          { index: 1, url: "https://cdn.example/page1.webp", width: 1280, height: 1860 },
        ],
      },
    });
  }),
];
```

### Per-Test Overrides

```tsx
import { server } from "@/../test/utils/msw-server";
import { http, HttpResponse } from "msw";

it("shows an error when the API returns 500", async () => {
  server.use(
    http.get("**/manga", () => HttpResponse.json({ error: { code: "INTERNAL", message: "boom" } }, { status: 500 })),
  );
  // ... render and assert
});
```

### MSW Rules

- One default handler per endpoint, returning representative success data
- Override per-test for error / empty / edge cases
- `onUnhandledRequest: "error"` in setup — every fetch must be intercepted

## Form Testing

```tsx
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/../test/utils/render";
import { LoginForm } from "@/features/auth/components/LoginForm";

describe("LoginForm", () => {
  it("shows an error when the email is invalid", async () => {
    const { user, getByLabelText, findByRole } = renderWithProviders(<LoginForm />);

    await user.type(getByLabelText(/email/i), "not-an-email");
    await user.type(getByLabelText(/password/i), "verysecurepw");
    await user.click(getByRole("button", { name: /sign in/i }));

    expect(await findByRole("alert")).toHaveTextContent(/valid email/i);
  });
});
```

## Accessibility Testing

### jest-axe in Component Tests

```tsx
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no a11y violations", async () => {
  const { container } = renderWithProviders(<MangaCard manga={buildManga()} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### A11y Test Rules

- Every shared UI primitive in `src/shared/ui/` MUST have an `axe` smoke test
- Page-level a11y is exercised via Playwright + `@axe-core/playwright` in CI

## Test Data Builders

Use builder factories — never inline large fixtures:

```ts
// test/factories/manga.ts
import { type Manga } from "@/features/manga/schemas/manga";

export function buildManga(overrides: Partial<Manga> = {}): Manga {
  return {
    id: "01J0000000000000000000",
    slug: "test-manga",
    title: "Test Manga",
    description: "A description",
    cover_url: "https://cdn.example/cover.webp",
    authors: ["Author A"],
    genres: ["action"],
    status: "ongoing",
    language: "ko",
    reading_dir: "rtl",
    view_count: 0,
    rating: 0,
    published_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}
```

```
test/
├── factories/
│   ├── manga.ts
│   ├── chapter.ts
│   ├── page.ts
│   └── user.ts
└── fixtures/
    └── manifests/
        └── chapter_24_pages.json
```

## E2E Tests (Playwright)

### Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "pnpm preview --port 5173",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Critical User Paths (must be E2E covered)

1. Visit catalog → click manga → click chapter → page renders
2. Login → add to library → reload → library still has the entry
3. Read chapter → keyboard `→` advances pages → progress saved on exit
4. Search → click result → manga detail loads
5. Logout → protected route redirects to login

### Sample E2E Test

```ts
// e2e/reader.spec.ts
import { test, expect } from "@playwright/test";

test("reads a chapter end-to-end", async ({ page }) => {
  await page.goto("/manga/test-manga");
  await page.getByRole("link", { name: /chapter 1/i }).click();

  await expect(page.getByTestId("reader")).toBeVisible();
  await expect(page.getByRole("img", { name: /page 1/i })).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("img", { name: /page 2/i })).toBeVisible();
});
```

### E2E Conventions

- E2E tests run against a built bundle (`pnpm build && pnpm preview`)
- MSW Service Worker (`msw/browser`) intercepts XHR/fetch in the preview build for hermetic E2E
- Real-API E2E lives in a separate `e2e-staging/` directory and runs nightly
- Authenticated tests share a logged-in storageState fixture (see `e2e/fixtures/auth.ts`)

### A11y in E2E

```ts
import AxeBuilder from "@axe-core/playwright";

test("catalog page has no critical a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(critical).toEqual([]);
});
```

## Visual Regression (Optional)

For design-critical surfaces (the reader, the catalog cards):

```ts
test("manga card snapshot", async ({ page }) => {
  await page.goto("/?seed=visual");
  await expect(page.getByTestId("manga-card-first")).toHaveScreenshot("manga-card.png", {
    maxDiffPixelRatio: 0.01,
  });
});
```

- Snapshots stored under `e2e/__screenshots__/`
- Run `pnpm test:e2e:update-snapshots` to regenerate after intentional design changes
- Diff threshold tight enough to catch accidental regressions, loose enough to ignore font-rendering jitter

## Performance / Bundle Testing

### Bundle Size Check (CI)

```bash
# scripts/check-bundle-size.sh
size=$(du -sb dist/assets/index-*.js | awk '{print $1}')
limit=204800   # 200 KB
if [ "$size" -gt "$limit" ]; then
  echo "::error::Initial bundle exceeds budget: ${size}B > ${limit}B"
  exit 1
fi
```

Wire into CI after `pnpm build`.

### Lighthouse (Optional)

Run Lighthouse CI on PRs touching the catalog or reader:

```yaml
- run: npx --yes @lhci/cli@latest autorun
```

## Quality Gates

### Pre-Commit (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### CI Pipeline (per PR)

| Step | Command | Failure |
|------|---------|---------|
| Format check | `pnpm format:check` | Block merge |
| Type check | `pnpm typecheck` | Block merge |
| Lint | `pnpm lint` | Block merge |
| Unit + integration tests | `pnpm test --coverage` | Block merge if < 70% |
| Build | `pnpm build` | Block merge |
| Bundle size | `scripts/check-bundle-size.sh` | Warn (block on tagged release) |
| E2E (smoke subset) | `pnpm test:e2e --grep @smoke` | Block merge |

### Coverage Thresholds

```ts
// vitest.config.ts (excerpt)
coverage: {
  thresholds: {
    lines: 70,
    statements: 70,
    functions: 70,
    branches: 70,
    "src/features/auth/**": { lines: 90, statements: 90 },
    "src/features/reader/**": { lines: 90, statements: 90 },
    "src/shared/api/**": { lines: 95, statements: 95 },
  },
},
```

## ESLint for Tests

```js
// eslint.config.js (excerpt)
{
  files: ["test/**/*.{ts,tsx}", "e2e/**/*.ts"],
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
    "testing-library/no-node-access": "error",
    "testing-library/no-container": "error",
    "testing-library/prefer-screen-queries": "error",
  },
},
```

## Smoke Tests (Production)

Post-deploy smoke checks (Playwright against real prod):

```ts
// e2e-prod/smoke.spec.ts
test("catalog loads and shows results", async ({ page }) => {
  await page.goto("https://steins.example");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});
```

Run on a cron after each production deployment.

## Test Documentation

Document test plans in `docs/testing/`:

```
docs/testing/
├── test-plan.md             # Overall strategy
├── reader-tests.md          # Reader-specific scenarios
├── e2e-flows.md             # Critical user paths
└── known-issues.md          # Known limitations
```

### Known Test Limitations Example

```markdown
# Known Test Limitations

1. Service Worker
   - MSW browser handler in E2E doesn't match the production SW behavior
   - Workaround: production-only smoke tests run against the real API

2. IntersectionObserver
   - jsdom does not implement it
   - Workaround: `test/setup.ts` polyfills with a stub
```
