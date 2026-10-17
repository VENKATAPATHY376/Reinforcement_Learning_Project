import React, { useState } from 'react';
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  MenuIcon,
  SearchIcon } from
'lucide-react';
import { Button } from '../ui/Button';

const ranges = ['Last 7 days', 'Last 30 days', 'Last quarter', 'Jan 1 – Dec 31, 2026'];

interface TopHeaderProps {
  onOpenNav: () => void;
}

export function TopHeader({ onOpenNav }: TopHeaderProps) {
  const [range, setRange] = useState(ranges[3]);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          className="rounded-xl p-2 text-muted transition-colors duration-150 ease-smooth hover:bg-slate-100 hover:text-ink lg:hidden"
          aria-label="Open navigation">
          
          <MenuIcon className="h-5 w-5" />
        </button>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
          
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true" />
          
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search products, experiments, insights…"
            aria-label="Search"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13.5px] text-ink outline-none transition-colors duration-150 ease-smooth placeholder:text-slate-400 focus:border-accent focus:bg-white" />
          
        </form>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setRangeOpen((v) => !v)}
              aria-expanded={rangeOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-smooth hover:border-slate-300 hover:bg-slate-50">
              
              <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="hidden sm:inline">{range}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </button>
            {rangeOpen ?
            <ul
              role="listbox"
              aria-label="Date range"
              className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift">
              
                {ranges.map((r) =>
              <li key={r}>
                    <button
                  type="button"
                  role="option"
                  aria-selected={r === range}
                  onClick={() => {
                    setRange(r);
                    setRangeOpen(false);
                  }}
                  className={[
                  'w-full px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-smooth hover:bg-slate-50',
                  r === range ? 'font-medium text-accent-hover' : 'text-ink'].
                  join(' ')}>
                  
                      {r}
                    </button>
                  </li>
              )}
              </ul> :
            null}
          </div>

          <button
            type="button"
            className="relative rounded-xl border border-slate-200 bg-white p-2 text-muted transition-colors duration-150 ease-smooth hover:border-slate-300 hover:text-ink"
            aria-label="Notifications, 3 unread">
            
            <BellIcon className="h-[17px] w-[17px]" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          </button>

          <Button size="sm" className="hidden py-2 sm:inline-flex">
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
            Export Report
          </Button>

          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-hover">
              JD
            </span>
            <span className="hidden leading-tight lg:block">
              <span className="block text-[13px] font-medium text-ink">John Doe</span>
              <span className="block text-[11px] text-muted">Revenue Analyst</span>
            </span>
          </div>
        </div>
      </div>
    </header>);

}