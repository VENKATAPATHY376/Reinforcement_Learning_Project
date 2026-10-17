import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAnalysis<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    fetcher()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Request failed' });
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}