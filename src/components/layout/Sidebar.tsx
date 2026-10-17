import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BeakerIcon,
  FileTextIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  SettingsIcon,
  SparklesIcon,
  TagIcon,
  XIcon } from
'lucide-react';

export const navItems = [
{ to: '/', label: 'Overview', icon: LayoutDashboardIcon },
{ to: '/revenue', label: 'Revenue Analytics', icon: LineChartIcon },
{ to: '/models', label: 'Model Performance', icon: GaugeIcon },
{ to: '/strategy', label: 'Pricing Strategy', icon: TagIcon },
{ to: '/experiments', label: 'Experiments', icon: BeakerIcon },
{ to: '/reports', label: 'Reports', icon: FileTextIcon },
{ to: '/settings', label: 'Settings', icon: SettingsIcon }];


interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  return (
    <div className="flex h-full w-[264px] flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <SparklesIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold leading-tight text-white">PriceOpt</span>
          <span className="block truncate text-[11px] leading-tight text-sidebar-text">
            Dynamic Pricing Platform
          </span>
        </span>
        {onClose ?
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-sidebar-text transition-colors duration-150 ease-smooth hover:bg-sidebar-hover hover:text-white lg:hidden"
          aria-label="Close navigation">
          
            <XIcon className="h-4 w-4" />
          </button> :
        null}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) =>
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
          [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150 ease-smooth',
          isActive ?
          'bg-accent text-white' :
          'text-sidebar-text hover:bg-sidebar-hover hover:text-white'].
          join(' ')
          }>
          
            {({ isActive }) =>
          <>
                <item.icon
              className={[
              'h-[17px] w-[17px] shrink-0',
              isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'].
              join(' ')}
              aria-hidden="true" />
            
                <span className="whitespace-nowrap">{item.label}</span>
              </>
          }
          </NavLink>
        )}
      </nav>

      <div className="m-3 rounded-2xl bg-sidebar-hover p-4">
        <p className="text-[13px] font-semibold text-white">Optimize today</p>
        <p className="mt-1 text-[12px] leading-relaxed text-sidebar-text">
          DQN is live on 10 SKUs. Roll the policy out to a new category from Pricing Strategy.
        </p>
      </div>

      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[11px] text-slate-500">v2.4.1 · Model registry synced</p>
      </div>
    </div>);

}