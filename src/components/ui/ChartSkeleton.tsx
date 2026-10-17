import React, { useEffect, useState } from 'react';

/** Shows a skeleton for a short beat while chart data is prepared. */
export function useDataReady(delay = 550) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  return ready;
}

interface ChartSkeletonProps {
  height?: number;
  bars?: number;
}

export function ChartSkeleton({ height = 260, bars = 12 }: ChartSkeletonProps) {
  return (
    <div className="flex items-end gap-2" style={{ height }} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) =>
      <div
        key={i}
        className="flex-1 animate-pulse rounded-t-md bg-slate-100"
        style={{
          height: `${32 + i * 37 % 58}%`,
          animationDelay: `${i * 45}ms`
        }} />

      )}
    </div>);

}

export function LoadingLabel({ children = 'Loading data' }: {children?: React.ReactNode;}) {
  return (
    <p role="status" className="text-[12.5px] text-muted">
      {children}
      <span className="ml-1 inline-flex gap-0.5">
        <span className="h-1 w-1 animate-pulse rounded-full bg-slate-400" />
      </span>
    </p>);

}