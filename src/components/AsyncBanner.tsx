import React from 'react';

interface AsyncBannerProps {
  error: string | null;
  loading: boolean;
  label?: string;
}

export function AsyncBanner({ error, loading, label = 'Loading analysis...' }: AsyncBannerProps) {
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
        Could not reach the analysis API ({error}). Start the backend with
        <code className="rounded bg-amber-100 px-1 py-0.5">uvicorn main:app --port 8000</code> and refresh.
      </div>
    );
  }
  if (loading) {
    return (
      <div role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-muted">
        {label}
      </div>
    );
  }
  return null;
}