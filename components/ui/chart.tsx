"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Chart Container
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  initialDimension?: { width: number; height: number };
}

export function ChartContainer({
  children,
  className,
  initialDimension = { width: 400, height: 300 },
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={`relative ${className || ""}`}
      style={{
        width: "100%",
        height: initialDimension.height,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Chart Tooltip Content
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  indicator?: "dot" | "line" | "square";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  labelClassName?: string;
  formatter?: (value: any, name: string, item: any, index: number) => React.ReactNode;
  labelFormatter?: (label: string, payload: any[]) => React.ReactNode;
  className?: string;
}

const indicatorVariants = cva("mr-2 flex-shrink-0", {
  variants: {
    indicator: {
      dot: "h-2 w-2 rounded-full",
      line: "h-0.5 w-4 rounded-full",
      square: "h-2 w-2 rounded-sm",
    },
  },
  defaultVariants: {
    indicator: "dot",
  },
});

export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  labelClassName,
  formatter,
  labelFormatter,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-(--clr-border) bg-(--clr-surface) p-3 shadow-lg ${className || ""}`}
    >
      {!hideLabel && label && (
        <div className={`mb-2 text-xs font-medium text-(--clr-fg-muted) ${labelClassName || ""}`}>
          {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            {!hideIndicator && (
              <div
                className={indicatorVariants({ indicator })}
                style={{ backgroundColor: item.color }}
              />
            )}
            <div className="flex flex-1 items-center justify-between gap-4">
              <span className="text-xs text-(--clr-fg-muted)">{item.name}</span>
              <span className="text-xs font-semibold text-(--clr-fg)">
                {formatter ? formatter(item.value, item.name, item, index) : item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart Legend Content
interface ChartLegendContentProps {
  payload?: any[];
  hideIndicator?: boolean;
  className?: string;
}

export function ChartLegendContent({
  payload,
  hideIndicator = false,
  className,
}: ChartLegendContentProps) {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className || ""}`}>
      {payload.map((item, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          {!hideIndicator && (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="text-xs text-(--clr-fg-muted)">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Chart Tooltip wrapper
export const ChartTooltip = ({ content, ...props }: any) => {
  return <div {...props}>{content}</div>;
};

// Chart Legend wrapper
export const ChartLegend = ({ content, ...props }: any) => {
  return <div {...props}>{content}</div>;
};
