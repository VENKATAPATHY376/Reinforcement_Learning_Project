import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from './ui/Card';

const toneDot: Record<string, string> = {
  success: 'bg-success',
  accent: 'bg-accent',
  warning: 'bg-warning',
  neutral: 'bg-slate-400',
};

export function InsightsPanel({ insights }: { insights: Array<{ id: string; title: string; detail: string; tone: 'success' | 'accent' | 'warning' | 'neutral' }> }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Key insights"
        description="Executive summary from the latest evaluation run"
      />

      <ul className="divide-y divide-slate-100">
        {insights.map((insight, i) => (
          <motion.li
            key={insight.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
            className="flex gap-3 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-slate-50"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[insight.tone]}`}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium leading-snug text-ink">
                {insight.title}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
                {insight.detail}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}