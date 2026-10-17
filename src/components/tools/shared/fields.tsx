'use client';

/** Presentational building blocks shared by `/timestamp` and `/date-diff`. */

import React from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton } from './feedback';
import { IconButton } from '@/components/ui/icon-button';

export function PanelTitle({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-strong pb-3">
      <div className="flex items-center gap-2">
        <span className="text-action dark:text-focus">{icon}</span>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          {hint ? <p className="text-[11px] text-text-subtle">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({ icon, title, hint, tone = 'blue' }: { icon: React.ReactNode; title: string; hint?: string; tone?: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const tones = {
    blue: 'bg-action-soft text-action dark:text-focus',
    emerald: 'bg-success-soft text-success',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-warning-soft text-warning',
  } as const;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {hint ? <p className="text-xs text-text-subtle">{hint}</p> : null}
      </div>
    </div>
  );
}

export function TimeBox({ label, value, size = 'md' }: { label: string; value: string; size?: 'md' | 'lg' }) {
  return (
    <div className="rounded-lg bg-slate-900 px-2 py-3 text-center dark:bg-[#0d1117]">
      <span className={cn('block font-sans font-bold tabular-nums text-white', size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl')}>{value}</span>
      <span className="mt-1 block text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

export function NumberField({
  label,
  value,
  draft,
  max,
  onChange,
  onBlur,
  className,
}: {
  label: string;
  value: number | null;
  draft?: string;
  max?: number;
  onChange: (raw: string) => void;
  onBlur: () => void;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block truncate text-[10px] font-medium text-text-subtle">{label}</span>
      <input
        dir="ltr"
        inputMode="numeric"
        value={draft ?? (value === null ? '' : String(value))}
        max={max}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={onBlur}
        className="h-9 w-full rounded-md border border-border-strong bg-surface px-2 text-center font-sans text-sm tabular-nums text-text outline-none transition-colors focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
      />
    </label>
  );
}

/** Bordered group with a caption — the reference's date/time field cluster. */
export function FieldGroup({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border-strong bg-surface p-3', className)}>
      {label ? <span className="mb-2 block text-[10px] font-semibold text-text-subtle">{label}</span> : null}
      {children}
    </div>
  );
}

/** `HH : MM : SS` — colon separated inputs that always read left-to-right. */
export function TimeFields({
  hour,
  minute,
  second,
  labels,
  onChange,
  draft,
  onBlur,
}: {
  hour: number | null;
  minute: number | null;
  second: number | null;
  labels: { hour: string; minute: string; second: string };
  onChange: (key: 'hour' | 'minute' | 'second', raw: string) => void;
  /** In-progress values, so half-typed numbers are not padded mid-keystroke. */
  draft?: Partial<Record<'hour' | 'minute' | 'second', string>>;
  onBlur?: (key: 'hour' | 'minute' | 'second') => void;
}) {
  const cell = (key: 'hour' | 'minute' | 'second', value: number | null, max: number) => (
    <input
      dir="ltr"
      inputMode="numeric"
      aria-label={labels[key]}
      title={labels[key]}
      max={max}
      value={draft?.[key] ?? (value === null ? '' : String(value).padStart(2, '0'))}
      onChange={(event) => onChange(key, event.target.value.replace(/[^\d]/g, ''))}
      onBlur={() => onBlur?.(key)}
      className="h-9 w-12 rounded-md border border-border-strong bg-surface text-center font-sans text-sm tabular-nums text-text outline-none transition-colors focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
    />
  );

  return (
    <div dir="ltr" className="flex items-center justify-center gap-1">
      {cell('hour', hour, 23)}
      <span className="font-sans text-sm text-text-subtle">:</span>
      {cell('minute', minute, 59)}
      <span className="font-sans text-sm text-text-subtle">:</span>
      {cell('second', second, 59)}
    </div>
  );
}

export function PresetButton({ label, onClick, icon, active }: { label: string; onClick: () => void; icon?: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        active
          ? 'bg-action text-action-foreground shadow-sm'
          : 'bg-surface-inset text-text-muted hover:bg-action-soft hover:text-action dark:hover:text-focus',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  copyLabel,
  onCopied,
  icon,
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  copyLabel: string;
  onCopied?: () => void;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border-strong bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-action/40 hover:shadow-sm">
      <div className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          {icon ? <span className="shrink-0 text-text-subtle transition-colors group-hover:text-action">{icon}</span> : null}
          <span className="truncate text-[11px] font-medium text-text-muted">{label}</span>
        </span>
        <IconButton type="button" size="sm" aria-label={copyLabel} title={copyLabel} onClick={onCopied} className="text-text-subtle hover:text-action">
          <Copy className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      <span className="font-sans text-lg font-bold tabular-nums text-text">{value}</span>
      <div className="flex items-end justify-between gap-2">
        {hint ? <span className="text-[10px] leading-4 text-text-subtle">{hint}</span> : <span />}
        {badge ? (
          <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">{badge}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Card with a tinted title bar — the reference's section chrome. */
export function SectionCard({
  icon,
  title,
  hint,
  badge,
  children,
  className,
  bodyClassName,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border-strong bg-surface', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-strong px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
           {icon ? <span className="shrink-0 text-action dark:text-focus">{icon}</span> : null}
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-text">{title}</span>
            {hint ? <span className="block truncate text-[10px] text-text-subtle">{hint}</span> : null}
          </span>
        </span>
        {badge}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}

/** Tone-tinted pill used for statuses and counters. */
export function Badge({ text, tone = 'slate' }: { text: string; tone?: 'slate' | 'emerald' | 'amber' | 'blue' | 'red' | 'violet' }) {
  const tones = {
    slate: 'bg-surface-inset text-text-muted',
    emerald: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-warning',
    blue: 'bg-action-soft text-action dark:text-focus',
    red: 'bg-danger-soft text-danger',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  } as const;
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', tones[tone])}>{text}</span>;
}

/** Compact rounded chip — the reference's quick-preset row. */
export function PresetPill({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center rounded-full border px-1.5 text-[10px] font-medium transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        active
          ? 'border-action/40 bg-action-soft text-action dark:text-focus'
          : 'border-border-strong bg-surface text-text-muted hover:border-action/40 hover:text-action dark:hover:text-focus',
      )}
    >
      {label}
    </button>
  );
}

/** Large mode switch tile — icon over title. */
export function ModeTile({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex-none',
        active
          ? 'border-action/40 bg-action-soft text-action dark:text-focus'
          : 'border-border-strong bg-surface text-text-muted hover:border-action/40 hover:text-action dark:hover:text-focus',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Two-option calendar switch, shared by every endpoint card. */
export function SystemToggle({
  system,
  onChange,
  labels,
}: {
  system: 'jalali' | 'gregorian';
  onChange: (next: 'jalali' | 'gregorian') => void;
  labels: { jalali: string; gregorian: string };
}) {
  return (
    <div className="flex shrink-0 rounded-md bg-surface-inset p-0.5 text-[11px]">
      <button
        type="button"
        onClick={() => onChange('jalali')}
        className={cn('rounded px-2.5 py-1.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', system === 'jalali' ? 'bg-action text-action-foreground shadow-sm' : 'text-text-muted hover:text-text')}
      >
        {labels.jalali}
      </button>
      <button
        type="button"
        onClick={() => onChange('gregorian')}
        className={cn('rounded px-2.5 py-1.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', system === 'gregorian' ? 'bg-action text-action-foreground shadow-sm' : 'text-text-muted hover:text-text')}
      >
        {labels.gregorian}
      </button>
    </div>
  );
}

/** Bordered read-only cell for a single time part. */
export function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-strong bg-surface-inset px-2 py-3 text-center">
      <span className="block font-sans text-xl font-bold tabular-nums text-text sm:text-2xl">{value}</span>
      <span className="mt-1 block text-[10px] text-text-subtle">{label}</span>
    </div>
  );
}

/** Numbered note / FAQ card — the closing rhythm of both datetime tools. */
export function NoteCard({ index, title, icon, children }: { index: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border-strong bg-surface p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-strong text-[11px] font-bold text-text-muted">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-text">
          <span className="text-action">{icon}</span>
          {title}
        </h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

/** Dark code panel with a filename bar — identical on both datetime tools. */
export function CodeCard({
  code,
  file,
  copyLabel,
  onCopy,
}: {
  code: string;
  file: string;
  copyLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0f172a]">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Copy className="h-3 w-3" />
          {copyLabel}
        </button>
        <span className="flex items-center gap-2">
          <code dir="ltr" className="font-sans text-[11px] text-slate-300">
            {file}
          </code>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        </span>
      </div>
      <pre dir="ltr" className="max-h-80 overflow-auto p-4 text-start">
        <code className="font-sans text-[11px] leading-6 text-slate-100">{code}</code>
      </pre>
    </div>
  );
}

/** Small labelled row with a value + copy button (parallel-calendar readout). */
export function InlineValue({ label, value, copyLabel, onCopied }: { label: string; value: string; copyLabel: string; onCopied?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-inset px-3 py-2">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <code className="truncate font-sans text-xs font-semibold text-text">{value}</code>
        <CopyButton value={value} label={copyLabel} onCopied={onCopied} size="sm" />
      </span>
    </div>
  );
}
