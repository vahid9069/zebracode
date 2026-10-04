'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { toGregorian, toJalaali } from 'jalaali-js';
import { cn } from '@/lib/utils';
import {
  type CalendarSystem,
  addDays,
  addMonths,
  daysInMonth,
  formatIsoDate,
  formatNumber,
  shortParallelLabel,
  weekIndex,
} from '@/lib/datetime/jalali';

export interface CalendarWidgetLabels {
  /** Quick-jump pills */
  jumpToday: string;
  jumpYesterday: string;
  jumpTomorrow: string;
  jumpNextWeek: string;
  jumpNextMonth: string;
  quickJumpTitle: string;
  /** Header controls */
  switchToJalali: string;
  switchToGregorian: string;
  jalali: string;
  gregorian: string;
  selectMonth: string;
  selectYear: string;
  prevMonth: string;
  nextMonth: string;
  todayButton: string;
  /** Weekday + month name tables */
  weekdaysJalali: readonly string[];
  weekdaysGregorian: readonly string[];
  /** Full weekday names — used by the standalone (non-inline) calendar. */
  weekdayNames: readonly string[];
  jalaliMonths: readonly string[];
  gregorianMonths: readonly string[];
  gregorianShortMonths: readonly string[];
  /** Footer facts — `{days}` is replaced with the real month length */
  monthDays: string;
  leapYear: string;
  commonYear: string;
  yearDays: string;
  /** Cross-calendar helper text */
  parallelHint: string;
}

export interface DualCalendarWidgetProps {
  value: Date;
  onChange: (next: Date) => void;
  system: CalendarSystem;
  onSystemChange: (next: CalendarSystem) => void;
  labels: CalendarWidgetLabels;
  /** `null` while the page is not mounted yet — avoids hydration mismatches. */
  today: Date | null;
  locale: string;
  /** `compact` drops the chrome (jumps, facts, toggles) for inline use. */
  variant?: 'full' | 'compact';
  /** Render full weekday names (`شنبه`) instead of the single-letter form. */
  fullWeekdays?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 40;
const GRID_CELLS = 42;

export default function DualCalendarWidget({
  value,
  onChange,
  system,
  onSystemChange,
  labels,
  today,
  locale,
  variant = 'full',
  fullWeekdays = false,
  className,
}: DualCalendarWidgetProps) {
  const compact = variant === 'compact';
  const num = (input: number) => formatNumber(input, locale);

  const valueParts = useMemo(() => {
    if (system === 'jalali') {
      const j = toJalaali(value.getFullYear(), value.getMonth() + 1, value.getDate());
      return { year: j.jy, month: j.jm, day: j.jd };
    }
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }, [system, value]);

  const [view, setView] = useState(() => ({ year: valueParts.year, month: valueParts.month }));
  const selectedIso = formatIsoDate(value);

  // Follow the selection when it moves to another month (e.g. from a preset).
  useEffect(() => {
    setView((current) => {
      if (current.year === valueParts.year && current.month === valueParts.month) return current;
      return { year: valueParts.year, month: valueParts.month };
    });
  }, [valueParts.year, valueParts.month]);

  const weekdays =
    fullWeekdays && !compact ? labels.weekdayNames : system === 'jalali' ? labels.weekdaysJalali : labels.weekdaysGregorian;
  const monthNames = system === 'jalali' ? labels.jalaliMonths : labels.gregorianMonths;

  /** First + last Gregorian day of the visible month, for the dual header. */
  const monthBounds = useMemo(() => {
    const length = daysInMonth(system, view.year, view.month);
    const first =
      system === 'jalali'
        ? (() => {
            const g = toGregorian(view.year, view.month, 1);
            return new Date(g.gy, g.gm - 1, g.gd);
          })()
        : new Date(view.year, view.month - 1, 1);
    return { first, last: addDays(first, length - 1), length };
  }, [system, view.month, view.year]);

  const dualMonthLabel = useMemo(() => {
    const jalaliMonth = (() => {
      if (system === 'jalali') return { name: labels.jalaliMonths[view.month - 1], year: view.year };
      const j = toJalaali(monthBounds.first.getFullYear(), monthBounds.first.getMonth() + 1, monthBounds.first.getDate());
      return { name: labels.jalaliMonths[j.jm - 1], year: j.jy };
    })();
    const gregorianMonth = (() => {
      if (system === 'gregorian') return { label: labels.gregorianMonths[view.month - 1], year: view.year };
      const from = monthBounds.first.getMonth();
      const to = monthBounds.last.getMonth();
      const label = from === to ? labels.gregorianShortMonths[from] : `${labels.gregorianShortMonths[from]} - ${labels.gregorianShortMonths[to]}`;
      return { label, year: monthBounds.first.getFullYear() };
    })();

    return {
      jalali: `${jalaliMonth.name} ${num(jalaliMonth.year)}`,
      gregorian: `${gregorianMonth.label} ${gregorianMonth.year}`,
    };
  }, [labels.gregorianMonths, labels.gregorianShortMonths, labels.jalaliMonths, monthBounds, num, system, view.month, view.year]);

  const cells = useMemo(() => {
    const monthDays = daysInMonth(system, view.year, view.month);
    const firstOfMonth =
      system === 'jalali'
        ? (() => {
            const g = toGregorian(view.year, view.month, 1);
            return new Date(g.gy, g.gm - 1, g.gd);
          })()
        : new Date(view.year, view.month - 1, 1);

    const offset = weekIndex(firstOfMonth);
    const start = addDays(firstOfMonth, -offset);

    return Array.from({ length: GRID_CELLS }, (_, index) => {
      const date = addDays(start, index);
      const inMonth = index >= offset && index < offset + monthDays;
      const day = inMonth ? (system === 'jalali' ? index - offset + 1 : date.getDate()) : 0;
      return {
        date,
        day,
        inMonth,
        iso: formatIsoDate(date),
        secondary: shortParallelLabel(date, system, locale, labels.gregorianShortMonths),
        isFriday: date.getDay() === 5,
      };
    });
  }, [labels.gregorianShortMonths, locale, system, view.month, view.year]);

  const changeMonth = (delta: number) => {
    setView((current) => {
      const total = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 + 1 };
    });
  };

  const jumpTo = (next: Date) => {
    onChange(next);
    if (system === 'jalali') {
      const j = toJalaali(next.getFullYear(), next.getMonth() + 1, next.getDate());
      setView({ year: j.jy, month: j.jm });
    } else {
      setView({ year: next.getFullYear(), month: next.getMonth() + 1 });
    }
  };

  const selectCell = (cell: { date: Date }) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    // `cell.date` is always a real Gregorian instant, so the selected time of
    // day is simply carried over — no calendar re-interpretation needed.
    const next = new Date(cell.date);
    next.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), 0);
    jumpTo(next);
  };

  /* -------------------- touch swipe (month navigation) -------------------- */
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    swiped.current = false;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    swiped.current = true;
    window.setTimeout(() => {
      swiped.current = false;
    }, 300);
    // RTL: swiping left reveals the next month, swiping right the previous one.
    const forward = locale === 'fa' ? deltaX < 0 : deltaX > 0;
    changeMonth(forward ? 1 : -1);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const rtl = locale === 'fa';
    const step = (days: number) => {
      event.preventDefault();
      onChange(addDays(value, days));
    };
    if (event.key === 'ArrowLeft') step(rtl ? 1 : -1);
    else if (event.key === 'ArrowRight') step(rtl ? -1 : 1);
    else if (event.key === 'ArrowUp') step(-7);
    else if (event.key === 'ArrowDown') step(7);
    else if (event.key === 'Home') {
      event.preventDefault();
      onChange(new Date(value.getFullYear(), value.getMonth(), 1, value.getHours(), value.getMinutes(), value.getSeconds()));
    } else if (event.key === 'End') {
      event.preventDefault();
      changeMonth(1);
    }
  };

  const todayIso = today ? formatIsoDate(today) : null;

  const navButtons = (
    <div className={cn('flex items-center', compact ? 'gap-0' : 'rounded-md bg-slate-100 p-0.5 dark:bg-[#0d1117]')}>
      <button
        type="button"
        aria-label={labels.prevMonth}
        title={labels.prevMonth}
        onClick={() => changeMonth(-1)}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-blue-600 dark:hover:bg-[#161b26]',
          !compact && 'h-8 w-8',
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={labels.nextMonth}
        title={labels.nextMonth}
        onClick={() => changeMonth(1)}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-blue-600 dark:hover:bg-[#161b26]',
          !compact && 'h-8 w-8',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );

  const grid = (
    <div
      role="grid"
      tabIndex={0}
      aria-label={monthNames[view.month - 1]}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={cn(
        'w-full rounded-md outline-none [touch-action:pan-y] focus-visible:ring-2 focus-visible:ring-blue-500',
        compact && 'overflow-hidden border border-slate-200 dark:border-white/10',
      )}
    >
      <div
        className={cn(
          'grid grid-cols-7 text-center',
          compact ? 'gap-0 border-b border-slate-200 dark:border-white/10' : 'gap-0.5 text-[11px] sm:gap-1',
        )}
      >
        {weekdays.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className={cn(
              'font-semibold',
              compact ? 'border-s border-slate-200 py-1.5 text-[11px] text-slate-500 first:border-s-0 dark:border-white/10' : 'py-1 sm:py-2',
              !compact && index === 6 && 'text-red-500',
              !compact && index !== 6 && 'text-slate-500',
              compact && index === 6 && 'text-red-500',
            )}
          >
            {day}
          </span>
        ))}
      </div>
      <div className={cn('grid grid-cols-7', compact ? 'gap-0' : 'mt-1 gap-0.5 sm:gap-1')}>
        {cells.map((cell) => {
          const selected = cell.iso === selectedIso;
          const isToday = cell.iso === todayIso;

          // In full (non-compact) mode: cells outside the current month are completely blank
          if (!compact && !cell.inMonth) {
            return <div key={cell.iso} className="h-10 sm:h-14" />;
          }

          return (
            <button
              key={cell.iso}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => selectCell(cell)}
              className={cn(
                'group relative flex min-w-0 flex-col items-center justify-center transition-all',
                compact
                  ? 'h-11 gap-0 border-b border-s border-slate-100 p-0.5 last:border-b-0 dark:border-white/5'
                  : 'h-10 gap-0.5 rounded-lg p-0.5 sm:h-14 sm:p-1',
                selected
                  ? compact
                    ? 'bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700'
                    : 'bg-slate-800 font-bold text-white shadow-sm hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500'
                  : 'hover:bg-slate-100 dark:hover:bg-blue-950/40',
                !selected && cell.isFriday && !compact && 'hover:bg-red-50 dark:hover:bg-red-950/30',
                isToday && !selected && 'ring-1 ring-emerald-500',
              )}
            >
              <span
                className={cn(
                  'font-bold tabular-nums',
                  compact ? 'text-[11px]' : 'text-sm sm:text-base',
                  !selected && cell.isFriday && 'text-rose-500',
                  !selected && !cell.isFriday && 'text-slate-800 dark:text-slate-100',
                )}
              >
                {cell.day > 0 ? num(cell.day) : ''}
              </span>
              <span
                className={cn(
                  'w-full truncate text-center tabular-nums',
                  compact ? 'text-[9px]' : 'hidden text-[10px] sm:block',
                  selected ? (compact ? 'text-blue-100' : 'text-slate-300') : cell.isFriday ? 'text-rose-400' : 'text-slate-400',
                )}
              >
                {cell.secondary}
              </span>
              {isToday ? <span className={cn('absolute top-0.5 end-1 h-1.5 w-1.5 rounded-full', selected ? 'bg-white' : 'bg-emerald-500')} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center justify-between gap-2">
          {navButtons}
          <span className="flex flex-wrap items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span>{dualMonthLabel.jalali}</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span dir="ltr" className="text-slate-500">
              {dualMonthLabel.gregorian}
            </span>
          </span>
        </div>
        {grid}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation: prev < MonthYear > next — sits on the right in RTL */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={labels.prevMonth}
            title={labels.prevMonth}
            onClick={() => changeMonth(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-[#0d1117]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="inline-flex min-w-0 items-center gap-1.5 px-1 text-sm font-bold text-slate-700 dark:text-slate-100">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="truncate">
              {monthNames[view.month - 1]} {num(view.year)}
            </span>
          </span>
          <button
            type="button"
            aria-label={labels.nextMonth}
            title={labels.nextMonth}
            onClick={() => changeMonth(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-[#0d1117]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Action buttons: Today + Switch calendar — sits on the left in RTL */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!today}
            onClick={() => today && jumpTo(new Date(today))}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 dark:border-white/10 dark:bg-[#161b26] dark:text-slate-300 dark:hover:border-blue-900"
          >
            {labels.todayButton}
          </button>
          <button
            type="button"
            onClick={() => onSystemChange(system === 'jalali' ? 'gregorian' : 'jalali')}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Repeat className="h-4 w-4" />
            {system === 'jalali' ? labels.switchToGregorian : labels.switchToJalali}
          </button>
        </div>
      </div>

      {grid}

      <div className="flex flex-wrap items-center gap-2" aria-label={labels.quickJumpTitle}>
        <span className="text-[11px] font-semibold text-slate-400">{labels.quickJumpTitle}:</span>
        <QuickPill label={labels.jumpToday} disabled={!today} onClick={() => today && jumpTo(new Date(today))} />
        <QuickPill label={labels.jumpYesterday} disabled={!today} onClick={() => today && jumpTo(addDays(today, -1))} />
        <QuickPill label={labels.jumpTomorrow} disabled={!today} onClick={() => today && jumpTo(addDays(today, 1))} />
        <QuickPill label={labels.jumpNextWeek} disabled={!today} onClick={() => today && jumpTo(addDays(today, 7))} />
        <QuickPill label={labels.jumpNextMonth} disabled={!today} onClick={() => today && jumpTo(addMonths(today, 1))} />
      </div>
    </div>
  );
}

function QuickPill({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:bg-[#0d1117] dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
    >
      {label}
    </button>
  );
}
