import type { BusinessSize } from '@/prisma/generated/prisma/client';

/* ── UI primitives ── */

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
    <div className="w-20 h-20 rounded-2xl bg-[color:var(--clr-yellow)] flex items-center justify-center text-[color:var(--clr-charcoal)] text-2xl font-bold flex-shrink-0 overflow-hidden">
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
      'bg-[rgba(255,244,79,0.15)] text-[#7a6d00] dark:text-[#fff44f] border-[rgba(255,244,79,0.3)]',
    teal:
      'bg-[rgba(78,205,196,0.15)] text-[#0f5c56] dark:text-[#4ecdc4] border-[rgba(78,205,196,0.3)]',
    green:
      'bg-[rgba(74,222,128,0.15)] text-[#16a34a] dark:text-[#4ade80] border-[rgba(74,222,128,0.3)]',
    red: 'bg-[rgba(248,113,113,0.15)] text-[#dc2626] dark:text-[#f87171] border-[rgba(248,113,113,0.3)]',
    blue:
      'bg-[rgba(96,165,250,0.15)] text-[#1d4ed8] dark:text-[#60a5fa] border-[rgba(96,165,250,0.3)]',
    purple:
      'bg-[rgba(167,139,250,0.15)] text-[#7c3aed] dark:text-[#a78bfa] border-[rgba(167,139,250,0.3)]',
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
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[color:var(--clr-surface)] border border-(--clr-border) text-[color:var(--clr-fg-muted)] hover:border-[color:var(--clr-border-hover)] transition-colors">
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
      <Icon className="w-4 h-4 mt-0.5 text-[color:var(--clr-fg-dim)] flex-shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-medium text-[color:var(--clr-fg)] mt-0.5">{value}</p>
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
      className={`rounded-2xl border border-(--clr-border) bg-[color:var(--clr-surface2)] p-6 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[color:var(--clr-yellow)]" />
        </div>
        <h3 className="text-sm font-bold text-[color:var(--clr-fg)] uppercase tracking-wider">
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
    <div className="rounded-2xl border border-(--clr-border) bg-[color:var(--clr-surface2)] p-5 hover:border-[color:var(--clr-border-hover)] transition-colors">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[color:var(--clr-yellow)]" />
        </div>
        <span className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-[color:var(--clr-fg)]">{value}</p>
      {subValue && <p className="text-xs text-[color:var(--clr-fg-dim)] mt-1">{subValue}</p>}
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
                ? 'bg-[color:var(--clr-teal)]'
                : 'bg-[color:var(--clr-border)]'
            } ${
              i === activeIdx
                ? 'ring-2 ring-[color:var(--clr-teal)] ring-offset-2 ring-offset-[color:var(--clr-surface2)]'
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
              i === activeIdx ? 'text-[color:var(--clr-teal)]' : 'text-[color:var(--clr-fg-dim)]'
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
      <div className="text-3xl font-bold text-[color:var(--clr-fg)] tabular-nums">
        {rating.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-[color:var(--clr-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--clr-yellow)] to-[color:var(--clr-teal)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-[color:var(--clr-fg-dim)] mt-1">
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
    <label className="block text-xs font-semibold text-[color:var(--clr-fg-dim)]" htmlFor={htmlFor}>
      {label}
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-[11px] text-[color:var(--clr-fg-muted)]">{hint}</p>}
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
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all btn-press ${
        checked
          ? 'border-[color:var(--clr-yellow)] bg-[rgba(255,244,79,0.16)] text-[color:var(--clr-yellow)]'
          : 'border-(--clr-border) bg-[color:var(--clr-surface)] text-[color:var(--clr-fg-muted)]'
      }`}
    >
      {label}
    </button>
  );
}
