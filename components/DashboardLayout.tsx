'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { PriceCompareProvider } from '@/app/(user-routes)/price-compare/_components/PriceCompareContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-(--clr-surface) text-(--clr-fg)">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <TopBar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <div className="container mx-auto px-6 py-8">
          <PriceCompareProvider>
            {children}
          </PriceCompareProvider>
        </div>
      </main>
    </div>
  );
}
