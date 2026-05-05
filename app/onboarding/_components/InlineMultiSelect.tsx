"use client";

import { useState, useRef } from "react";
import type { SelectOption } from "./types";

type InlineMultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "base" | "large";
};

export function InlineMultiSelect({ values, onChange, options, placeholder, size = "base" }: InlineMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const matched = options.find((o) => o.label?.toLowerCase() === inputValue.toLowerCase());
      if (matched) {
        if (!values.includes(matched.value)) {
          onChange([...values, matched.value]);
          setInputValue("");
        }
      } else if (inputValue.trim()) {
        if (!values.includes(inputValue.trim())) {
          onChange([...values, inputValue.trim()]);
          setInputValue("");
        }
      }
    } else if (e.key === "Backspace" && inputValue === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const filteredOptions = options.filter((o) =>
    o.label?.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(o.value)
  );

  const pStr = values.length === 0 ? (placeholder || "_______") : "...";
  const displayString = inputValue.length > pStr.length ? inputValue : pStr;

  const sizeClasses: Record<"base" | "large", string> = {
    base: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl"
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2 align-middle mx-1 relative">
      {values.map((val: string) => {
        const option = options.find((o) => o.value === val);
        return (
          <span key={val} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-[#1967d2] px-3 py-1 font-sans text-sm font-bold italic border border-primary/20 hover:border-primary/50 transition-colors relative top-[1px]">
            {option?.label || val}
            <button
              type="button"
              onClick={() => onChange(values.filter((v: string) => v !== val))}
              className="text-[#1967d2]/70 hover:text-white ml-1 flex items-center justify-center focus:outline-none"
            >
              &times;
            </button>
          </span>
        );
      })}
      <span className="relative inline-block group">
        <span className={`invisible whitespace-pre px-1 font-sans ${sizeClasses[size]} font-bold italic text-[#1967d2]`}>
          {displayString}
        </span>
        <input
          ref={inputRef}
          className={`absolute inset-0 w-full bg-transparent border-b-2 border-dashed border-white/20 text-[#1967d2] placeholder:text-white/20 focus:border-primary focus:border-solid focus:outline-none font-sans ${sizeClasses[size]} text-center font-bold italic transition-all`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={pStr}
        />
        {isOpen && (filteredOptions.length > 0 || (inputValue.trim() && !options.find((o) => o.label?.toLowerCase() === inputValue.toLowerCase()))) && (
          <div className="absolute top-[calc(100%+8px)] left-0 max-h-48 overflow-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 p-1 flex flex-col min-w-[220px] text-left text-base font-medium">
            {filteredOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                className="text-left px-3 py-2 text-zinc-300 font-sans text-base italic hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange([...values, o.value]);
                  setInputValue("");
                  inputRef.current?.focus();
                }}
              >
                {o.label}
              </button>
            ))}
            {inputValue.trim() && !options.find((o) => o.label?.toLowerCase() === inputValue.toLowerCase()) && !values.includes(inputValue.trim()) && (
              <button
                type="button"
                className="text-left px-3 py-2 text-[#1967d2] font-sans text-base italic hover:bg-white/5 rounded-lg transition-colors border-t border-white/5 mt-1"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange([...values, inputValue.trim()]);
                  setInputValue("");
                  inputRef.current?.focus();
                }}
              >
                Add "{inputValue.trim()}"...
              </button>
            )}
          </div>
        )}
      </span>
      <span className="pointer-events-none absolute right-[-14px] text-white/30 text-[10px] opacity-0 group-focus-within:opacity-100 transition-opacity">▼</span>
    </span>
  );
}
