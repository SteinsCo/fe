# Error Handling and Monitoring Rules

## Error Handling Principles

### Core Principles

1. **Never White-Screen the User**
   - Every route MUST be wrapped by an error boundary
   - The app shell stays mounted even when a route crashes
   - A user always has a path forward (retry, back, home)

2. **Differentiate User-Facing vs. Developer-Facing Errors**
   - User messages: short, actionable, in the user's language
   - Developer details: console logs, Sentry breadcrumbs, structured fields
   - Never expose internal stack traces or backend payloads to the user

3. **Categorize Errors**
   - Network (offline, timeout)
   - API (4xx user error, 5xx server error)
   - Validation (Zod failure, form invariants)
   - Render (uncaught React errors)
   - Auth (401 → refresh, 403 → forbidden screen)

4. **Recover Where Possible**
   - 401 → automatic refresh, retry the original request
   - Network failure → retry with backoff
   - Validation → show inline form errors
   - 5xx → retryable banner with manual retry

## Error Taxonomy

### Error Categories

```ts
// src/shared/api/error.ts
export type ErrorCategory =
  // Client-caused
  | "validation"
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limit"
  // Transient — retryable
  | "network"
  | "timeout"
  // Server
  | "server"
  // Frontend logic
  | "render"
  | "config"
  | "unknown";
```

### Custom Error Type

```ts
// src/shared/api/error.ts
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  readonly category: ErrorCategory;
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(init: {
    category: ErrorCategory;
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(init.message, { cause: init.cause });
    this.name = "ApiError";
    this.category = init.category;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId;
    this.retryable = init.retryable ?? init.category === "network" || init.category === "timeout";
  }

  static is(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  static async fromKyError(err: { response?: Response; request?: Request }): Promise<ApiError> {
    const response = err.response;
    const requestId = response?.headers.get("x-request-id") ?? undefined;
    if (!response) {
      return new ApiError({
        category: "network",
        status: 0,
        code: "NET_001",
        message: "network unreachable",
        requestId,
      });
    }
    let body: ApiErrorBody | undefined;
    try { body = await response.clone().json(); } catch { /* non-JSON body */ }
    return new ApiError({
      category: categoryFromStatus(response.status),
      status: response.status,
      code: body?.error.code ?? `HTTP_${response.status}`,
      message: body?.error.message ?? response.statusText,
      details: body?.error.details,
      requestId,
    });
  }
}

function categoryFromStatus(status: number): ErrorCategory {
  if (status === 400) return "validation";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limit";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 500) return "server";
  return "unknown";
}
```

### Error Codes

The frontend mirrors the backend's error codes (kept in sync via the API contract):

```
# Validation
VAL_001  : missing required field
VAL_002  : invalid field format
VAL_003  : value out of range
VAL_004  : unsupported enum value
VAL_005  : invalid JSON body

# Auth
AUTH_001 : missing authentication
AUTH_002 : invalid token
AUTH_003 : token expired
AUTH_004 : insufficient role
AUTH_005 : account disabled

# Resources
MANGA_NOT_FOUND
CHAPTER_NOT_FOUND
CHAPTER_PROCESSING
PAGE_NOT_FOUND
USER_NOT_FOUND

# Network
NET_001  : connection refused
NET_002  : connection timeout
NET_003  : DNS resolution failed
HTTP_502 : bad gateway
HTTP_503 : service unavailable

# Frontend-only
RENDER_001 : uncaught render error
CONFIG_001 : invalid env var
SCHEMA_001 : API response failed Zod validation
```

## React Error Boundaries

### Route-Level Boundary

`react-router-dom` provides built-in error boundaries via `errorElement`:

```tsx
// src/pages/error/RouteErrorPage.tsx
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { reportError } from "@/shared/observability/report";
import { Button } from "@/shared/ui/Button";

export function RouteErrorPage() {
  const error = useRouteError();
  reportError(error, { boundary: "route" });

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFoundView />;
    return <GenericErrorView title={`${error.status}`} message={error.statusText} />;
  }
  if (ApiError.is(error)) return <ApiErrorView error={error} />;
  return <GenericErrorView title="문제가 발생했습니다" message="잠시 후 다시 시도해주세요." />;
}
```

### Feature-Level Boundary

For widgets that should fail without taking down the whole route:

```tsx
// src/shared/ui/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/shared/observability/report";

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

Usage:
```tsx
<ErrorBoundary fallback={<RecommendationsFallback />}>
  <MangaRecommendations mangaId={id} />
</ErrorBoundary>
```

### Boundary Placement Rules

| Boundary | Placement | Purpose |
|----------|-----------|---------|
| Root | `src/app/App.tsx` | Last-resort catch — keeps the page navigable |
| Route | Each route's `errorElement` | Per-route fallback UI |
| Feature | Around heavy/optional widgets | Isolate non-critical failures |

## TanStack Query Error Handling

### Per-Query Error UI

```tsx
const { data, isPending, isError, error, refetch } = useChapterPages(chapterId);

if (isPending) return <PageLoading />;
if (isError) {
  if (ApiError.is(error) && error.category === "not_found") {
    return <ChapterNotFound chapterId={chapterId} />;
  }
  return <PageError error={error} onRetry={() => refetch()} />;
}
return <ChapterReader manifest={data} />;
```

### Default Retry Policy

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (!ApiError.is(error)) return failureCount < 1;
        if (error.status >= 400 && error.status < 500 && error.status !== 408) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: { retry: 0 },
  },
});
```

| Error category | Retry? | Notes |
|----------------|--------|-------|
| `network` | yes (≤ 2) | Exponential backoff |
| `timeout` | yes (≤ 2) | |
| `server` | yes (≤ 2) | 500/502/503 |
| `rate_limit` | yes (≤ 1) | Honor `Retry-After` header if present |
| `auth` | once (after refresh) | Triggered by interceptor, not query retry |
| `validation` / `not_found` / `forbidden` / `conflict` | no | Permanent |

### Global Error Listener

```ts
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    reportError(event.action.error, { source: "query", queryKey: event.query.queryKey });
  }
});
```

## Mutation Error Handling

```tsx
const addToLibrary = useAddToLibrary();

const onClick = async () => {
  try {
    await addToLibrary.mutateAsync({ mangaId, shelf: "reading" });
    toast.success("라이브러리에 추가되었습니다");
  } catch (error) {
    if (ApiError.is(error) && error.code === "LIBRARY_ENTRY_EXISTS") {
      toast.info("이미 라이브러리에 있는 작품입니다");
      return;
    }
    toast.error(messageFor(error));
  }
};
```

- Always `try/catch` mutations that need bespoke error UI
- Always show **some** feedback — silent failures destroy trust
- Use the toast surface for transient errors; inline UI for persistent ones

## Form Validation Errors

```tsx
const { handleSubmit, setError } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });
const login = useLogin();

const onSubmit = handleSubmit(async (values) => {
  try {
    await login.mutateAsync(values);
  } catch (error) {
    if (ApiError.is(error) && error.code === "AUTH_002") {
      setError("password", { message: "이메일 또는 비밀번호가 일치하지 않습니다" });
      return;
    }
    setError("root", { message: messageFor(error) });
  }
});
```

- Zod errors show inline next to the field
- Server-side errors are mapped to the relevant field via `setError`
- Cross-field errors go to `root` and render as a form-level alert

## User-Facing Messages

### Centralized Mapper

```ts
// src/shared/api/messages.ts
export function messageFor(error: unknown): string {
  if (!ApiError.is(error)) return "예상치 못한 오류가 발생했습니다.";
  switch (error.category) {
    case "network":     return "네트워크 연결을 확인해주세요.";
    case "timeout":     return "요청이 시간 초과되었습니다. 다시 시도해주세요.";
    case "auth":        return "로그인이 필요합니다.";
    case "forbidden":   return "이 작업을 수행할 권한이 없습니다.";
    case "not_found":   return "요청한 항목을 찾을 수 없습니다.";
    case "rate_limit":  return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    case "conflict":    return "데이터 충돌이 발생했습니다. 페이지를 새로고침해주세요.";
    case "server":      return "일시적인 오류가 발생했습니다. 곧 복구됩니다.";
    default:            return error.message || "오류가 발생했습니다.";
  }
}
```

### Message Rules

- **Korean primary**, English secondary if i18n adds it later
- Avoid blame — "잠시 후 다시 시도해주세요" not "당신의 요청이 잘못되었습니다"
- Never include error codes or stack traces in user messages
- Always offer next-step guidance ("다시 시도", "로그인", "홈으로")

## Toast / Notification Surface

```ts
// src/shared/ui/Toast/toast.ts
type Toast = { id: string; level: "info" | "success" | "warn" | "error"; message: string };

export const toast = {
  success: (msg: string) => emit({ level: "success", message: msg }),
  info:    (msg: string) => emit({ level: "info",    message: msg }),
  warn:    (msg: string) => emit({ level: "warn",    message: msg }),
  error:   (msg: string) => emit({ level: "error",   message: msg }),
};
```

- Toasts use `aria-live="polite"` for `info`/`success` and `assertive` for `error`
- Auto-dismiss: success 3s, info 4s, warn 6s, error 8s (or persistent with manual dismiss)
- Max 3 toasts on screen — newest replaces oldest

## Frontend Logging

### Logger Wrapper

```ts
// src/shared/observability/logger.ts
import { env } from "@/app/env";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function emit(level: Level, message: string, fields?: Fields) {
  const entry = { level, message, ts: new Date().toISOString(), env: env.VITE_ENV, ...fields };
  if (level === "error" || level === "warn") {
    // eslint-disable-next-line no-console
    console[level](entry);
  } else if (env.VITE_ENV === "development") {
    // eslint-disable-next-line no-console
    console[level](entry);
  }
  if (env.VITE_ENV !== "development" && (level === "error" || level === "warn")) {
    sendBeacon(entry);
  }
}

export const log = {
  debug: (msg: string, fields?: Fields) => emit("debug", msg, fields),
  info:  (msg: string, fields?: Fields) => emit("info",  msg, fields),
  warn:  (msg: string, fields?: Fields) => emit("warn",  msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
```

### Logging Rules

- Never use raw `console.log` in committed code (ESLint rule: `no-console`)
- Use `log.*` helpers; they no-op at `info`/`debug` in production
- Always include structured fields, never string-concatenate values
- Include the user-visible context: `route`, `chapter_id`, `query_key`, `error_code`

```ts
// ✅
log.error("chapter manifest fetch failed", {
  chapter_id: chapterId,
  request_id: error.requestId,
  error_code: error.code,
});

// ❌
console.log(`failed: ${chapterId}`);
```

### Field Naming

Match the backend's snake_case keys for cross-system grep:

| Field | Description |
|-------|-------------|
| `route` | Current route pattern (`/manga/:id/chapter/:cid`) |
| `request_id` | Request ID from server response header |
| `chapter_id` / `manga_id` / `user_id` | Domain IDs |
| `error_code` | Error code from `ApiError.code` |
| `query_key` | TanStack Query key (stringified) |
| `duration_ms` | Operation duration in milliseconds |
| `status_code` | HTTP status code |

## Sentry Integration

```ts
// src/app/sentry.ts
import * as Sentry from "@sentry/react";
import { env } from "./env";

if (env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_ENV,
    release: env.VITE_RELEASE,
    tracesSampleRate: env.VITE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (ApiError.is(error) && (error.category === "auth" || error.category === "validation")) {
        return null;
      }
      return event;
    },
  });
}
```

### Sentry Rules

- Only `error` and unexpected `warn` events go to Sentry
- Never send PII (tokens, email content, full URLs with secrets)
- Filter expected user-caused errors (auth, validation) so the dashboard stays signal-rich
- Tag events with `release` and `env`
- Use breadcrumbs for navigation events and key user actions

## Web Vitals (RUM)

```ts
// src/app/vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

import { env } from "./env";

function send(metric: { name: string; value: number; id: string }) {
  if (env.VITE_ENV === "development") return;
  navigator.sendBeacon(
    `${env.VITE_API_BASE_URL}/rum/vitals`,
    new Blob([JSON.stringify({ ...metric, ts: Date.now() })], { type: "application/json" }),
  );
}

onCLS(send);
onINP(send);
onLCP(send);
onFCP(send);
onTTFB(send);
```

### Web Vitals Targets

| Metric | Target | Failure threshold |
|--------|--------|-------------------|
| LCP | ≤ 2.5s | > 4.0s |
| INP | ≤ 200ms | > 500ms |
| CLS | ≤ 0.1 | > 0.25 |
| FCP | ≤ 1.8s | > 3.0s |
| TTFB | ≤ 800ms | > 1.8s |

## Health and Readiness

The frontend has no dedicated health endpoint, but the app shell verifies critical resources at boot:

```ts
// src/app/bootstrap.ts
async function bootstrap() {
  const probes = [fetch(`${env.VITE_API_BASE_URL}/healthz`).then((r) => r.ok)];
  const ok = await Promise.all(probes).then((rs) => rs.every(Boolean)).catch(() => false);
  if (!ok) renderMaintenanceScreen();
  else renderApp();
}
```

For multi-region deployments, the dashboard surface MAY query `/readyz` to display backend status banners.

## Incident Response

### When a User Reports an Error

1. Ask for the request ID (toast / error screen exposes it)
2. Look up the request ID in Sentry → cross-reference with backend logs
3. Reproduce locally with the same chapter/manga IDs and the user's browser/locale
4. File a bug with:
   - Exact reproduction steps
   - Screenshot or video
   - Browser, OS, viewport size
   - Sentry event link

### Common Failure Modes

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| White screen on reader | Unhandled render error | Check Sentry, fix component, add boundary |
| 401 loop | Refresh token expired or backend rejecting | Check refresh interceptor; force re-login |
| CLS spike on reader | Missing `width`/`height` on `<img>` | Verify manifest dims; reserve via aspect-ratio |
| INP regression | Heavy synchronous work on click | Profile with React DevTools; defer with `startTransition` |
| Stale data after mutation | Missing `invalidateQueries` | Add invalidation in `onSuccess` |

## Data Integrity

### Schema Validation as a Safety Net

Every API response goes through Zod. A schema mismatch is a developer error — surface it loudly:

```ts
try {
  return ChapterManifestSchema.parse(json);
} catch (err) {
  log.error("api response schema mismatch", {
    endpoint: "/chapters/:id/pages",
    error_code: "SCHEMA_001",
    issues: err instanceof z.ZodError ? err.issues : undefined,
  });
  throw new ApiError({
    category: "unknown",
    status: 0,
    code: "SCHEMA_001",
    message: "API response schema mismatch",
    cause: err,
  });
}
```

### Cache Coherence

- Always invalidate query keys touched by mutations
- Prefer `invalidateQueries` over `setQueryData` unless you need the optimistic UI to be instant
- After a chapter version bumps, invalidate the page manifest by `chapterKeys.pages(id)`
- On logout, call `queryClient.clear()` to drop user-scoped data

### Offline / Stale Cache

- TanStack Query's `gcTime` (5min default) keeps data warm across navigation
- When offline, queries serve stale data and show a banner via `useNetworkStatus`
- Mutations queued while offline → out of scope for v0.1.0
