'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
  const [query_client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime:    10 * 60 * 1000, // 10 minutes
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={query_client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
