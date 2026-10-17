import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const fieldClass =
'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors duration-150 ease-smooth focus:border-accent focus:ring-2 focus:ring-accent/20';

const toggles = [
{
  id: 'auto-deploy',
  label: 'Auto-deploy best model',
  detail: 'Promote the top-ranked policy to production after each evaluation run.',
  on: true
},
{
  id: 'guardrails',
  label: 'Price guardrails',
  detail: 'Cap recommendations to ±35% of the current list price.',
  on: true
},
{
  id: 'alerts',
  label: 'Revenue drop alerts',
  detail: 'Notify the pricing team if uplift falls below 10% for two cycles.',
  on: false
}];


export function Settings() {
  const [state, setState] = useState(() =>
  toggles.reduce<Record<string, boolean>>((acc, t) => ({ ...acc, [t.id]: t.on }), {})
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Control how the pricing policy is deployed, guarded and reported across your catalogue." />
      

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader headingLevel="h2" title="Policy configuration" />
          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="model">
                Active model
              </label>
              <select id="model" className={fieldClass} defaultValue="DQN (v2.4.1)">
                <option>DQN (v2.4.1)</option>
                <option>PPO (v1.8.0)</option>
                <option>Random baseline</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="currency">
                Reporting currency
              </label>
              <select id="currency" className={fieldClass} defaultValue="INR (₹)">
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="episodes">
                Episodes per run
              </label>
              <input id="episodes" type="number" defaultValue={50} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="cadence">
                Retraining cadence
              </label>
              <select id="cadence" className={fieldClass} defaultValue="Weekly">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <Button type="submit" size="sm" className="py-2">Save changes</Button>
              <Button type="reset" variant="secondary" size="sm" className="py-2">
                Reset
              </Button>
              <Badge tone="neutral" className="ml-auto">Last saved 2 hours ago</Badge>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader headingLevel="h2" title="Automation" />
          <ul className="divide-y divide-slate-100">
            {toggles.map((t) =>
            <li key={t.id} className="flex items-start gap-3 px-5 py-4">
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-ink">{t.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
                    {t.detail}
                  </span>
                </span>
                <button
                type="button"
                role="switch"
                aria-checked={state[t.id]}
                aria-label={t.label}
                onClick={() => setState((s) => ({ ...s, [t.id]: !s[t.id] }))}
                className={[
                'relative ml-auto mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ease-smooth',
                state[t.id] ? 'bg-accent' : 'bg-slate-200'].
                join(' ')}>
                
                  <span
                  className={[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-smooth',
                  state[t.id] ? 'translate-x-[18px]' : 'translate-x-0.5'].
                  join(' ')} />
                
                </button>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>);

}