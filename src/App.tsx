import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Overview } from './pages/Overview';
import { RevenueAnalytics } from './pages/RevenueAnalytics';
import { ModelPerformance } from './pages/ModelPerformance';
import { PricingStrategy } from './pages/PricingStrategy';
import { Experiments } from './pages/Experiments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/revenue" element={<RevenueAnalytics />} />
          <Route path="/models" element={<ModelPerformance />} />
          <Route path="/strategy" element={<PricingStrategy />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>);

}