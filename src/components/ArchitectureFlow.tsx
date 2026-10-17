import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { architectureSteps } from '../data/metrics';
import { Card, CardHeader } from './ui/Card';

const stageTone: Record<string, string> = {
  Data: 'text-slate-500 bg-slate-100',
  Environment: 'text-accent-hover bg-accent-soft',
  Agents: 'text-emerald-700 bg-emerald-50',
  Analysis: 'text-amber-700 bg-amber-50',
  Delivery: 'text-accent-hover bg-accent-soft'
};

export function ArchitectureFlow() {
  return (
    <Card as="section">
      <CardHeader
        headingLevel="h2"
        title="Project architecture"
        description="From synthetic dataset generation through to the business dashboard" />
      
      <div className="px-5 py-5">
        <ol className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
          {architectureSteps.map((step, i) =>
          <li key={step.id} className="relative flex">
              <div className="group flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-smooth hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift">
                <div className="flex items-center justify-between gap-2">
                  <span className="tabular text-[11px] font-semibold text-slate-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${stageTone[step.stage]}`}>
                  
                    {step.stage}
                  </span>
                </div>
                <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-ink">
                  {step.title}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{step.detail}</p>
              </div>
              {i < architectureSteps.length - 1 && i % 4 !== 3 ?
            <span
              className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 xl:block"
              aria-hidden="true">
              
                  <ArrowRightIcon className="h-4 w-4" />
                </span> :
            null}
            </li>
          )}
        </ol>
      </div>
    </Card>);

}