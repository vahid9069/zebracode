'use client';

/** Presentational building blocks shared by `/timestamp` and `/date-diff`. */

import React from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton } from './feedback';

export function PanelTitle({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({ icon, title, hint, tone = 'blue' }: { icon: React.ReactNode; title: string; hint?: string; tone?: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  } as const;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
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
      <span className="mb-1 block truncate text-[10px] font-medium text-slate-400">{label}</span>
      <input
        dir="ltr"
        inputMode="numeric"
        value={draft ?? (value === null ? '' : String(value))}
        max={max}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={onBlur}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-center font-sans text-sm tabular-nums text-slate-800 outline-none transition-colors focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-[#0d1117] dark:text-slate-100"
      />
    </label>
  );
}

/** Bordered group with a caption — the reference's date/time field cluster. */
export function FieldGroup({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#161b26]', className)}>
      {label ? <span className="mb-2 block text-[10px] font-semibold text-slate-400">{label}</span> : null}
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
      className="h-9 w-12 rounded-md border border-slate-200 bg-white text-center font-sans text-sm tabular-nums text-slate-800 outline-none transition-colors focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-[#0d1117] dark:text-slate-100"
    />
  );

  return (
    <div dir="ltr" className="flex items-center justify-center gap-1">
      {cell('hour', hour, 23)}
      <span className="font-sans text-sm text-slate-400">:</span>
      {cell('minute', minute, 59)}
      <span className="font-sans text-sm text-slate-400">:</span>
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
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all hover:-translate-y-0.5',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-[#0d1117] dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300',
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
    <div className="group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-white/10 dark:bg-[#161b26] dark:hover:border-blue-900">
      <div className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          {icon ? <span className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-500">{icon}</span> : null}
          <span className="truncate text-[11px] font-medium text-slate-500">{label}</span>
        </span>
        <button type="button" aria-label={copyLabel} title={copyLabel} onClick={onCopied} className="shrink-0 text-slate-300 transition-colors hover:text-blue-600">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="font-sans text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</span>
      <div className="flex items-end justify-between gap-2">
        {hint ? <span className="text-[10px] leading-4 text-slate-400">{hint}</span> : <span />}
        {badge ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{badge}</span>
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
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161b26]', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-white/10">
        <span className="flex min-w-0 items-center gap-2">
          {icon ? <span className="shrink-0 text-blue-600">{icon}</span> : null}
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-slate-700 dark:text-slate-100">{title}</span>
            {hint ? <span className="block truncate text-[10px] text-slate-400">{hint}</span> : null}
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
    slate: 'bg-slate-100 text-slate-600 dark:bg-[#0d1117] dark:text-slate-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
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
        'inline-flex h-7 shrink-0 items-center rounded-full border px-1.5 text-[10px] font-medium transition-all hover:-translate-y-0.5',
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-[#161b26] dark:text-slate-300 dark:hover:border-blue-900',
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
        'inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all sm:flex-none',
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-[#161b26] dark:hover:border-blue-900',
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
    <div className="flex shrink-0 rounded-md bg-slate-100 p-0.5 text-[11px] dark:bg-[#0d1117]">
      <button
        type="button"
        onClick={() => onChange('jalali')}
        className={cn('rounded px-2.5 py-1.5 font-semibold transition-colors', system === 'jalali' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}
      >
        {labels.jalali}
      </button>
      <button
        type="button"
        onClick={() => onChange('gregorian')}
        className={cn('rounded px-2.5 py-1.5 font-semibold transition-colors', system === 'gregorian' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}
      >
        {labels.gregorian}
      </button>
    </div>
  );
}

/** Bordered read-only cell for a single time part. */
export function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center dark:border-white/10 dark:bg-[#0d1117]">
      <span className="block font-sans text-xl font-bold tabular-nums text-slate-800 dark:text-white sm:text-2xl">{value}</span>
      <span className="mt-1 block text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

/** Numbered note / FAQ card — the closing rhythm of both datetime tools. */
export function NoteCard({ index, title, icon, children }: { index: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161b26]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[11px] font-bold text-slate-500 dark:border-white/10">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-100">
          <span className="text-blue-600">{icon}</span>
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
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/10"
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
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-[#0d1117]">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <code className="truncate font-sans text-xs font-semibold text-slate-800 dark:text-slate-100">{value}</code>
        <CopyButton value={value} label={copyLabel} onCopied={onCopied} size="sm" />
      </span>
    </div>
  );
}
