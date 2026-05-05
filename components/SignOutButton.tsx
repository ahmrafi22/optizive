"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  className?: string;
  label?: string;
}

export default function SignOutButton({ className = "", label = "Sign out" }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={`inline-flex w-fit items-center justify-center rounded-full border border-[color:var(--clr-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--clr-fg)] transition hover:border-[color:var(--clr-border-hover)] ${className}`}
    >
      {label}
    </button>
  );
}
