"use client";

import type { ChangeEvent } from "react";
import type { SelectOption } from "./types";

type InlineSelectProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "base" | "large";
};

export function InlineSelect({ value, onChange, options, placeholder, size = "base" }: InlineSelectProps) {
  const label = options.find((o) => o.value === value)?.label || options.find((o) => o.value === value)?.title || placeholder || "_______";

  const sizeClasses: Record<"base" | "large", string> = {
    base: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl"
  };

  return (
    <span className="relative inline-block cursor-pointer group mx-1 align-baseline">
      <span className={`invisible whitespace-pre px-4 font-sans ${sizeClasses[size]} font-bold italic text-[#1967d2]`}>{label}</span>
      <select
        className={`absolute inset-0 w-full appearance-none bg-transparent border-b-2 border-dashed border-white/20 text-[#1967d2] focus:outline-none focus:border-primary focus:border-solid cursor-pointer font-sans ${sizeClasses[size]} text-center font-bold italic transition-all`}
        value={value}
        onChange={onChange}
      >
        <option value="" disabled className="bg-[#111] font-sans text-base text-zinc-400 italic">{placeholder || "_______"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#111] font-sans text-base text-white">
            {o.label || o.title}
          </option>
        ))}
      </select>
      <span className="absolute right-0 top-[60%] -translate-y-1/2 pointer-events-none text-white/30 text-[10px] group-hover:text-[#1967d2] transition-colors">▼</span>
    </span>
  );
}
