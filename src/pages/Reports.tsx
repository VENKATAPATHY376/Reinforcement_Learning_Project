import React, { useState } from 'react';
import {
  CheckIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  Loader2Icon } from
'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAnalysisReportUrl, fetchAnalysisReports } from '../utils/api';
import { useAnalysis } from '../utils/useAnalysis';
import { AsyncBanner } from '../components/AsyncBanner';

function iconFor(format: string) {
  return format === 'CSV' ? FileSpreadsheetIcon : FileTextIcon;
}

export function Reports() {
  const { data, loading, error } = useAnalysis(fetchAnalysisReports);
  const [active, setActive] = useState<string | null>(null);

  const reports = data?.reports ?? [];
  const available = reports.filter((r) => r.available);

  const download = (id: string, filename: string) => {
    setActive(id);
    const url = getAnalysisReportUrl(id);
    // FileResponse sets Content-Disposition, so navigating triggers a download.
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => setActive((cur) => (cur === id ? null : cur)), 900);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Exports & deliverables"
        subtitle="Download the real evaluation artefacts behind the dashboard — served straight from the backend." />
      

      <AsyncBanner error={error} loading={loading} label="Listing model artifacts on the server…" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = iconFor(report.format);
          const busy = active === report.id;
          return (
            <Card key={report.id} className="flex h-full flex-col p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-hover">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {report.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{report.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-[12.5px]">
                <div>
                  <dt className="text-muted">Size</dt>
                  <dd className="mt-0.5 font-medium text-ink">{report.size}</dd>
                </div>
                <div>
                  <dt className="text-muted">Format</dt>
                  <dd className="mt-0.5 font-medium text-ink">{report.format}</dd>
                </div>
              </dl>
              <p className="mt-2 break-all text-[12px] text-muted">{report.filename}</p>
              <p className="mt-1 text-[12px] text-muted">Updated {report.updated}</p>

              <div className="mt-5 flex flex-wrap gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!report.available || busy}
                  onClick={() => download(report.id, report.filename)}>
                  
                  {busy ?
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> :

                  <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  }
                  {report.available ? (busy ? 'Preparing…' : `Download ${report.format}`) : 'Unavailable'}
                </Button>
                <Button
                  size="sm"
                  disabled={!report.available || busy}
                  onClick={() => download(report.id, report.filename)}>
                  
                  {busy ?
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> :

                  <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                  }
                  Download
                </Button>
              </div>
            </Card>);

        })}
      </div>

      {reports.length === 0 && !loading &&
      <Card className="p-10 text-center text-[13.5px] text-muted">
          No artifacts were found in the backend <code>models/</code> directory.
        </Card>
      }

      <Card as="section">
        <CardHeader
          headingLevel="h2"
          title="Artifacts available"
          description="Files discovered in the backend models directory" />
        
        <ul className="divide-y divide-slate-100">
          {available.map((report) => {
            const Icon = iconFor(report.format);
            return (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                {report.format === 'CSV' ?
                <FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> :

                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                }
                <span className="break-all text-[13.5px] font-medium text-ink">{report.filename}</span>
                <span className="text-[12.5px] text-muted">{report.size}</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-muted">
                  {active === report.id ?
                  <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden="true" /> :

                  null}
                  {report.updated}
                </span>
              </li>);

          })}
          {available.length === 0 &&
          <li className="px-5 py-8 text-center text-[13px] text-muted">No files available.</li>
          }
        </ul>
      </Card>
    </div>);

}
