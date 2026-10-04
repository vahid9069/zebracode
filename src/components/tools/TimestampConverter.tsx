'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toJalaali } from 'jalaali-js';
import {
  AlarmClock,
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Globe2,
  Hash,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Timer,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dictionary } from '@/i18n/getDictionary';
import { ToastViewport, ValueRow, writeToClipboard, useToasts } from '@/components/tools/shared/feedback';
import DualCalendarWidget, { type CalendarWidgetLabels } from '@/components/tools/shared/DualCalendarWidget';
import { buildCalendarLabels } from '@/components/tools/shared/calendarLabels';
import { DonutChart } from '@/components/tools/shared/DonutChart';
import {
  Badge,
  CodeCard,
  FieldGroup,
  MetricCard,
  ModeTile,
  NoteCard,
  NumberField,
  PresetPill,
  SectionCard,
  SystemToggle,
  TimeCell,
  TimeFields,
} from '@/components/tools/shared/fields';
import {
  type CalendarSystem,
  type DateParts,
  MS_PER_DAY,
  addDays,
  addMonths,
  civilDifference,
  dateToParts,
  daysInMonth,
  epochSeconds,
  formatClock,
  formatCount,
  formatIsoDate,
  formatJalaliNumeric,
  formatNumber,
  localiseDigits,
  partsToDate,
  toInt,
  totalsBetween,
} from '@/lib/datetime/jalali';
import { type CustomHoliday, businessDayStats, leapYearsInRange, readCustomHolidays } from '@/lib/datetime/holidays';

type Ui = Dictionary['common']['toolsUi']['dateDiff'];
type Shared = Dictionary['common']['toolsUi']['shared'];
type FieldKey = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
type Mode = 'diff' | 'shift' | 'countdown';
type Endpoint = 'start' | 'end';

const DATE_FIELDS: readonly Extract<FieldKey, 'year' | 'month' | 'day'>[] = ['year', 'month', 'day'];
const DEFAULT_SHIFT = { years: 0, months: 3, weeks: 2, days: 10, hour: 4, minute: 30, second: 0 };

export default function TimestampConverter() {
  const { locale, dict } = useI18n();
  const ui = dict.common.toolsUi.dateDiff;
  const shared = dict.common.toolsUi.shared;
  const { toasts, push } = useToasts();

  const num = useCallback((input: number) => formatNumber(input, locale), [locale]);
  const count = useCallback((input: number) => formatCount(input, locale), [locale]);
  const clock = useCallback((value: string | number) => localiseDigits(String(value), locale), [locale]);
  const widgetLabels = useMemo<CalendarWidgetLabels>(() => buildCalendarLabels(shared), [shared]);

  const fieldLabels: Record<FieldKey, string> = {
    year: ui.fieldYear,
    month: ui.fieldMonth,
    day: ui.fieldDay,
    hour: ui.fieldHour,
    minute: ui.fieldMinute,
    second: ui.fieldSecond,
  };

  /* ------------------------------ state -------------------------------- */
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('diff');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [startSystem, setStartSystem] = useState<CalendarSystem>('jalali');
  const [endSystem, setEndSystem] = useState<CalendarSystem>('jalali');
  const [draft, setDraft] = useState<{ start: Partial<Record<FieldKey, string>>; end: Partial<Record<FieldKey, string>> }>({ start: {}, end: {} });
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [tick, setTick] = useState<Date | null>(null);

  useEffect(() => {
    const instant = new Date();
    setStart(addDays(instant, -621));
    setEnd(instant);
    setTick(instant);
    setCustomHolidays(readCustomHolidays());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode !== 'countdown') return;
    const timer = window.setInterval(() => setTick(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  /**
   * Entering countdown mode with an already-elapsed target would immediately
   * read "event passed", so a month ahead is used as the starting point.
   */
  const changeMode = useCallback((next: Mode) => {
    if (next === 'countdown') {
      const instant = new Date();
      setEnd((current) => (!current || current.getTime() - instant.getTime() < 5000 ? addDays(instant, 30) : current));
    }
    setMode(next);
  }, []);

  /* --------------------------- endpoint helpers ------------------------- */
  const startParts = useMemo(() => (start ? dateToParts(start, startSystem) : null), [start, startSystem]);
  const endParts = useMemo(() => (end ? dateToParts(end, endSystem) : null), [end, endSystem]);

  const endpointParts = (endpoint: Endpoint) => (endpoint === 'start' ? startParts : endParts);

  const commitField = (endpoint: Endpoint, key: FieldKey, raw: string) => {
    setDraft((current) => ({ ...current, [endpoint]: { ...current[endpoint], [key]: raw } }));
    const current = endpointParts(endpoint);
    const currentDate = endpoint === 'start' ? start : end;
    const system = endpoint === 'start' ? startSystem : endSystem;
    if (!current || !currentDate) return;
    const numeric = toInt(raw, NaN);
    if (!Number.isFinite(numeric)) return;
    const next = partsToDate({ ...current, [key]: numeric }, system);
    if (endpoint === 'start') setStart(next);
    else setEnd(next);
  };

  const clearDraft = (endpoint: Endpoint, key: FieldKey) =>
    setDraft((current) => ({ ...current, [endpoint]: { ...current[endpoint], [key]: undefined } }));

  const setEndpoint = (endpoint: Endpoint, next: Date) => {
    setDraft((current) => ({ ...current, [endpoint]: {} }));
    if (endpoint === 'start') setStart(next);
    else setEnd(next);
  };

  const applyPreset = (endpoint: Endpoint, preset: 'now' | 'startOfToday' | 'firstOfMonth' | 'endOfYear' | 'plus30' | 'plus6m') => {
    const base = tick ?? new Date();
    const system = endpoint === 'start' ? startSystem : endSystem;
    let next: Date;
    if (preset === 'now') next = base;
    else if (preset === 'startOfToday') next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
    else if (preset === 'plus30') next = addDays(base, 30);
    else if (preset === 'plus6m') next = addMonths(base, 6);
    else {
      const parts = dateToParts(base, system);
      if (preset === 'firstOfMonth') next = partsToDate({ ...parts, day: 1, hour: 0, minute: 0, second: 0 }, system);
      else next = partsToDate({ ...parts, month: 12, day: daysInMonth(system, parts.year, 12), hour: 23, minute: 59, second: 59 }, system);
    }
    setEndpoint(endpoint, next);
  };

  const swap = () => {
    const previousStart = start;
    const previousEnd = end;
    const previousStartSystem = startSystem;
    setStart(previousEnd);
    setEnd(previousStart);
    setStartSystem(endSystem);
    setEndSystem(previousStartSystem);
    setDraft({ start: {}, end: {} });
  };

  /* ------------------------------ results ------------------------------ */
  const diff = useMemo(() => (start && end ? civilDifference(start, end) : null), [end, start]);
  const totals = useMemo(() => (start && end ? totalsBetween(start, end) : null), [end, start]);
  const business = useMemo(() => (start && end ? businessDayStats(start, end, customHolidays) : null), [customHolidays, end, start]);
  const leap = useMemo(() => (start && end ? leapYearsInRange(start, end) : null), [end, start]);

  const businessPercent = business && business.total > 0 ? Math.round((business.working / business.total) * 100) : 0;

  const progress = useMemo(() => {
    if (!start || !end || !tick) return null;
    const from = Math.min(start.getTime(), end.getTime());
    const to = Math.max(start.getTime(), end.getTime());
    const span = to - from;
    if (span <= 0) return { percent: 100, state: 'done' as const };
    if (tick.getTime() <= from) return { percent: 0, state: 'before' as const };
    if (tick.getTime() >= to) return { percent: 100, state: 'done' as const };
    return { percent: Math.round(((tick.getTime() - from) / span) * 1000) / 10, state: 'active' as const };
  }, [end, start, tick]);

  const countdown = useMemo(() => {
    if (!end || !tick) return null;
    const delta = end.getTime() - tick.getTime();
    const abs = Math.abs(delta);
    return {
      negative: delta < 0,
      days: Math.floor(abs / MS_PER_DAY),
      hours: Math.floor((abs % MS_PER_DAY) / 3_600_000),
      minutes: Math.floor((abs % 3_600_000) / 60_000),
      seconds: Math.floor((abs % 60_000) / 1000),
    };
  }, [end, tick]);

  /** Both endpoints in both calendars — used by the hero, timeline and snippets. */
  const rangeLabels = useMemo(() => {
    if (!start || !end) return null;
    const parts = (date: Date) => {
      const j = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      return {
        jalali: `${num(j.jd)} ${shared.jalaliMonths[j.jm - 1]} ${num(j.jy)}`,
        gregorian: formatIsoDate(date),
        jalaliParts: { year: j.jy, month: j.jm, day: j.jd, hour: 0, minute: 0, second: 0 } as DateParts,
      };
    };
    const a = parts(start);
    const b = parts(end);
    const today = tick ?? new Date();
    const tj = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return {
      start: a,
      end: b,
      today: { jalali: `${num(tj.jd)} ${shared.jalaliMonths[tj.jm - 1]} ${num(tj.jy)}`, gregorian: formatIsoDate(today) },
    };
  }, [end, num, shared.jalaliMonths, start, tick]);

  const summaryText = useMemo(() => {
    if (!totals || !rangeLabels) return '';
    const human = (date: Date) => {
      const monthIndex = date.getMonth();
      return `${num(date.getDate())} ${shared.gregorianMonths[monthIndex]} ${date.getFullYear()}`;
    };
    const from = start && end && start.getTime() > end.getTime() ? end : start;
    const to = start && end && start.getTime() > end.getTime() ? start : end;
    if (!from || !to) return '';
    return ui.summaryPattern.replace('{days}', count(totals.days)).replace('{start}', human(from)).replace('{end}', human(to));
  }, [count, end, rangeLabels, num, shared.gregorianMonths, start, totals, ui.summaryPattern]);

  const heroYmd = useMemo(() => {
    if (!diff) return '';
    return [`${num(diff.years)} ${ui.years}`, `${num(diff.months)} ${ui.months}`, `${num(diff.days)} ${ui.days}`].join(` ${ui.and} `);
  }, [diff, num, ui.and, ui.days, ui.months, ui.years]);

  const heroClock = diff ? clock(`${String(diff.hours).padStart(2, '0')}:${String(diff.minutes).padStart(2, '0')}:${String(diff.seconds).padStart(2, '0')}`) : '';

  /* ------------------------------- shift -------------------------------- */
  const [shift, setShift] = useState(DEFAULT_SHIFT);
  const [operation, setOperation] = useState<'add' | 'sub'>('add');
  const [baseDate, setBaseDate] = useState<Date | null>(null);
  useEffect(() => {
    if (start && !baseDate) setBaseDate(start);
  }, [baseDate, start]);

  const baseParts = useMemo(() => (baseDate ? dateToParts(baseDate, startSystem) : null), [baseDate, startSystem]);
  const shifted = useMemo(() => {
    if (!baseDate) return null;
    const value = new Date(baseDate);
    const sign = operation === 'add' ? 1 : -1;
    value.setFullYear(value.getFullYear() + sign * shift.years);
    value.setMonth(value.getMonth() + sign * shift.months);
    const amount = (shift.weeks * 7 + shift.days) * MS_PER_DAY + (shift.hour * 3600 + shift.minute * 60 + shift.second) * 1000;
    value.setTime(value.getTime() + sign * amount);
    const asJalali = toJalaali(value.getFullYear(), value.getMonth() + 1, value.getDate());
    return {
      date: value,
      jalali: `${num(asJalali.jd)} ${shared.jalaliMonths[asJalali.jm - 1]} ${num(asJalali.jy)}`,
      gregorian: `${formatIsoDate(value)} ${formatClock(value)}`,
    };
  }, [baseDate, num, operation, shared.jalaliMonths, shift]);

  /* ------------------------------ snippets ------------------------------ */
  const snippets = useMemo(() => {
    if (!start || !end || !totals) return [];
    const startIso = `${formatIsoDate(start)} ${formatClock(start)}`;
    const endIso = `${formatIsoDate(end)} ${formatClock(end)}`;
    const startEpoch = epochSeconds(start);
    const endEpoch = epochSeconds(end);
    const jalaliStart = rangeLabels ? formatJalaliNumeric(rangeLabels.start.jalaliParts, 'en') : '';
    const jalaliEnd = rangeLabels ? formatJalaliNumeric(rangeLabels.end.jalaliParts, 'en') : '';

    return [
      {
        key: 'js',
        label: ui.snippetJs,
        file: ui.codeFileName,
        code: `// ${ui.codeCommentTitle}
// ${ui.codeCommentRange}: ${jalaliStart} -> ${jalaliEnd}
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

// ${ui.codeCommentUnits}
const start = dayjs('${startIso}', { jalali: false }); // ${startEpoch}
const end = dayjs('${endIso}', { jalali: false }); // ${endEpoch}

const diffDays = end.diff(start, 'day'); // ${totals.days}
const diffHours = end.diff(start, 'hour'); // ${totals.hours}
const diffSeconds = end.diff(start, 'second'); // ${totals.seconds}

console.log({ diffDays, diffHours, diffSeconds });`,
      },
      {
        key: 'python',
        label: ui.snippetPython,
        file: 'date_difference_jalali.py',
        code: `# ${ui.codeCommentTitle}
# ${ui.codeCommentRange}: ${jalaliStart} -> ${jalaliEnd}
from datetime import datetime
import jdatetime

start = datetime(${start.getFullYear()}, ${start.getMonth() + 1}, ${start.getDate()}, ${start.getHours()}, ${start.getMinutes()}, ${start.getSeconds()})
end = datetime(${end.getFullYear()}, ${end.getMonth() + 1}, ${end.getDate()}, ${end.getHours()}, ${end.getMinutes()}, ${end.getSeconds()})

delta = end - start
print(delta.days)              # ${totals.days}
print(int(delta.total_seconds()))  # ${totals.seconds}

print(jdatetime.date.fromgregorian(date=start.date()).strftime('%Y/%m/%d'))`,
      },
      {
        key: 'php',
        label: ui.snippetPhp,
        file: 'date_difference_jalali.php',
        code: `<?php
// ${ui.codeCommentTitle}
use Morilog\\Jalali\\Jalalian;

$start = new DateTimeImmutable('${startIso}');   // ${startEpoch}
$end = new DateTimeImmutable('${endIso}');     // ${endEpoch}

$diff = $start->diff($end);
echo $diff->format('%y / %m / %d') . PHP_EOL;
echo ($end->getTimestamp() - $start->getTimestamp()) . ' ${ui.deltaUnit}' . PHP_EOL;

echo Jalalian::fromDateTime($start)->format('%Y/%m/%d') . PHP_EOL;`,
      },
      {
        key: 'go',
        label: ui.snippetGo,
        file: 'date_difference_jalali.go',
        code: `package main

// ${ui.codeCommentTitle}
import (
	"fmt"
	"time"
)

func main() {
	start := time.Unix(${startEpoch}, 0) // ${jalaliStart}
	end := time.Unix(${endEpoch}, 0)   // ${jalaliEnd}

	diff := end.Sub(start)
	fmt.Println(int(diff.Hours() / 24)) // ${totals.days}
	fmt.Println(int64(diff.Seconds()))  // ${totals.seconds}
}`,
      },
    ];
  }, [end, rangeLabels, start, totals, ui]);

  const [snippetTab, setSnippetTab] = useState('js');
  const activeSnippet = snippets.find((snippet) => snippet.key === snippetTab) ?? snippets[0];

  const copy = () => push(shared.copiedToClipboard);
  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const shiftLabels: Array<{ key: keyof typeof DEFAULT_SHIFT; label: string }> = [
    { key: 'years', label: ui.years },
    { key: 'months', label: ui.months },
    { key: 'weeks', label: ui.weeks },
    { key: 'days', label: ui.days },
    { key: 'hour', label: ui.fieldHour },
    { key: 'minute', label: ui.fieldMinute },
    { key: 'second', label: ui.fieldSecond },
  ];

  /* ------------------------------- render ------------------------------- */
  return (
    <div dir={direction} className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-slate-900 dark:bg-[#0b0f19] dark:text-white md:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* breadcrumbs + guarantee pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <nav className="flex flex-wrap items-center gap-1.5">
            <a href={locale === 'en' ? '/en' : '/'} className="hover:text-blue-600">
              {ui.home}
            </a>
            <span className="text-slate-300">›</span>
            <span>{ui.tools}</span>
            <span className="text-slate-300">›</span>
            <b className="font-semibold text-slate-700 dark:text-slate-200">{ui.category}</b>
          </nav>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {ui.badgeLocal}
          </span>
        </div>

        {/* title */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">{ui.title}</h1>
            <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">{ui.subtitle}</p>
          </div>
        </div>

        {/* mode tiles */}
        <div className="flex flex-wrap items-stretch gap-2">
          <ModeTile active={mode === 'diff'} icon={<CalendarRange className="h-4 w-4" />} label={ui.modeDiff} onClick={() => changeMode('diff')} />
          <ModeTile active={mode === 'shift'} icon={<Plus className="h-4 w-4" />} label={ui.modeShift} onClick={() => changeMode('shift')} />
          <ModeTile active={mode === 'countdown'} icon={<TimerReset className="h-4 w-4" />} label={ui.modeCountdown} onClick={() => changeMode('countdown')} />
          <span className="ms-auto hidden items-center gap-1.5 self-center rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-500 ring-1 ring-slate-200 lg:inline-flex dark:bg-[#161b26] dark:ring-white/10">
            <Clock3 className="h-3.5 w-3.5 text-emerald-500" />
            <code dir="ltr" className="font-sans">
              {shared.utcShort}
            </code>
          </span>
        </div>

        {mode === 'shift' ? (
          <div className="grid items-start gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionCard icon={<Timer className="h-4 w-4" />} title={ui.mathTitle} hint={shared.systemOrigin}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SystemToggle system={startSystem} onChange={setStartSystem} labels={{ jalali: shared.jalali, gregorian: shared.gregorian }} />
                  </div>
                  <FieldGroup label={shared.dateLabel}>
                    <div className="grid grid-cols-3 gap-2">
                      {DATE_FIELDS.map((key) => (
                        <NumberField
                          key={key}
                          label={fieldLabels[key]}
                          value={baseParts ? baseParts[key] : null}
                          draft={draft.start[key]}
                          max={key === 'month' ? 12 : baseParts ? daysInMonth(startSystem, baseParts.year, baseParts.month) : 31}
                          onChange={(raw) => commitField('start', key, raw)}
                          onBlur={() => clearDraft('start', key)}
                        />
                      ))}
                    </div>
                  </FieldGroup>
                  <FieldGroup label={shared.timeLabel}>
                    <TimeFields
                      hour={baseParts?.hour ?? null}
                      minute={baseParts?.minute ?? null}
                      second={baseParts?.second ?? null}
                      labels={{ hour: ui.fieldHour, minute: ui.fieldMinute, second: ui.fieldSecond }}
                      onChange={(key, raw) => commitField('start', key, raw)}
                      draft={draft.start}
                      onBlur={(key) => clearDraft('start', key)}
                    />
                  </FieldGroup>
                  {baseParts ? (
                    <DualCalendarWidget
                      value={partsToDate(baseParts, startSystem)}
                      onChange={(next) => {
                        setBaseDate(next);
                        (['year', 'month', 'day', 'hour', 'minute', 'second'] as FieldKey[]).forEach((key) => clearDraft('start', key));
                      }}
                      system={startSystem}
                      onSystemChange={setStartSystem}
                      labels={widgetLabels}
                      today={null}
                      locale={locale}
                      variant="compact"
                    />
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <OperationButton
                      active={operation === 'add'}
                      icon={<Plus className="h-4 w-4" />}
                      title={ui.addTime}
                      hint={ui.toFuture}
                      onClick={() => setOperation('add')}
                    />
                    <OperationButton
                      active={operation === 'sub'}
                      icon={<span className="text-base leading-none">−</span>}
                      title={ui.subTime}
                      hint={ui.toPast}
                      onClick={() => setOperation('sub')}
                    />
                  </div>
                  <FieldGroup label={ui.modeShift}>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {shiftLabels.map(({ key, label }) => (
                        <label key={key} className="block">
                          <span className="mb-1 block truncate text-[10px] font-medium text-slate-400">{label}</span>
                          <input
                            dir="ltr"
                            inputMode="numeric"
                            value={String(shift[key])}
                            onChange={(event) => {
                              const numeric = toInt(event.target.value.replace(/[^\d]/g, ''), 0);
                              setShift((current) => ({ ...current, [key]: numeric }));
                            }}
                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-center font-sans text-sm tabular-nums outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-[#0d1117]"
                          />
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
              </SectionCard>
            </div>
            <div className="lg:col-span-5">
              <SectionCard icon={<Sparkles className="h-4 w-4" />} title={ui.resultTitle} badge={<Badge text={ui.finalAnswer} />}>
                <div className="space-y-3">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                    <span className="text-[11px] font-semibold text-blue-600">
                      {ui.calendarLabel} {startSystem === 'jalali' ? ui.calendarJalali : ui.calendarGregorian}
                    </span>
                    <h2 className="mt-1.5 text-lg font-bold">{shifted ? shifted.jalali : '—'}</h2>
                    <p dir="ltr" className="mt-1 font-sans text-[11px] text-slate-600 dark:text-slate-300">
                      {shifted ? shifted.gregorian : '—'}
                    </p>
                  </div>
                  <ValueRow
                    label={ui.unixTimestamp}
                    value={shifted ? String(epochSeconds(shifted.date)) : '—'}
                    copyLabel={shared.copy}
                    onCopied={copy}
                    ltr
                    tone="primary"
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        ) : (
          <>
            {/* endpoint cards */}
            <div className="grid gap-5 lg:grid-cols-2">
              <EndpointCard
                endpoint="start"
                title={ui.startTitle}
                ui={ui}
                shared={shared}
                fieldLabels={fieldLabels}
                widgetLabels={widgetLabels}
                locale={locale}
                system={startSystem}
                onSystemChange={setStartSystem}
                value={start}
                parts={startParts}
                draft={draft.start}
                onCommitField={(key, raw) => commitField('start', key, raw)}
                onClearDraft={(key) => clearDraft('start', key)}
                onPreset={(preset) => applyPreset('start', preset)}
                onDateChange={(next) => setEndpoint('start', next)}
                num={num}
              />
              <EndpointCard
                endpoint="end"
                title={mode === 'countdown' ? ui.countdownTitle : ui.endTitle}
                ui={ui}
                shared={shared}
                fieldLabels={fieldLabels}
                widgetLabels={widgetLabels}
                locale={locale}
                system={endSystem}
                onSystemChange={setEndSystem}
                value={end}
                parts={endParts}
                draft={draft.end}
                onCommitField={(key, raw) => commitField('end', key, raw)}
                onClearDraft={(key) => clearDraft('end', key)}
                onPreset={(preset) => applyPreset('end', preset)}
                onDateChange={(next) => setEndpoint('end', next)}
                num={num}
              />
            </div>

            {/* action row */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const ok = await writeToClipboard(summaryText);
                  if (ok) push(shared.copiedToClipboard);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-[#161b26] dark:text-slate-300"
              >
                <Hash className="h-3.5 w-3.5" />
                {ui.copySummaryShort}
              </button>
              <button
                type="button"
                onClick={swap}
                title={ui.swapHint}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {ui.swap}
              </button>
            </div>

            {mode === 'countdown' ? (
              <SectionCard icon={<TimerReset className="h-4 w-4" />} title={ui.countdownTitle} hint={ui.countdownHint}>
                <div dir="ltr" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <TimeCell label={ui.countdownDays} value={countdown ? clock(countdown.days) : '--'} />
                  <TimeCell label={ui.countdownHours} value={countdown ? clock(String(countdown.hours).padStart(2, '0')) : '--'} />
                  <TimeCell label={ui.countdownMinutes} value={countdown ? clock(String(countdown.minutes).padStart(2, '0')) : '--'} />
                  <TimeCell label={ui.countdownSeconds} value={countdown ? clock(String(countdown.seconds).padStart(2, '0')) : '--'} />
                </div>
                {countdown?.negative ? (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {ui.countdownPassed}
                  </p>
                ) : null}
                {countdown && !countdown.negative && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds < 1 ? (
                  <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {ui.countdownFinished}
                  </p>
                ) : null}
              </SectionCard>
            ) : null}

            {mounted && diff && totals && business && leap && start && end && rangeLabels ? (
              <>
                {diff.reversed ? (
                  <p className="rounded-md bg-amber-50 px-4 py-2.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {ui.reversedWarning}
                  </p>
                ) : null}

                {/* hero summary */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#161b26]">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    {ui.summaryLabel}
                  </span>
                  <p className="mt-2 text-xl font-bold leading-relaxed sm:text-2xl">
                    {heroYmd} {ui.and}{' '}
                    <span dir="ltr" className="inline-block font-sans tabular-nums text-blue-600 dark:text-blue-400">
                      {heroClock}
                    </span>
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{summaryText}</p>
                </div>

                {/* 6 metric cards */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                  <MetricCard
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    label={ui.metricTotalDays}
                    value={count(totals.days)}
                    hint={ui.hintTotalDays}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <MetricCard
                    icon={<BriefcaseBusiness className="h-3.5 w-3.5" />}
                    label={ui.metricBusinessDays}
                    value={count(business.working)}
                    hint={ui.hintBusinessDays}
                    badge={ui.businessPercentOf.replace('{percent}', num(businessPercent))}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <MetricCard
                    icon={<BarChart3 className="h-3.5 w-3.5" />}
                    label={ui.metricWeeks}
                    value={formatCount(totals.weeksDecimal, locale)}
                    hint={ui.hintWeeks}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <MetricCard
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    label={ui.metricHours}
                    value={count(totals.hours)}
                    hint={ui.hintHours}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <MetricCard
                    icon={<Timer className="h-3.5 w-3.5" />}
                    label={ui.metricMinutes}
                    value={count(totals.minutes)}
                    hint={ui.hintMinutes}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <MetricCard
                    icon={<AlarmClock className="h-3.5 w-3.5" />}
                    label={ui.metricSeconds}
                    value={count(totals.seconds)}
                    hint={ui.hintSeconds}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                </div>

                {/* timeline */}
                <SectionCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  title={ui.timelineTitle}
                  badge={
                    progress ? (
                      <Badge
                        tone="emerald"
                        text={ui.progressElapsed.replace('{percent}', num(Math.round(progress.percent * 10) / 10))}
                      />
                    ) : null
                  }
                >
                  <div className="mb-2 text-center text-[11px] text-slate-500">
                    {progress?.state === 'active' ? ui.progressNow : progress?.state === 'before' ? ui.progressBefore : ui.progressAfter}
                    <span className="mx-1 text-slate-300">•</span>
                    <b className="font-semibold text-slate-600 dark:text-slate-300">{ui.timelineToday}</b>
                    <span className="mx-1 text-slate-300">/</span>
                    <span className="tabular-nums">{rangeLabels.today.jalali}</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0d1117]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-[width] duration-700"
                      style={{ width: `${progress ? Math.min(100, Math.max(0, progress.percent)) : 0}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[11px] text-slate-500">
                    <span className="flex flex-col gap-0.5">
                      <b className="font-semibold text-slate-600 dark:text-slate-300">{ui.timelineStart}</b>
                      <span className="tabular-nums">{rangeLabels.start.jalali}</span>
                      <code dir="ltr" className="font-sans text-[10px] text-slate-400">
                        {rangeLabels.start.gregorian}
                      </code>
                    </span>
                    <span className="flex flex-col items-end gap-0.5 text-end">
                      <b className="font-semibold text-slate-600 dark:text-slate-300">{ui.timelineEnd}</b>
                      <span className="tabular-nums">{rangeLabels.end.jalali}</span>
                      <code dir="ltr" className="font-sans text-[10px] text-slate-400">
                        {rangeLabels.end.gregorian}
                      </code>
                    </span>
                  </div>
                </SectionCard>

                {/* insights */}
                <div className="grid items-start gap-5 lg:grid-cols-3">
                  <SectionCard icon={<Layers className="h-4 w-4" />} title={ui.insightComposition} hint={ui.insightCompositionHint}>
                    {business.total > 0 ? (
                      <DonutChart
                        slices={[
                          { key: 'working', label: ui.legendWorking, value: business.working, color: '#2563eb' },
                          { key: 'weekend', label: ui.legendWeekend, value: business.weekend, color: '#f59e0b' },
                          { key: 'holiday', label: ui.legendHoliday, value: business.holiday, color: '#dc2626' },
                        ]}
                        centerValue={count(business.working)}
                        centerLabel={ui.legendWorking}
                        valueFormatter={(value) => count(value)}
                        size={150}
                        thickness={18}
                      />
                    ) : (
                      <p className="rounded-md bg-slate-50 px-3 py-4 text-[11px] text-slate-500 dark:bg-[#0d1117]">{ui.emptyRange}</p>
                    )}
                  </SectionCard>

                  <SectionCard icon={<CalendarRange className="h-4 w-4" />} title={ui.insightLeap} hint={ui.insightLeapHint}>
                    <div className="space-y-2.5">
                      <LeapRow
                        label={ui.leapRowJalali}
                        badge={ui.leapBadgeJalali}
                        tone="amber"
                        years={leap.jalaliYears}
                        unit={`${num(366)} ${ui.days}`}
                        format={(year) => num(year)}
                        empty={ui.leapNone}
                      />
                      <LeapRow
                        label={ui.leapRowGregorian}
                        badge={ui.leapBadgeGregorian}
                        tone="blue"
                        years={leap.gregorianYears}
                        unit="Feb 29"
                        format={(year) => String(year)}
                        empty={ui.leapNone}
                      />
                      <LeapRow
                        label={ui.leapCommonJalali}
                        tone="slate"
                        years={leap.jalaliCommon}
                        unit={`${num(365)} ${ui.days}`}
                        format={(year) => num(year)}
                        empty={ui.leapNone}
                      />
                      <LeapRow
                        label={ui.leapCommonGregorian}
                        tone="slate"
                        years={leap.gregorianCommon}
                        unit={`${num(365)} ${ui.days}`}
                        format={(year) => String(year)}
                        empty={ui.leapNone}
                      />
                      <p className="flex items-start gap-1.5 rounded-md bg-slate-50 px-3 py-2 text-[10px] leading-5 text-slate-500 dark:bg-[#0d1117]">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                        {ui.leapAlgorithm}
                      </p>
                    </div>
                  </SectionCard>

                  <SectionCard icon={<Globe2 className="h-4 w-4" />} title={ui.insightEpoch} hint={ui.insightEpochHint}>
                    <div className="space-y-2">
                      <ValueRow
                        label={ui.epochStartShort}
                        value={String(epochSeconds(start))}
                        copyLabel={shared.copy}
                        onCopied={copy}
                        ltr
                      />
                      <ValueRow label={ui.epochEndShort} value={String(epochSeconds(end))} copyLabel={shared.copy} onCopied={copy} ltr />
                      <div className="flex items-center justify-between gap-2 rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">{ui.deltaSeconds}</span>
                        <span className="flex items-center gap-1">
                          <code dir="ltr" className="font-sans text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300">
                            {count(totals.seconds)}
                          </code>
                          <span className="text-[10px] text-blue-500">{ui.deltaUnit}</span>
                        </span>
                      </div>
                      <p dir="ltr" className="pt-1 text-center font-sans text-[10px] text-slate-400">
                        {ui.timezoneFooter}
                      </p>
                    </div>
                  </SectionCard>
                </div>

                {/* developer snippets */}
                {activeSnippet ? (
                  <SectionCard
                    icon={<Code2 className="h-4 w-4" />}
                    title={ui.snippetsTitle}
                    hint={ui.snippetsHint}
                    bodyClassName="p-3 sm:p-4"
                  >
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {snippets.map((snippet) => (
                        <button
                          key={snippet.key}
                          type="button"
                          onClick={() => setSnippetTab(snippet.key)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                            snippetTab === snippet.key
                              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 dark:border-white/10 dark:bg-[#161b26] dark:hover:text-slate-300',
                          )}
                        >
                          {snippet.label}
                        </button>
                      ))}
                    </div>

                    <CodeCard
                      code={activeSnippet.code}
                      file={activeSnippet.file}
                      copyLabel={ui.codeCopyLabel}
                      onCopy={async () => {
                        const ok = await writeToClipboard(activeSnippet.code);
                        if (ok) push(shared.copiedToClipboard);
                      }}
                    />
                  </SectionCard>
                ) : null}
              </>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161b26]" />
                ))}
              </div>
            )}
          </>
        )}

        {/* numbered notes: privacy + FAQ */}
        <div className="space-y-3">
          <NoteCard index={1} title={ui.privacyTitle} icon={<ShieldCheck className="h-4 w-4" />}>
            <p className="text-[11px] leading-6 text-slate-500">{ui.privacyIntro}</p>
            <ul className="mt-3 space-y-2">
              {ui.privacyPoints.map((point) => (
                <li key={point.title} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-[#0d1117]">
                  <b className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">{point.title}</b>
                  <span className="mt-1 block text-[11px] leading-5 text-slate-500">{point.text}</span>
                </li>
              ))}
            </ul>
          </NoteCard>
          {ui.faqs.map((faq, index) => (
            <NoteCard key={faq.question} index={index + 2} title={faq.question} icon={<Layers className="h-4 w-4" />}>
              <p className="text-[11px] leading-6 text-slate-500">{faq.answer}</p>
            </NoteCard>
          ))}
        </div>
      </div>

      <ToastViewport toasts={toasts} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * sub-components
 * ------------------------------------------------------------------ */

function OperationButton({ active, icon, title, hint, onClick }: { active: boolean; icon: React.ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 text-start transition-all',
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 dark:border-white/10 dark:bg-[#161b26]',
      )}
    >
      <span className="mb-1.5 block">{icon}</span>
      <b className="block text-xs font-semibold">{title}</b>
      <small className="mt-0.5 block text-[10px] opacity-80">{hint}</small>
    </button>
  );
}

function LeapRow({
  label,
  badge,
  tone,
  years,
  unit,
  format,
  empty,
}: {
  label: string;
  badge?: string;
  tone: 'amber' | 'blue' | 'slate';
  years: readonly number[];
  unit: string;
  format: (year: number) => string;
  empty: string;
}) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    slate: 'bg-slate-100 text-slate-500 dark:bg-[#0d1117] dark:text-slate-400',
  } as const;

  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-[#0d1117]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'amber' ? 'bg-amber-500' : tone === 'blue' ? 'bg-blue-500' : 'bg-slate-300')} />
          {label}
        </span>
        {badge ? <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', tones[tone])}>{badge}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {years.length === 0 ? (
          <span className="text-[10px] text-slate-400">{empty}</span>
        ) : (
          years.map((year) => (
            <span
              key={year}
              className={cn(
                'rounded-md px-2 py-0.5 font-sans text-[10px] font-semibold tabular-nums',
                tone === 'amber'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : tone === 'blue'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'bg-slate-200/70 text-slate-600 dark:bg-[#202634] dark:text-slate-300',
              )}
            >
              {format(year)} <span className="font-sans font-normal opacity-70">({unit})</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function EndpointCard({
  endpoint,
  title,
  ui,
  shared,
  fieldLabels,
  widgetLabels,
  locale,
  system,
  onSystemChange,
  value,
  parts,
  draft,
  onCommitField,
  onClearDraft,
  onPreset,
  onDateChange,
  num,
}: {
  endpoint: Endpoint;
  title: string;
  ui: Ui;
  shared: Shared;
  fieldLabels: Record<FieldKey, string>;
  widgetLabels: CalendarWidgetLabels;
  locale: string;
  system: CalendarSystem;
  onSystemChange: (next: CalendarSystem) => void;
  value: Date | null;
  parts: DateParts | null;
  draft: Partial<Record<FieldKey, string>>;
  onCommitField: (key: FieldKey, raw: string) => void;
  onClearDraft: (key: FieldKey) => void;
  onPreset: (preset: 'now' | 'startOfToday' | 'firstOfMonth' | 'endOfYear' | 'plus30' | 'plus6m') => void;
  onDateChange: (next: Date) => void;
  num: (input: number) => string;
}) {
  const parallel = useMemo(() => {
    if (!value) return null;
    const jalali = toJalaali(value.getFullYear(), value.getMonth() + 1, value.getDate());
    return `${num(jalali.jy)}/${num(jalali.jm)}/${num(jalali.jd)}`;
  }, [num, value]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161b26]">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <strong className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {title}
        </strong>
        <SystemToggle system={system} onChange={onSystemChange} labels={{ jalali: shared.jalali, gregorian: shared.gregorian }} />
      </div>

      <div className="space-y-3 p-4">
        {/* presets */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="me-0.5 text-[10px] font-semibold text-slate-400">{ui.presetsLabel}</span>
          <PresetPill label={ui.presetNow} onClick={() => onPreset('now')} />
          <PresetPill label={ui.presetStartOfToday} onClick={() => onPreset('startOfToday')} />
          <PresetPill label={ui.presetFirstOfMonth} onClick={() => onPreset('firstOfMonth')} />
          <PresetPill label={ui.presetEndOfYear} onClick={() => onPreset('endOfYear')} />
          <PresetPill label={ui.presetPlus30Days} onClick={() => onPreset('plus30')} />
          <PresetPill label={ui.presetPlus6Months} onClick={() => onPreset('plus6m')} />
        </div>

        <FieldGroup label={shared.dateLabel}>
          <div className="grid grid-cols-3 gap-2">
            {DATE_FIELDS.map((key) => (
              <NumberField
                key={key}
                label={fieldLabels[key]}
                value={parts ? parts[key] : null}
                draft={draft[key]}
                max={key === 'month' ? 12 : parts ? daysInMonth(system, parts.year, parts.month) : 31}
                onChange={(raw) => onCommitField(key, raw)}
                onBlur={() => onClearDraft(key)}
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label={shared.timeLabel}>
          <TimeFields
            hour={parts?.hour ?? null}
            minute={parts?.minute ?? null}
            second={parts?.second ?? null}
            labels={{ hour: ui.fieldHour, minute: ui.fieldMinute, second: ui.fieldSecond }}
            onChange={(key, raw) => onCommitField(key, raw)}
            draft={draft}
            onBlur={(key) => onClearDraft(key)}
          />
        </FieldGroup>

        {value ? (
          <DualCalendarWidget
            value={value}
            onChange={onDateChange}
            system={system}
            onSystemChange={onSystemChange}
            labels={widgetLabels}
            today={null}
            locale={locale}
            variant="compact"
          />
        ) : (
          <div className="h-56 animate-pulse rounded-md bg-slate-100 dark:bg-[#0d1117]" />
        )}

        {/* equivalent instant */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-[#0d1117]">
          <span className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="shrink-0">{ui.equivalentGregorian}</span>
            <code dir="ltr" className="truncate font-sans text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {value ? `${formatIsoDate(value)} ${formatClock(value)}` : '—'}
            </code>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <code className="rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {shared.utcShort}
            </code>
            {parallel ? <span className="text-[10px] text-slate-400 tabular-nums">{parallel}</span> : null}
          </span>
        </div>

      </div>
    </div>
  );
}


