'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuMenu, LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import SignOutButton from './SignOutButton';

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const user = session?.user;
  const userImage = user?.image;
  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OP';

  return (
    <header className="sticky top-0 z-50 grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-(--clr-border) bg-(--clr-surface)/80 backdrop-blur-md px-4 sm:flex">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--clr-border) text-(--clr-fg) transition-colors hover:border-(--clr-border-hover) sm:hidden"
        aria-label="Open menu"
      >
        <LuMenu className="h-5 w-5" />
      </button>

      <span className="justify-self-center font-naston text-lg font-bold tracking-wide text-(--clr-fg) sm:hidden">
        OPTIZIVE
      </span>

      <div className="justify-self-end flex items-center gap-3 sm:ml-auto">
        <Link
          href="/profile"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg) transition-colors hover:border-(--clr-border-hover) overflow-hidden"
          aria-label="Go to profile"
        >
          {userImage ? (
            <img
              src={userImage}
              alt={user?.name ?? 'Profile'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold tracking-wide">{userInitials}</span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg) transition-colors hover:border-(--clr-border-hover)"
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
