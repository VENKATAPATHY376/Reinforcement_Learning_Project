import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-full w-full bg-canvas">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {navOpen ?
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
          
            <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setNavOpen(false)}
            aria-hidden="true" />
          
            <motion.div
            className="absolute inset-y-0 left-0"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>
            
              <Sidebar onNavigate={() => setNavOpen(false)} onClose={() => setNavOpen(false)} />
            </motion.div>
          </motion.div> :
        null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>);

}