"use client";

import type { ChangeEvent } from "react";

type InlineInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  size?: "base" | "large";
  [key: string]: unknown;
};

export function InlineInput({ value, onChange, placeholder, size = "base", ...props }: InlineInputProps) {
  const pStr = placeholder || "_______";
  const displayString = value.length > pStr.length ? value : pStr;

  const sizeClasses: Record<"base" | "large", string> = {
    base: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl"
  };

  return (
    <span className="relative inline-block group mx-1 align-baseline">
      <span className={`invisible whitespace-pre px-1 font-sans ${sizeClasses[size]} font-bold italic text-[#1967d2]`}>
        {displayString}
      </span>
      <input
        className={`absolute inset-0 w-full bg-transparent border-b-2 border-dashed border-white/20 text-[#1967d2] placeholder:text-white/20 focus:border-primary focus:border-solid focus:outline-none font-sans ${sizeClasses[size]} text-center font-bold italic transition-all`}
        value={value}
        onChange={onChange}
        placeholder={pStr}
        {...props}
      />
    </span>
  );
}
