import type { BusinessSize } from '@/prisma/generated/prisma/client';

/* ── UI primitives ── */

export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span
      className={`relative inline-flex w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-gray-400'}`}
    >
      {active && (
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
      )}
    </span>
  );
}

export function CircularProgress({
  value,
  max = 100,
  size = 56,
  stroke = 4,
  color = '#fff44f',
  circleClassName,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  circleClassName?: string;
  children?: React.ReactNode;
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={stroke} className="dark:stroke-[rgba(255,255,255,0.06)]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={circleClassName ? 'currentColor' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={circleClassName}
          style={{ transition: 'stroke-dashoffset 700ms var(--ease-out-strong)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function IconPill({
  icon: Icon,
  label,
  color = 'yellow',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color?: 'yellow' | 'teal' | 'green' | 'blue' | 'purple' | 'red';
}) {
  const map = {
    yellow: 'bg-[rgba(255,244,79,0.2)] text-[#5c5400] border-[rgba(255,244,79,0.4)] dark:bg-[rgba(255,244,79,0.12)] dark:text-[#fff44f] dark:border-[rgba(255,244,79,0.25)]',
    teal: 'bg-[rgba(78,205,196,0.2)] text-[#0a4842] border-[rgba(78,205,196,0.4)] dark:bg-[rgba(78,205,196,0.12)] dark:text-[#4ecdc4] dark:border-[rgba(78,205,196,0.25)]',
    green: 'bg-[rgba(74,222,128,0.2)] text-[#0f7a38] border-[rgba(74,222,128,0.4)] dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ade80] dark:border-[rgba(74,222,128,0.25)]',
    blue: 'bg-[rgba(96,165,250,0.2)] text-[#1e40af] border-[rgba(96,165,250,0.4)] dark:bg-[rgba(96,165,250,0.12)] dark:text-[#60a5fa] dark:border-[rgba(96,165,250,0.25)]',
    purple: 'bg-[rgba(167,139,250,0.2)] text-[#6d28d9] border-[rgba(167,139,250,0.4)] dark:bg-[rgba(167,139,250,0.12)] dark:text-[#a78bfa] dark:border-[rgba(167,139,250,0.25)]',
    red: 'bg-[rgba(248,113,113,0.2)] text-[#b91c1c] border-[rgba(248,113,113,0.4)] dark:bg-[rgba(248,113,113,0.12)] dark:text-[#f87171] dark:border-[rgba(248,113,113,0.25)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[color]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function GlowCard({
  title,
  icon: Icon,
  children,
  className = '',
  glowColor = 'yellow',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  glowColor?: 'yellow' | 'teal' | 'green' | 'blue' | 'purple';
}) {
  const glows = {
    yellow: 'from-[rgba(255,244,79,0.35)] dark:from-[rgba(255,244,79,0.18)]',
    teal: 'from-[rgba(78,205,196,0.35)] dark:from-[rgba(78,205,196,0.18)]',
    green: 'from-[rgba(74,222,128,0.35)] dark:from-[rgba(74,222,128,0.18)]',
    blue: 'from-[rgba(96,165,250,0.35)] dark:from-[rgba(96,165,250,0.18)]',
    purple: 'from-[rgba(167,139,250,0.35)] dark:from-[rgba(167,139,250,0.18)]',
  };
  const iconBgs = {
    yellow: 'bg-[rgba(255,244,79,0.2)] dark:bg-[rgba(255,244,79,0.12)]',
    teal: 'bg-[rgba(78,205,196,0.2)] dark:bg-[rgba(78,205,196,0.12)]',
    green: 'bg-[rgba(74,222,128,0.2)] dark:bg-[rgba(74,222,128,0.12)]',
    blue: 'bg-[rgba(96,165,250,0.2)] dark:bg-[rgba(96,165,250,0.12)]',
    purple: 'bg-[rgba(167,139,250,0.2)] dark:bg-[rgba(167,139,250,0.12)]',
  };
  const iconColors = {
    yellow: 'text-[#5c5400] dark:text-(--clr-yellow)',
    teal: 'text-[#0a4842] dark:text-(--clr-teal)',
    green: 'text-[#0f7a38] dark:text-emerald-400',
    blue: 'text-[#1e40af] dark:text-blue-400',
    purple: 'text-[#6d28d9] dark:text-purple-400',
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-6 ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${glows[glowColor]} to-transparent`} />
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-8 h-8 rounded-full ${iconBgs[glowColor]} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColors[glowColor]}`} />
          </div>
          <h3 className="text-sm font-bold text-(--clr-fg) uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({
  label,
  value,
  max = 100,
  color = '#fff44f',
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest">
          {label}
        </span>
        <span className="text-[10px] font-bold text-(--clr-fg) tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.1)] dark:bg-(--clr-border) overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent = 'yellow',
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  accent?: 'yellow' | 'teal' | 'green' | 'blue' | 'purple';
  onClick?: () => void;
}) {
  const accents = {
    yellow: 'bg-[rgba(255,244,79,0.2)] text-[#5c5400] dark:bg-[rgba(255,244,79,0.12)] dark:text-(--clr-yellow)',
    teal: 'bg-[rgba(78,205,196,0.2)] text-[#0a4842] dark:bg-[rgba(78,205,196,0.12)] dark:text-(--clr-teal)',
    green: 'bg-[rgba(74,222,128,0.2)] text-[#0f7a38] dark:bg-[rgba(74,222,128,0.12)] dark:text-emerald-400',
    blue: 'bg-[rgba(96,165,250,0.2)] text-[#1e40af] dark:bg-[rgba(96,165,250,0.12)] dark:text-blue-400',
    purple: 'bg-[rgba(167,139,250,0.2)] text-[#6d28d9] dark:bg-[rgba(167,139,250,0.12)] dark:text-purple-400',
  };
  return (
    <div className={`bento-card p-5 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-(--clr-fg)">{value}</p>
      {subValue && <p className="text-xs text-(--clr-fg-dim) mt-1">{subValue}</p>}
    </div>
  );
}


export function Avatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-20 h-20 rounded-2xl bg-(--clr-yellow) flex items-center justify-center text-(--clr-charcoal) text-2xl font-bold shrink-0 overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export function Badge({
  children,
  color = 'yellow',
}: {
  children: React.ReactNode;
  color?: 'yellow' | 'teal' | 'green' | 'red' | 'blue' | 'purple';
}) {
  const map = {
    yellow:
      'bg-[rgba(255,244,79,0.25)] text-[#5c5400] dark:text-[#fff44f] border-[rgba(255,244,79,0.5)] dark:border-[rgba(255,244,79,0.3)]',
    teal:
      'bg-[rgba(78,205,196,0.25)] text-[#0a4842] dark:text-[#4ecdc4] border-[rgba(78,205,196,0.5)] dark:border-[rgba(78,205,196,0.3)]',
    green:
      'bg-[rgba(74,222,128,0.25)] text-[#0f7a38] dark:text-[#4ade80] border-[rgba(74,222,128,0.5)] dark:border-[rgba(74,222,128,0.3)]',
    red: 'bg-[rgba(248,113,113,0.25)] text-[#b91c1c] dark:text-[#f87171] border-[rgba(248,113,113,0.5)] dark:border-[rgba(248,113,113,0.3)]',
    blue:
      'bg-[rgba(96,165,250,0.25)] text-[#1e40af] dark:text-[#60a5fa] border-[rgba(96,165,250,0.5)] dark:border-[rgba(96,165,250,0.3)]',
    purple:
      'bg-[rgba(167,139,250,0.25)] text-[#6d28d9] dark:text-[#a78bfa] border-[rgba(167,139,250,0.5)] dark:border-[rgba(167,139,250,0.3)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[color]}`}
    >
      {children}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-(--clr-surface) border border-(--clr-border) text-(--clr-fg-muted) hover:border-(--clr-border-hover) transition-colors">
      {children}
    </span>
  );
}

export function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 mt-0.5 text-(--clr-fg-dim) shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-medium text-(--clr-fg) mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-6 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(96,165,250,0.2)] dark:bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#1e40af] dark:text-(--clr-yellow)" />
        </div>
        <h3 className="text-sm font-bold text-(--clr-fg) uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 hover:border-(--clr-border-hover) transition-colors">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,244,79,0.2)] dark:bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#5c5400] dark:text-(--clr-yellow)" />
        </div>
        <span className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-(--clr-fg)">{value}</p>
      {subValue && <p className="text-xs text-(--clr-fg-dim) mt-1">{subValue}</p>}
    </div>
  );
}

export function SizeVisualizer({ size }: { size?: BusinessSize | null }) {
  const sizes: { key: BusinessSize; label: string }[] = [
    { key: 'SMALL', label: 'Small' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LARGE', label: 'Large' },
    { key: 'ENTERPRISE', label: 'Enterprise' },
  ];
  const activeIdx = size ? sizes.findIndex((s) => s.key === size) : -1;
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {sizes.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
              i <= activeIdx
                ? 'bg-(--clr-teal)'
                : 'bg-[rgba(0,0,0,0.1)] dark:bg-(--clr-border)'
            } ${
              i === activeIdx
                ? 'ring-2 ring-(--clr-teal) ring-offset-2 ring-offset-(--clr-surface2)'
                : ''
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {sizes.map((s, i) => (
          <span
            key={s.key}
            className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              i === activeIdx ? 'text-(--clr-teal)' : 'text-(--clr-fg-dim)'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RatingDisplay({ rating, total }: { rating: number; total: number }) {
  const pct = Math.min((rating / 5) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <div className="text-3xl font-bold text-(--clr-fg) tabular-nums">
        {rating.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-[rgba(0,0,0,0.1)] dark:bg-(--clr-border) overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-(--clr-yellow) to-(--clr-teal) transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-(--clr-fg-dim) mt-1">
          {total.toLocaleString()} rated transactions
        </p>
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-(--clr-fg-dim)" htmlFor={htmlFor}>
      {label}
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-[11px] text-(--clr-fg-muted)">{hint}</p>}
    </label>
  );
}

export function OptionPill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] transition-transform duration-150 ${
        checked
          ? 'border-(--clr-yellow) bg-[rgba(255,244,79,0.16)] text-(--clr-yellow)'
          : 'border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-muted)'
      }`}
    >
      {label}
    </button>
  );
}
