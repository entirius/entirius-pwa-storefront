import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";

type PrefetchEntry = {
  queryKey: unknown[];
  queryFn: () => Promise<unknown>;
  seed?: (result: unknown, queryClient: QueryClient) => void;
};

interface Props {
  prefetches: PrefetchEntry[];
  children: React.ReactNode;
}

export async function PrefetchBoundary({ prefetches, children }: Props) {
  const query_client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 10 * 60 * 1000 },
    },
  });

  await Promise.all(
    prefetches.map(async ({ queryKey, queryFn, seed }) => {
      await query_client.prefetchQuery({ queryKey, queryFn });
      if (seed) {
        const result = query_client.getQueryData(queryKey);
        seed(result, query_client);
      }
    }),
  );
  return (
    <HydrationBoundary state={dehydrate(query_client)}>
      {children}
    </HydrationBoundary>
  );
}
