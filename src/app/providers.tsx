import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { ApiError } from "@/shared/api";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (!ApiError.is(error)) return failureCount < 1;
          // 4xx (404/403/400/409 등) 는 재시도 의미 없음.
          if (error.status >= 400 && error.status < 500 && error.status !== 408) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient 는 컴포넌트 외부에서 만들면 SSR/HMR 시점에 공유될 위험이 있어 useState 로 보존.
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
