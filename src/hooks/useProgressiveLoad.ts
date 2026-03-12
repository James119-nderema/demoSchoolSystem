import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Standard DRF paginated response format.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  // Extra fields that some endpoints attach (e.g. school name)
  [key: string]: unknown;
}

export interface UseProgressiveLoadOptions {
  /** Number of items per page (default: 100) */
  pageSize?: number;
  /** Whether to fetch data (default: true). Set to false to delay loading. */
  enabled?: boolean;
}

export interface UseProgressiveLoadReturn<T> {
  /** Accumulated data from all loaded pages */
  data: T[];
  /** True while loading the first page (show skeleton) */
  loading: boolean;
  /** True while loading pages 2+ in background */
  loadingMore: boolean;
  /** Error message if the initial fetch failed */
  error: string | null;
  /** Total number of items reported by the server */
  totalCount: number;
  /** Number of items loaded so far */
  loadedCount: number;
  /** Loading progress 0–100 */
  progress: number;
  /** True when all pages have been loaded */
  isComplete: boolean;
  /** The first paginated response's extra fields (e.g. school name) */
  meta: Record<string, unknown>;
  /** Re-fetch from page 1 */
  refresh: () => void;
}

/**
 * Progressive data loading hook.
 *
 * Fetches page 1 immediately and displays the results, then continues
 * loading remaining pages in the background. This dramatically reduces
 * time-to-first-content for pages with large datasets.
 *
 * The backend must return standard DRF paginated responses when
 * `?page=X&page_size=Y` query parameters are present.
 *
 * @param fetchPage  Function that fetches a single page of data.
 *                   Receives (page, pageSize) and must return a PaginatedResponse<T>.
 * @param deps       Dependency array – when any value changes, loading restarts from page 1.
 * @param options    Configuration options (pageSize, enabled).
 *
 * @example
 * ```tsx
 * const { data: payments, loading, loadingMore, progress } = useProgressiveLoad<Payment>(
 *   async (page, pageSize) => {
 *     const res = await axios.get('/api/finance/payments/', {
 *       params: { page, page_size: pageSize },
 *       headers: { Authorization: `Bearer ${token}` },
 *     });
 *     return res.data;
 *   },
 *   [], // deps – add filter values here to restart on change
 *   { pageSize: 100 }
 * );
 * ```
 */
export function useProgressiveLoad<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  deps: React.DependencyList = [],
  options: UseProgressiveLoadOptions = {},
): UseProgressiveLoadReturn<T> {
  const { pageSize = 100, enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown>>({});

  // Keep fetchPage ref up-to-date without triggering re-renders
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // Monotonically increasing counter to detect stale async responses
  const generationRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!enabled) return;

    const generation = ++generationRef.current;

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setData([]);
    setIsComplete(false);
    setTotalCount(0);
    setMeta({});

    try {
      // ── First page ─────────────────────────────────────────────
      const firstPage = await fetchPageRef.current(1, pageSize);

      if (generation !== generationRef.current) return; // stale

      setData(firstPage.results);
      setTotalCount(firstPage.count);
      setLoading(false);

      // Extract extra meta fields (e.g. school name)
      const { count: _c, next: _n, previous: _p, results: _r, ...extra } = firstPage;
      if (Object.keys(extra).length > 0) {
        setMeta(extra);
      }

      if (!firstPage.next) {
        setIsComplete(true);
        return;
      }

      // ── Background pages ───────────────────────────────────────
      setLoadingMore(true);
      let page = 2;
      let hasMore = true;

      while (hasMore) {
        if (generation !== generationRef.current) return; // stale

        const nextPage = await fetchPageRef.current(page, pageSize);

        if (generation !== generationRef.current) return; // stale

        setData(prev => [...prev, ...nextPage.results]);

        hasMore = !!nextPage.next;
        page++;
      }

      if (generation === generationRef.current) {
        setLoadingMore(false);
        setIsComplete(true);
      }
    } catch (err: unknown) {
      if (generation !== generationRef.current) return; // stale
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      setLoading(false);
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pageSize, ...deps]);

  useEffect(() => {
    loadData();
    // Cleanup: bump generation so any in-flight fetches become stale
    return () => {
      generationRef.current++;
    };
  }, [loadData]);

  const loadedCount = data.length;
  const progress = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  return {
    data,
    loading,
    loadingMore,
    error,
    totalCount,
    loadedCount,
    progress,
    isComplete,
    meta,
    refresh: loadData,
  };
}
