'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuMenu, LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import SignOutButton from './SignOutButton';

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-[color:var(--clr-border)] bg-[color:var(--clr-surface)] px-4 sm:flex">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--clr-border)] text-[color:var(--clr-fg)] transition-colors hover:border-[color:var(--clr-border-hover)] sm:hidden"
        aria-label="Open menu"
      >
        <LuMenu className="h-5 w-5" />
      </button>

      <span className="justify-self-center font-naston text-lg font-bold tracking-wide text-[color:var(--clr-fg)] sm:hidden">
        OPTIZIVE
      </span>

      <div className="justify-self-end flex items-center gap-3 sm:ml-auto">
        <Link
          href="/profile"
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] text-[color:var(--clr-fg)] transition-colors hover:border-[color:var(--clr-border-hover)]"
          aria-label="Go to profile"
        >
          <span className="text-xs font-semibold tracking-wide">OP</span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] text-[color:var(--clr-fg)] transition-colors hover:border-[color:var(--clr-border-hover)]"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          disabled={!mounted}
        >
          {isDark ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />}
        </button>

        <div className="hidden sm:block">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
