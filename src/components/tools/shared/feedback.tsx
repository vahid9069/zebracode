'use client';

/**
 * Zero-dependency copy + toast feedback used by every ZebraCode datetime tool.
 *
 * The toast store is local to each page (no context provider, no layout change)
 * and the viewport is rendered with logical positioning (`end-4`) so it works
 * identically in RTL and LTR.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: number;
  text: string;
}

export function useToasts(duration = 2000) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  const push = useCallback(
    (text: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-2), { id, text }]);
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
      timers.current.push(timer);
    },
    [duration],
  );

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  return { toasts, push };
}

export function ToastViewport({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col items-stretch gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-lg dark:border-emerald-900 dark:bg-[#161b26] dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{toast.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Clipboard write with a `execCommand` fallback for non-secure origins. */
export async function writeToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

export interface CopyButtonProps {
  value: string;
  label: string;
  onCopied?: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/** Icon button that swaps to a check mark for 1.2s after a successful copy. */
export function CopyButton({ value, label, onCopied, className, size = 'md' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await writeToClipboard(value);
    if (!ok) return;
    setCopied(true);
    onCopied?.(value);
    window.setTimeout(() => setCopied(false), 1200);
  }, [onCopied, value]);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handleCopy}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[#0d1117]',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        className,
      )}
    >
      {copied ? <Check className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4', 'text-emerald-600')} /> : <Copy className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
    </button>
  );
}

/** Small labelled stat row with a copy affordance — used across both tools. */
export function ValueRow({
  label,
  value,
  copyLabel,
  onCopied,
  ltr = false,
  mono = true,
  tone = 'default',
}: {
  label: string;
  value: string;
  copyLabel: string;
  onCopied?: (value: string) => void;
  ltr?: boolean;
  mono?: boolean;
  tone?: 'default' | 'primary' | 'muted';
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-3 py-2',
        tone === 'primary' && 'bg-blue-50 dark:bg-blue-950/30',
        tone === 'default' && 'bg-slate-50 dark:bg-[#0d1117]',
        tone === 'muted' && 'bg-white dark:bg-[#161b26]',
      )}
    >
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <div className="flex min-w-0 items-center gap-1">
        <code
          dir={ltr ? 'ltr' : undefined}
          className={cn(
            'truncate text-sm font-semibold',
            mono && 'font-sans tabular-nums',
            tone === 'primary' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100',
          )}
        >
          {value}
        </code>
        <CopyButton value={value} label={copyLabel} onCopied={onCopied} size="sm" />
      </div>
    </div>
  );
}
