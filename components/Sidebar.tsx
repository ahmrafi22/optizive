'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaTruck, FaMoneyBillWave } from "react-icons/fa";
import { TbLayoutDashboardFilled, } from "react-icons/tb";
import { FaCodeCompare, FaBoxesPacking, FaBasketShopping, FaClock } from "react-icons/fa6";

import SignOutButton from './SignOutButton';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: TbLayoutDashboardFilled },
  { label: 'Sales', href: '/sales', icon: FaMoneyBillWave },
  { label: 'Inventory', href: '/inventory', icon: FaBoxesPacking },
  { label: 'Expiry Tracker', href: '/expiry-tracker', icon: FaClock },
  { label: 'Smart Basket', href: '/smart-basket', icon: FaBasketShopping },
  { label: 'Suppliers', href: '/suppliers', icon: FaTruck },
  { label: 'Price Compare', href: '/price-compare', icon: FaCodeCompare },
  { label: 'Profile', href: '/profile', icon: FaUser },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const onMobileCloseRef = useRef(onMobileClose);

  onMobileCloseRef.current = onMobileClose;

  // Collapse when clicking outside (desktop) or close mobile on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        if (window.innerWidth >= 640) {
          setIsExpanded(false);
        }
        onMobileCloseRef.current?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileCloseRef.current?.();
  }, [pathname]);

  function handleSidebarClick(e: React.MouseEvent) {
    // Only expand on desktop when clicking non-interactive areas
    if (window.innerWidth < 640) return;
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, [role="button"]');
    if (!isInteractive && !isExpanded) {
      setIsExpanded(true);
    }
  }

  return (
    <aside
      ref={sidebarRef}
      onClick={handleSidebarClick}
      className={`
        fixed inset-y-0 left-0 z-50 
        flex h-screen flex-col
        bg-(--clr-surface2) text-(--clr-fg)
        border-r border-(--clr-border)
        transition-all duration-300 ease-out
        sm:relative
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        sm:translate-x-0
        w-64
        ${isExpanded ? 'sm:w-64' : 'sm:w-20'}
      `}
      aria-label="Main navigation"
    >
      {/* Header with Logo */}
      <div className="flex items-center h-16 px-4 border-b border-(--clr-border)">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo */}
          <div className="shrink-0 rounded-xl bg-(--clr-yellow) p-2">
            <svg className="w-8 h-8" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
              <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
              <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
            </svg>
          </div>

          {/* Brand Text - always visible on mobile, desktop depends on isExpanded */}
          <span
            className={`
              font-bold font-naston text-xl text-(--clr-fg) tracking-wide
              transition-all duration-300 whitespace-nowrap
              opacity-100 translate-x-0 w-auto
              ${isExpanded ? 'sm:opacity-100 sm:translate-x-0 sm:w-auto' : 'sm:opacity-0 sm:-translate-x-4 sm:w-0 sm:overflow-hidden'}
            `}
          >
            OPTIZIVE
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 relative" aria-label="Sidebar navigation">
        {/* Animated background indicator */}
        <div
          className="absolute left-3 right-3 h-12 bg-(--clr-surface) rounded-full transition-all duration-300 ease-out pointer-events-none"
          style={{
            transform: `translateY(${navItems.findIndex(item => pathname === item.href) * 52}px)`,
            opacity: navItems.some(item => pathname === item.href) ? 1 : 0,
          }}
          aria-hidden="true"
        />

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-3 py-2 rounded-full
                transition-all duration-300 ease-out z-10
                ${
                  isActive
                    ? 'text-(--clr-teal-dim)'
                    : 'text-(--clr-fg-muted) hover:text-(--clr-fg) hover:bg-(--clr-surface)/50'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clr-teal-dim) focus-visible:ring-offset-2
                active:scale-[0.98]
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <span
                className="relative flex items-center justify-center shrink-0 w-8 h-8"
                aria-hidden="true"
              >
                {/* Animated teal background circle */}
                <span
                  className={`
                    absolute inset-0 rounded-full
                    transition-all duration-300 ease-out
                    ${
                      isActive
                        ? 'bg-(--clr-teal-dim) shadow-[0_2px_6px_rgba(58,181,173,0.35)] scale-100'
                        : 'bg-transparent scale-0'
                    }
                  `}
                />
                {/* Icon */}
                <Icon
                  className={`
                    w-5 h-5 relative z-10 transition-colors duration-300
                    ${isActive ? 'text-white' : 'text-(--clr-fg-muted) group-hover:text-(--clr-fg)'}
                  `}
                />
              </span>

              {/* Label - always visible on mobile, desktop depends on isExpanded */}
              <span
                className={`
                  text-sm whitespace-nowrap
                  transition-all duration-300
                  opacity-100 translate-x-0 w-auto
                  ${isActive ? 'font-semibold' : 'font-medium'}
                  ${isExpanded ? 'sm:opacity-100 sm:translate-x-0 sm:w-auto' : 'sm:opacity-0 sm:-translate-x-4 sm:w-0 sm:overflow-hidden'}
                `}
              >
                {item.label}
              </span>

              {/* Tooltip for collapsed state - desktop only */}
              {!isExpanded && (
                <span
                  className="
                    absolute left-full ml-2 px-3 py-2 bg-(--clr-charcoal) text-white text-sm rounded-lg
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 whitespace-nowrap z-50
                    pointer-events-none
                    hidden sm:block
                  "
                  role="tooltip"
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 sm:hidden">
        <SignOutButton className="w-full justify-center" />
      </div>
    </aside>
  );
}
