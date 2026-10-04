/**
 * Shared date engine for the ZebraCode date & time tools.
 *
 * Everything here is pure, synchronous and browser-local: no network calls,
 * no timezone database lookups. Jalali <-> Gregorian conversion is delegated to
 * `jalaali-js`, which implements the Khayyam/Borkowski algorithm (accurate to
 * one day in ~5000 years for the Jalali solar calendar).
 */

import { isLeapJalaaliYear, jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';

export type CalendarSystem = 'jalali' | 'gregorian';

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const JALALI_WEEK_START = 0; // 0 = Saturday in `jalaliWeekdayIndex`

const GREGORIAN_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/* ------------------------------------------------------------------ *
 * number & digit helpers
 * ------------------------------------------------------------------ */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function pad2(value: number): string {
  return String(Math.trunc(Math.abs(value))).padStart(2, '0');
}

/**
 * Localised, un-grouped digits — the safe formatter for calendar years and day
 * numbers, where `1405` must never become `1,405`.
 */
export function formatNumber(value: number, locale: string): string {
  const text = String(value);
  return locale === 'fa' ? text.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]) : text;
}

/**
 * Localised digits with thousands separators — for counts, epochs and totals.
 * The design reference keeps a latin `,` group separator in both locales, so the
 * value stays copy-paste friendly while the digits themselves stay localised.
 */
export function formatCount(value: number, locale: string): string {
  const negative = value < 0;
  const grouped = String(Math.abs(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = locale === 'fa' ? grouped.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]) : grouped;
  return negative ? `-${text}` : text;
}

/** Converts Persian/Arabic-Indic digits back to latin so inputs stay parseable. */
export function normaliseDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (digit) => String(FA_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/٫/g, '.');
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Coerces arbitrary input into a safe integer. Empty or unparsable input falls
 * back instead of silently becoming `0`, so half-typed fields never clobber the
 * previous value.
 */
export function toInt(raw: string | number, fallback = 0): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.trunc(raw) : fallback;
  const cleaned = normaliseDigits(String(raw)).replace(/[^\d.-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return fallback;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/* ------------------------------------------------------------------ *
 * calendar math
 * ------------------------------------------------------------------ */

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isLeapYear(system: CalendarSystem, year: number): boolean {
  return system === 'jalali' ? isLeapJalaaliYear(year) : isGregorianLeapYear(year);
}

/** Number of days in a month, tolerant to out-of-range months (clamped). */
export function daysInMonth(system: CalendarSystem, year: number, month: number): number {
  const safeMonth = clamp(month, 1, 12);
  if (system === 'jalali') return jalaaliMonthLength(year, safeMonth);
  if (safeMonth === 2 && isGregorianLeapYear(year)) return 29;
  return GREGORIAN_MONTH_DAYS[safeMonth - 1];
}

export function daysInYear(system: CalendarSystem, year: number): number {
  return isLeapYear(system, year) ? 366 : 365;
}

/** `0 = Saturday … 6 = Friday` — the Iranian week layout. */
export function weekIndex(date: Date): number {
  return (date.getDay() + 1) % 7;
}

export function isThursday(date: Date): boolean {
  return date.getDay() === 4;
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

/** Thursday + Friday form the Iranian weekend. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 4 || day === 5;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 0);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  const targetMonth = next.getMonth() + amount;
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(targetMonth);
  next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  return next;
}

/* ------------------------------------------------------------------ *
 * conversion between the two calendars
 * ------------------------------------------------------------------ */

/** Current instant expressed as parts in the requested calendar (local time). */
export function dateToParts(date: Date, system: CalendarSystem): DateParts {
  if (system === 'gregorian') {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
  const jalali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return {
    year: jalali.jy,
    month: jalali.jm,
    day: jalali.jd,
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

/** Builds a local `Date` from calendar parts, clamping every field. */
export function partsToDate(parts: DateParts, system: CalendarSystem): Date {
  const year = toInt(parts.year, 1) || 1;
  const month = clamp(toInt(parts.month, 1), 1, 12);
  const day = clamp(toInt(parts.day, 1), 1, daysInMonth(system, year, month));
  const hour = clamp(toInt(parts.hour, 0), 0, 23);
  const minute = clamp(toInt(parts.minute, 0), 0, 59);
  const second = clamp(toInt(parts.second, 0), 0, 59);

  if (system === 'jalali') {
    const gregorian = toGregorian(year, month, day);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd, hour, minute, second);
  }
  return new Date(year, month - 1, day, hour, minute, second);
}

/** Re-expresses the very same instant in the other calendar system. */
export function convertParts(parts: DateParts, from: CalendarSystem, to: CalendarSystem): DateParts {
  if (from === to) return parts;
  return dateToParts(partsToDate(parts, from), to);
}

export function epochSeconds(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_SECOND);
}

export function isJalaliDateValid(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= jalaaliMonthLength(year, month);
}

/* ------------------------------------------------------------------ *
 * formatting
 * ------------------------------------------------------------------ */

export interface FormatOptions {
  locale: string;
  withSeconds?: boolean;
  withTime?: boolean;
}

export function formatClock(date: Date, withSeconds = true): string {
  const base = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return withSeconds ? `${base}:${pad2(date.getSeconds())}` : base;
}

/** Rewrites every latin digit in a string with localised ones. */
export function localiseDigits(text: string, locale: string): string {
  return locale === 'fa' ? text.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]) : text;
}

/** `1405/07/08` in localised digits. */
export function formatJalaliNumeric(parts: DateParts, locale: string, padded = true): string {
  const month = padded ? pad2(parts.month) : String(parts.month);
  const day = padded ? pad2(parts.day) : String(parts.day);
  return localiseDigits(`${parts.year}/${month}/${day}`, locale);
}

/** `2026-09-30` (always latin digits — used for machine readable output). */
export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatIsoDateTime(date: Date): string {
  return `${formatIsoDate(date)} ${formatClock(date)}`;
}

/** ISO-8601 in UTC, e.g. `2026-09-30T12:34:56.000Z`. */
export function epochToIsoUtc(epochSecondsValue: number): string {
  return new Date(epochSecondsValue * MS_PER_SECOND).toISOString();
}

/** `Sep 30` style short Gregorian label for the secondary line of calendar tiles. */
export function shortParallelLabel(date: Date, system: CalendarSystem, locale: string, shortMonths: readonly string[]): string {
  if (system === 'jalali') return `${shortMonths[date.getMonth()]} ${date.getDate()}`;
  const jalali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${formatNumber(jalali.jm, locale)}/${formatNumber(jalali.jd, locale)}`;
}

/* ------------------------------------------------------------------ *
 * differences
 * ------------------------------------------------------------------ */

export interface CivilBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true when `end` happened before `start` */
  reversed: boolean;
  /** absolute milliseconds between the two instants */
  milliseconds: number;
}

/**
 * Classic borrow-based civil difference. `years`/`months`/`days` are calendar
 * aware (a month is the real length of the month preceding the end date), while
 * the time part is a plain clock subtraction.
 */
export function civilDifference(start: Date, end: Date): CivilBreakdown {
  const reversed = end.getTime() < start.getTime();
  const from = reversed ? end : start;
  const to = reversed ? start : end;

  let seconds = to.getSeconds() - from.getSeconds();
  let minutes = to.getMinutes() - from.getMinutes();
  let hours = to.getHours() - from.getHours();
  let days = to.getDate() - from.getDate();
  let months = to.getMonth() - from.getMonth();
  let years = to.getFullYear() - from.getFullYear();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const previousMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    reversed,
    milliseconds: Math.abs(to.getTime() - from.getTime()),
  };
}

export interface Totals {
  days: number;
  weeks: number;
  weeksDecimal: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export function totalsBetween(start: Date, end: Date): Totals {
  const milliseconds = Math.abs(end.getTime() - start.getTime());
  const seconds = Math.floor(milliseconds / MS_PER_SECOND);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return {
    days,
    weeks: Math.floor(days / 7),
    weeksDecimal: Math.round((days / 7) * 10) / 10,
    hours,
    minutes,
    seconds,
    milliseconds,
  };
}

/* ------------------------------------------------------------------ *
 * epoch parsing
 * ------------------------------------------------------------------ */

export type EpochUnit = 'seconds' | 'milliseconds';

/** Heuristic: 13+ digits means milliseconds (year > 2286 in seconds). */
export function detectEpochUnit(raw: string): EpochUnit {
  const digits = normaliseDigits(String(raw)).replace(/[^\d]/g, '');
  return digits.length >= 13 ? 'milliseconds' : 'seconds';
}

export function parseEpoch(raw: string): { seconds: number; unit: EpochUnit } | null {
  const normalised = normaliseDigits(String(raw)).trim();
  if (!normalised || !/^-?\d+(\.\d+)?$/.test(normalised)) return null;
  const numeric = Number(normalised);
  if (!Number.isFinite(numeric)) return null;
  const unit = detectEpochUnit(normalised);
  const seconds = Math.floor(unit === 'milliseconds' ? numeric / MS_PER_SECOND : numeric);
  if (Math.abs(seconds) > 8.64e15 / MS_PER_SECOND) return null; // outside Date range
  return { seconds, unit };
}

/* ------------------------------------------------------------------ *
 * relative ("۳ ساعت پیش")
 * ------------------------------------------------------------------ */

export type RelativeUnit = 'now' | 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

export interface RelativeResult {
  unit: RelativeUnit;
  value: number;
  future: boolean;
}

export function relativeToNow(target: Date, now: Date = new Date()): RelativeResult {
  const delta = target.getTime() - now.getTime();
  const future = delta > 0;
  const abs = Math.abs(delta);

  if (abs < 45 * MS_PER_SECOND) return { unit: 'now', value: 0, future };
  if (abs < 90 * MS_PER_SECOND) return { unit: 'second', value: 1, future };
  if (abs < 45 * MS_PER_MINUTE) return { unit: 'minute', value: Math.round(abs / MS_PER_MINUTE), future };
  if (abs < 90 * MS_PER_MINUTE) return { unit: 'hour', value: 1, future };
  if (abs < 22 * MS_PER_HOUR) return { unit: 'hour', value: Math.round(abs / MS_PER_HOUR), future };
  if (abs < 36 * MS_PER_HOUR) return { unit: 'day', value: 1, future };
  if (abs < 26 * MS_PER_DAY) return { unit: 'day', value: Math.round(abs / MS_PER_DAY), future };
  if (abs < 45 * MS_PER_DAY) return { unit: 'month', value: 1, future };
  if (abs < 320 * MS_PER_DAY) return { unit: 'month', value: Math.round(abs / (30.44 * MS_PER_DAY)), future };
  if (abs < 548 * MS_PER_DAY) return { unit: 'year', value: 1, future };
  return { unit: 'year', value: Math.round(abs / (365.25 * MS_PER_DAY)), future };
}

/** Clamps a month index so calendar navigation can never produce month 13. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = (year * 12) + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12 + 12) % 12 + 1 };
}
