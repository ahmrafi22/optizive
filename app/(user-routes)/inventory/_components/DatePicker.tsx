"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuCalendar } from "react-icons/lu";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateValue(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseDateValue(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

export function DatePicker({ value, onChange, disabled, placeholder = "Pick a date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseDateValue(value);
  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [parsed]);

  const openCalendar = useCallback(() => {
    if (disabled) return;
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    } else {
      setViewYear(today.year);
      setViewMonth(today.month);
    }
    setIsOpen(true);
  }, [disabled, parsed, today]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback(
    (day: number) => {
      onChange(formatDateValue(viewYear, viewMonth, day));
      setIsOpen(false);
    },
    [onChange, viewYear, viewMonth],
  );

  const clearDate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setIsOpen(false);
    },
    [onChange],
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const displayText = parsed
    ? `${MONTH_NAMES[parsed.month].slice(0, 3)} ${parsed.day}, ${parsed.year}`
    : placeholder;

  const inputBase =
    "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={openCalendar}
        disabled={disabled}
        className={`${inputBase} mt-2 flex items-center justify-between gap-2 text-left ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-(--clr-border-hover)"}`}
      >
        <span className={parsed ? "text-(--clr-fg)" : "text-(--clr-fg-dim)"}>
          {displayText}
        </span>
        <LuCalendar className="h-4 w-4 text-(--clr-fg-muted) shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) shadow-2xl p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="active:scale-[0.92] transition-transform rounded-lg p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg) transition-colors"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-(--clr-fg) tracking-wide">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="active:scale-[0.92] transition-transform rounded-lg p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg) transition-colors"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-(--clr-fg-dim)"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} />;
              }

              const isSelected =
                parsed &&
                parsed.year === viewYear &&
                parsed.month === viewMonth &&
                parsed.day === day;

              const isToday =
                today.year === viewYear &&
                today.month === viewMonth &&
                today.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    relative h-8 w-full rounded-lg text-xs font-medium transition-all duration-150
                    ${isSelected
                      ? "bg-(--clr-yellow) text-(--clr-charcoal) font-bold shadow-sm"
                      : isToday
                        ? "bg-(--clr-yellow)/15 text-(--clr-yellow) font-semibold"
                        : "text-(--clr-fg) hover:bg-(--clr-surface) hover:text-(--clr-fg)"
                    }
                    active:scale-[0.92]
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-(--clr-border)">
            <button
              type="button"
              onClick={() => {
                onChange(formatDateValue(today.year, today.month, today.day));
                setIsOpen(false);
              }}
              className="text-[11px] font-semibold text-(--clr-yellow) hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={clearDate}
                className="text-[11px] font-semibold text-red-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
