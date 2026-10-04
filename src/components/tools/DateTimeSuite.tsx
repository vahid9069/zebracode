'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toJalaali } from 'jalaali-js';
import {
  CalendarClock,
  ChevronDown,
  Clock3,
  Code2,
  Info,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dictionary } from '@/i18n/getDictionary';
import { CopyButton, ToastViewport, ValueRow, useToasts } from '@/components/tools/shared/feedback';
import { Badge, NumberField, SectionHeading, SystemToggle } from '@/components/tools/shared/fields';
import DualCalendarWidget, { type CalendarWidgetLabels } from '@/components/tools/shared/DualCalendarWidget';
import { buildCalendarLabels, formatRelative } from '@/components/tools/shared/calendarLabels';
import {
  type CalendarSystem,
  type DateParts,
  dateToParts,
  daysInMonth,
  epochSeconds,
  formatClock,
  formatIsoDate,
  formatJalaliNumeric,
  formatNumber,
  localiseDigits,
  partsToDate,
  relativeToNow,
  toInt,
  weekIndex,
} from '@/lib/datetime/jalali';
import {
  type CalendarEvent,
  type CustomHoliday,
  customHolidayFor,
  gregorianDayEvents,
  isFixedOfficialHoliday,
  jalaliDayEvents,
  readCustomHolidays,
  writeCustomHolidays,
} from '@/lib/datetime/holidays';

type Ui = Dictionary['common']['toolsUi']['timestamp'];
type Shared = Dictionary['common']['toolsUi']['shared'];
type FieldKey = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

const CARD = 'rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161b26]';
const DATE_FIELDS: readonly FieldKey[] = ['year', 'month', 'day', 'hour', 'minute', 'second'];

export default function DateTimeSuite() {
  const { locale, dict } = useI18n();
  const ui = dict.common.toolsUi.timestamp;
  const shared = dict.common.toolsUi.shared;
  const { toasts, push } = useToasts();

  const num = useCallback((input: number) => formatNumber(input, locale), [locale]);
  const widgetLabels = useMemo<CalendarWidgetLabels>(() => buildCalendarLabels(shared), [shared]);
  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const copy = useCallback(() => push(shared.copiedToClipboard), [push, shared.copiedToClipboard]);

  /* ------------------------------- clock ------------------------------- */
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [live, setLive] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);
  const [system, setSystem] = useState<CalendarSystem>('jalali');

  useEffect(() => {
    const instant = new Date();
    setNow(instant);
    setSelected(instant);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!live || !mounted) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [live, mounted]);

  /* --------------------------- custom holidays -------------------------- */
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  useEffect(() => {
    setCustomHolidays(readCustomHolidays());
  }, []);
  const persistCustomHolidays = useCallback((next: CustomHoliday[]) => {
    setCustomHolidays(next);
    writeCustomHolidays(next);
  }, []);

  /* ------------------------------ selection ----------------------------- */
  const parts: DateParts | null = useMemo(() => (selected ? dateToParts(selected, system) : null), [selected, system]);
  const [draft, setDraft] = useState<Partial<Record<FieldKey, string>>>({});

  const selectDate = useCallback((next: Date) => {
    setDraft({});
    setDraftEpoch(null);
    setSelected(next);
  }, []);

  const clearDraft = useCallback((key: FieldKey) => {
    setDraft((current) => ({ ...current, [key]: undefined }));
  }, []);

  const commitField = useCallback(
    (key: FieldKey, raw: string) => {
      setDraft((current) => ({ ...current, [key]: raw }));
      if (!selected || !parts) return;
      const numeric = toInt(raw, NaN);
      if (!Number.isFinite(numeric)) return;
      const nextParts: DateParts = { ...parts, [key]: numeric };
      setSelected(partsToDate(nextParts, system));
    },
    [parts, selected, system],
  );

  const applyPreset = useCallback(
    (kind: 'now' | 'startOfDay' | 'endOfDay') => {
      const base = now ?? new Date();
      const current = parts ?? dateToParts(base, system);
      if (kind === 'now') selectDate(base);
      else if (kind === 'startOfDay') selectDate(partsToDate({ ...current, hour: 0, minute: 0, second: 0 }, system));
      else selectDate(partsToDate({ ...current, hour: 23, minute: 59, second: 59 }, system));
    },
    [now, parts, selectDate, system],
  );

  /* ------------------------------ derived ------------------------------- */
  const selectedEpoch = selected ? epochSeconds(selected) : null;

  // Editable timestamp in the dark card
  const [draftEpoch, setDraftEpoch] = useState<string | null>(null);

  const commitEpochDraft = useCallback(
    (raw: string) => {
      setDraftEpoch(null);
      const digits = raw.replace(/[^\d-]/g, '');
      if (!digits) return;
      const numeric = Number(digits);
      if (!Number.isFinite(numeric)) return;
      // auto-detect seconds vs milliseconds
      const seconds = Math.floor(digits.length >= 13 ? numeric / 1000 : numeric);
      const next = new Date(seconds * 1000);
      if (!Number.isNaN(next.getTime())) selectDate(next);
    },
    [selectDate],
  );
  const selectedJalali = useMemo(
    () => (selected ? toJalaali(selected.getFullYear(), selected.getMonth() + 1, selected.getDate()) : null),
    [selected],
  );

  const dayEvents: CalendarEvent[] = useMemo(() => {
    if (!selected || !selectedJalali) return [];
    return [...jalaliDayEvents(selectedJalali.jy, selectedJalali.jm, selectedJalali.jd), ...gregorianDayEvents(selected)];
  }, [selected, selectedJalali]);

  const customToday = selected ? customHolidayFor(selected, customHolidays) : undefined;
  const isOfficial = selected ? isFixedOfficialHoliday(selected) || Boolean(customToday) : false;
  const isWeekend = selected ? selected.getDay() === 4 || selected.getDay() === 5 : false;

  const [holidayName, setHolidayName] = useState('');
  const addHoliday = () => {
    if (!selected || !holidayName.trim()) return;
    const iso = formatIsoDate(selected);
    const next = [...customHolidays.filter((entry) => entry.iso !== iso), { iso, title: holidayName.trim() }];
    persistCustomHolidays(next);
    setHolidayName('');
  };
  const removeHoliday = (iso: string) => persistCustomHolidays(customHolidays.filter((entry) => entry.iso !== iso));

  /* --------------------------- epoch -> date ---------------------------- */
  const [epochInput, setEpochInput] = useState('');
  const [committedEpoch, setCommittedEpoch] = useState('');
  useEffect(() => {
    if (!mounted) return;
    const value = String(epochSeconds(new Date()));
    setEpochInput(value);
    setCommittedEpoch(value);
  }, [mounted]);

  const detection = useMemo(() => {
    const digits = epochInput.replace(/[^\d]/g, '');
    return digits.length >= 13 ? ui.detectedMilliseconds : ui.detectedSeconds;
  }, [epochInput, ui.detectedMilliseconds, ui.detectedSeconds]);

  const converted = useMemo<{ date: Date; seconds: number } | null>(() => {
    const normalised = committedEpoch.replace(/[^\d-]/g, '');
    if (!normalised) return null;
    const numeric = Number(normalised);
    if (!Number.isFinite(numeric)) return null;
    const seconds = Math.floor(normalised.length >= 13 ? numeric / 1000 : numeric);
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return { date, seconds };
  }, [committedEpoch]);

  const convertedJalali = converted ? toJalaali(converted.date.getFullYear(), converted.date.getMonth() + 1, converted.date.getDate()) : null;

  /* ------------------------------ snippets ------------------------------ */
  const snippets = useMemo(
    () => [
      { key: 'js', label: ui.snippetJs, code: 'Math.floor(Date.now() / 1000)' },
      { key: 'python', label: ui.snippetPython, code: 'import time; int(time.time())' },
      { key: 'go', label: ui.snippetGo, code: 'time.Now().Unix()' },
    ],
    [ui.snippetGo, ui.snippetJs, ui.snippetPython],
  );
  const [snippetsOpen, setSnippetsOpen] = useState(true);

  /* ------------------------------- render ------------------------------- */
  return (
    <div dir={direction} className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-slate-900 dark:bg-[#0b0f19] dark:text-white md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* breadcrumbs — hidden per design */}
        <nav className="hidden flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <a href={locale === 'en' ? '/en' : '/'} className="hover:text-blue-600">
            {ui.home}
          </a>
          <span className="text-slate-300">›</span>
          <span>{ui.tools}</span>
          <span className="text-slate-300">›</span>
          <span>{ui.category}</span>
          <span className="text-slate-300">›</span>
          <b className="font-semibold text-slate-700 dark:text-slate-200">{ui.pageTitle}</b>
        </nav>

        {/* header: title + inline live epoch */}
        <div className={cn(CARD, 'flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5')}>
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold sm:text-2xl">{ui.pageTitle}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {ui.badge}
                </span>
              </div>
              <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">{ui.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#0d1117]">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400">{ui.liveEpochLabel}</span>
              <code dir="ltr" className="font-sans text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {now ? epochSeconds(now) : '—'}
              </code>
            </span>
            <div className="flex items-center gap-2">
              <CopyButton size="sm" value={now ? String(epochSeconds(now)) : ''} label={ui.copySeconds} onCopied={copy} />
              <CopyButton size="sm" value={now ? String(now.getTime()) : ''} label={ui.copyMilliseconds} onCopied={copy} />
            </div>
          </div>
        </div>

        {/* calendar + day panel */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className={cn(CARD, 'p-4')}>
            {selected ? (
              <DualCalendarWidget
                value={selected}
                onChange={selectDate}
                system={system}
                onSystemChange={setSystem}
                labels={widgetLabels}
                today={now}
                locale={locale}
                variant="full"
                fullWeekdays
              />
            ) : (
              <div className="h-[420px] animate-pulse rounded-lg bg-slate-100 dark:bg-[#0d1117]" />
            )}
          </div>

          <div className="space-y-5">
            {/* selected timestamp */}
            <div className="rounded-2xl bg-[#1e2538] p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <CopyButton
                  value={selectedEpoch === null ? '' : String(selectedEpoch)}
                  label={ui.copyTimestamp}
                  onCopied={copy}
                  className="text-slate-300 hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
                />
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
                  <Pencil className="h-3 w-3" />
                  {ui.editableBadge}
                </span>
              </div>

              <input
                dir="ltr"
                inputMode="numeric"
                aria-label={ui.copyTimestamp}
                value={draftEpoch ?? (selectedEpoch === null ? '' : String(selectedEpoch))}
                onChange={(e) => setDraftEpoch(e.target.value.replace(/[^\d-]/g, ''))}
                onBlur={(e) => commitEpochDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                    commitEpochDraft(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setDraftEpoch(null);
                  }
                }}
                className="mt-3 w-full rounded-lg border border-transparent bg-transparent text-center font-sans text-3xl font-bold tabular-nums text-white outline-none transition-colors hover:border-white/20 focus:border-blue-400 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="mt-2 text-center">
                <p className="text-sm font-bold text-slate-200">{selected ? shared.weekdayNames[weekIndex(selected)] : '—'}</p>
                <p dir="ltr" className="mt-0.5 font-sans text-[11px] text-slate-400">
                  {selected && selectedJalali
                    ? `${formatIsoDate(selected)} • ${formatJalaliNumeric(
                        { year: selectedJalali.jy, month: selectedJalali.jm, day: selectedJalali.jd, hour: 0, minute: 0, second: 0 },
                        locale,
                      )}`
                    : '—'}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1">
                <DarkTimeField
                  label={ui.clockHours}
                  value={parts?.hour ?? null}
                  max={23}
                  draft={draft.hour}
                  onChange={(raw) => commitField('hour', raw)}
                  onBlur={() => clearDraft('hour')}
                />
                <span className="mb-5 text-2xl font-bold text-slate-400">:</span>
                <DarkTimeField
                  label={ui.clockMinutes}
                  value={parts?.minute ?? null}
                  max={59}
                  draft={draft.minute}
                  onChange={(raw) => commitField('minute', raw)}
                  onBlur={() => clearDraft('minute')}
                />
                <span className="mb-5 text-2xl font-bold text-slate-400">:</span>
                <DarkTimeField
                  label={ui.clockSeconds}
                  value={parts?.second ?? null}
                  max={59}
                  draft={draft.second}
                  onChange={(raw) => commitField('second', raw)}
                  onBlur={() => clearDraft('second')}
                />
              </div>
            </div>

            {/* day events */}
            <div className={cn(CARD, 'p-4')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-100">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  {ui.eventsTitle}
                </span>
                <code dir="ltr" className="font-sans text-[11px] text-slate-400">
                  {selected && selectedJalali
                    ? formatJalaliNumeric({ year: selectedJalali.jy, month: selectedJalali.jm, day: selectedJalali.jd, hour: 0, minute: 0, second: 0 }, locale)
                    : ''}
                </code>
              </div>

              {customToday ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-[#0d1117]">
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge text={ui.customBadge} />
                    <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{customToday.title}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={ui.removeHoliday}
                    title={ui.removeHoliday}
                    onClick={() => removeHoliday(customToday.iso)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}

              {dayEvents.length === 0 && !customToday ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-[11px] text-slate-500 dark:bg-[#0d1117]">{ui.noEvents}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {dayEvents.map((event) => (
                    <li key={`${event.titleEn}-${event.kind}`} className="flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200">{event.title}</span>
                          {event.titleEn && event.titleEn !== event.title ? (
                            <span dir="ltr" className="mt-0.5 block text-[10px] text-slate-400">
                              {event.titleEn}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                        {event.official ? ui.officialBadge : event.kind === 'international' ? ui.internationalBadge : ui.nonOfficialBadge}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-[11px] dark:border-white/10">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {ui.officialYes.split(':')[0]}:
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    isOfficial
                      ? 'text-red-600 dark:text-red-400'
                      : isWeekend
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {(() => {
                    const str = isOfficial ? ui.officialYes : ui.officialNo;
                    const idx = str.indexOf(':');
                    return idx >= 0 ? str.slice(idx + 1).trim() : str;
                  })()}
                  {!isOfficial && isWeekend ? <span className="font-normal opacity-80"> • {shared.weekendBadge}</span> : null}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* conversion cards: epoch -> date first (right in RTL), then date -> epoch */}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className={cn(CARD, 'p-4')}>
            <SectionHeading icon={<Clock3 className="h-5 w-5" />} tone="blue" title={ui.epochToDateTitle} hint={ui.epochToDateHint} />

            <div className="mt-4 space-y-3">
              <span className="block text-[11px] font-semibold text-slate-500">{ui.epochValueLabel}</span>
              <div className="flex flex-wrap gap-2">
                <input
                  dir="ltr"
                  value={epochInput}
                  onChange={(event) => setEpochInput(event.target.value.replace(/[^\d-]/g, ''))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setCommittedEpoch(epochInput);
                  }}
                  placeholder={ui.epochInputPlaceholder}
                  aria-label={ui.epochValueLabel}
                  className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 font-sans text-sm tabular-nums outline-none transition-colors focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-[#0d1117]"
                />
                <button
                  type="button"
                  onClick={() => setCommittedEpoch(epochInput)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {ui.convertButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const value = String(epochSeconds(new Date()));
                    setEpochInput(value);
                    setCommittedEpoch(value);
                  }}
                  className="inline-flex h-10 shrink-0 items-center rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-[#161b26] dark:text-slate-300"
                >
                  {shared.now}
                </button>
              </div>

              <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Info className="h-3.5 w-3.5" />
                {detection}
              </p>

              {converted && convertedJalali ? (
                <div className="space-y-2">
                  <ValueRow
                    label={ui.jalaliDateOut}
                    value={`${localiseDigits(formatClock(converted.date), locale)} - ${formatJalaliNumeric(
                      { year: convertedJalali.jy, month: convertedJalali.jm, day: convertedJalali.jd, hour: 0, minute: 0, second: 0 },
                      locale,
                    )}`}
                    copyLabel={shared.copy}
                    onCopied={copy}
                  />
                  <ValueRow
                    label={ui.gregorianDateOut}
                    value={`${formatClock(converted.date)} ${formatIsoDate(converted.date)}`}
                    copyLabel={shared.copy}
                    onCopied={copy}
                    ltr
                  />
                  <ValueRow label={ui.isoOut} value={converted.date.toISOString()} copyLabel={shared.copy} onCopied={copy} ltr />
                  <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-[#0d1117]">
                    <span className="shrink-0 text-xs text-slate-500">{ui.relativeOut}</span>
                    <span className="truncate text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {now ? formatRelative(shared.rel, relativeToNow(converted.date, now), num) : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-3 text-[11px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  <TriangleAlert className="h-4 w-4 shrink-0" />
                  {ui.invalidEpoch}
                </p>
              )}
            </div>
          </div>

          <div className={cn(CARD, 'p-4')}>
            <SectionHeading icon={<CalendarClock className="h-5 w-5" />} tone="emerald" title={ui.dateToEpochTitle} hint={ui.dateToEpochHint} />

            <div className="mt-4 space-y-3">
              <div className="flex justify-end">
                <SystemToggle system={system} onChange={setSystem} labels={{ jalali: shared.jalali, gregorian: shared.gregorian }} />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {DATE_FIELDS.map((key) => (
                  <NumberField
                    key={key}
                    label={ui[key]}
                    value={parts ? parts[key] : null}
                    draft={draft[key]}
                    max={fieldMax(key, parts, system)}
                    onChange={(raw) => commitField(key, raw)}
                    onBlur={() => clearDraft(key)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <ValueRow
                  label={ui.epochSecondsOut}
                  value={selectedEpoch === null ? '—' : String(selectedEpoch)}
                  copyLabel={shared.copy}
                  onCopied={copy}
                  ltr
                  tone="primary"
                />
                <ValueRow
                  label={ui.epochMillisecondsOut}
                  value={selected ? String(selected.getTime()) : '—'}
                  copyLabel={shared.copy}
                  onCopied={copy}
                  ltr
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraft({});
                    if (selected) setSelected(new Date(selected.getTime()));
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  {ui.recalculateButton}
                </button>
                <PresetChip label={ui.startOfDay} onClick={() => applyPreset('startOfDay')} />
                <PresetChip label={ui.endOfDay} onClick={() => applyPreset('endOfDay')} />
              </div>
            </div>
          </div>
        </div>

        {/* developer snippets */}
        <div className={cn(CARD, 'p-4')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              aria-expanded={snippetsOpen}
              onClick={() => setSnippetsOpen((current) => !current)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-100"
            >
              <Code2 className="h-3.5 w-3.5 text-blue-600" />
              {ui.snippetsTitle}
            </button>
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{ui.epochReference}</span>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', snippetsOpen && 'rotate-180')} />
            </span>
          </div>

          {snippetsOpen ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {snippets.map((snippet) => (
                <div key={snippet.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0d1117]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-100">{snippet.label}</span>
                    <CopyButton size="sm" value={snippet.code} label={shared.copyCode} onCopied={copy} />
                  </div>
                  <pre dir="ltr" className="mt-2 overflow-x-auto text-start">
                    <code className="font-sans text-[11px] leading-5 text-slate-600 dark:text-slate-300">{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <ToastViewport toasts={toasts} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * local helpers
 * ------------------------------------------------------------------ */

function fieldMax(key: FieldKey, parts: DateParts | null, system: CalendarSystem): number | undefined {
  if (key === 'month') return 12;
  if (key === 'day') return parts ? daysInMonth(system, parts.year, parts.month) : 31;
  if (key === 'hour') return 23;
  if (key === 'minute' || key === 'second') return 59;
  return undefined;
}

/** Editable dark time cell used inside the selected-timestamp card. */
function DarkTimeField({
  label,
  value,
  max,
  draft,
  onChange,
  onBlur,
}: {
  label: string;
  value: number | null;
  max: number;
  draft?: string;
  onChange: (raw: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="flex flex-col items-center gap-1">
      <input
        dir="ltr"
        inputMode="numeric"
        max={max}
        aria-label={label}
        title={label}
        value={draft ?? (value === null ? '' : String(value).padStart(2, '0'))}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={onBlur}
        className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 text-center font-sans text-xl font-bold tabular-nums text-white outline-none transition-colors focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/40"
      />
      <span className="text-[10px] text-slate-400">{label}</span>
    </label>
  );
}

/** Bordered action chip used next to the recalculate button. */
function PresetChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-[#161b26] dark:text-slate-300 dark:hover:border-blue-900"
    >
      {label}
    </button>
  );
}
