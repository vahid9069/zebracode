/**
 * Iranian calendar events & business-day engine — 100% offline.
 *
 * The Iranian official holiday calendar is part calendar-fixed and part
 * lunar-observance based. Lunar (قمری) observances shift every year and can only
 * be published accurately by the official calendar authorities, so they are NOT
 * guessed here. Instead:
 *
 *   1. every *fixed* Jalali solar holiday (Nowruz, 22 Bahman, 29 Esfand, …) is
 *      embedded and always honoured;
 *   2. a few well-known non-official Jalali commemorations are listed for
 *      information (they never affect business-day math);
 *   3. fixed Gregorian/international observances are listed for information;
 *   4. users can add their own lunar holidays locally — they are merged into the
 *      business-day calculation and stored in `localStorage` only.
 */

import { toJalaali } from 'jalaali-js';
import { MS_PER_DAY, addDays, daysInMonth, formatIsoDate, isGregorianLeapYear, startOfDay } from './jalali';

export type HolidayKind = 'national' | 'religious' | 'international';

export interface CalendarEvent {
  title: string;
  titleEn: string;
  kind: HolidayKind;
  /** `true` = offices close and the day is excluded from business-day math. */
  official: boolean;
  subtitle?: string;
  badge?: string;
}

interface FixedEntry {
  month: number;
  day: number;
  fa: string;
  en: string;
  kind: HolidayKind;
  official: boolean;
  subtitle?: string;
  badge?: string;
}

/** Jalali month/day → event. Order is irrelevant; lookups are by key. */
const FIXED_JALALI_EVENTS: readonly FixedEntry[] = [
  { month: 1, day: 1, fa: 'جشن نوروز (آغاز سال نو)', en: 'Nowruz — Persian New Year', kind: 'national', official: true },
  { month: 1, day: 2, fa: 'عید نوروز', en: 'Nowruz Holiday', kind: 'national', official: true },
  { month: 1, day: 3, fa: 'عید نوروز', en: 'Nowruz Holiday', kind: 'national', official: true },
  { month: 1, day: 4, fa: 'عید نوروز', en: 'Nowruz Holiday', kind: 'national', official: true },
  { month: 1, day: 12, fa: 'روز جمهوری اسلامی ایران', en: 'Islamic Republic Day', kind: 'national', official: true },
  { month: 1, day: 13, fa: 'روز طبیعت (سیزده‌بدر)', en: 'Nature Day (Sizdah Bedar)', kind: 'national', official: true },
  { month: 3, day: 14, fa: 'رحلت حضرت امام خمینی', en: 'Demise of Imam Khomeini', kind: 'national', official: true },
  { month: 3, day: 15, fa: 'قیام ۱۵ خرداد', en: 'Khordad 15 Uprising', kind: 'national', official: true },
  { month: 11, day: 22, fa: 'پیروزی انقلاب اسلامی', en: 'Victory of the Islamic Revolution', kind: 'national', official: true },
  { month: 12, day: 29, fa: 'روز ملی شدن صنعت نفت ایران', en: 'Nationalisation of the Iranian Oil Industry', kind: 'national', official: true },

  // Well-known commemorations that do NOT close offices.
  { month: 2, day: 12, fa: 'روز معلم', en: 'Teacher’s Day', kind: 'national', official: false },
  { month: 6, day: 27, fa: 'روز شعر و ادب فارسی', en: 'Persian Poetry & Literature Day', kind: 'national', official: false },
  { month: 7, day: 8, fa: 'بزرگداشت مولوی', en: 'Rumi Commemoration Day', kind: 'national', official: false, subtitle: 'مناسبت فرهنگی و ملی', badge: 'شمسی' },
  { month: 12, day: 15, fa: 'روز درخت‌کاری', en: 'National Tree Planting Day', kind: 'national', official: false },
];

const FIXED_GREGORIAN_EVENTS: readonly FixedEntry[] = [
  { month: 1, day: 1, fa: 'جشن سال نو میلادی', en: 'New Year’s Day', kind: 'international', official: false },
  { month: 2, day: 14, fa: 'روز ولنتاین', en: 'Valentine’s Day', kind: 'international', official: false },
  { month: 3, day: 8, fa: 'روز جهانی زن', en: 'International Women’s Day', kind: 'international', official: false },
  { month: 3, day: 21, fa: 'روز جهانی نوروز', en: 'International Day of Nowruz', kind: 'international', official: false },
  { month: 4, day: 22, fa: 'روز جهانی زمین', en: 'Earth Day', kind: 'international', official: false },
  { month: 5, day: 1, fa: 'روز جهانی کارگر', en: 'International Workers’ Day', kind: 'international', official: false },
  { month: 6, day: 5, fa: 'روز جهانی محیط زیست', en: 'World Environment Day', kind: 'international', official: false },
  { month: 9, day: 21, fa: 'روز جهانی صلح', en: 'International Day of Peace', kind: 'international', official: false },
  { month: 9, day: 30, fa: 'روز جهانی ترجمه', en: 'International Translation Day', kind: 'international', official: false, subtitle: 'International Translation Day', badge: 'میلادی' },
  { month: 9, day: 30, fa: 'روز جهانی ناشنوایان', en: 'International Day of the Deaf', kind: 'international', official: false, subtitle: 'مناسبت سازمان ملل', badge: 'رویداد بین‌المللی' },
  { month: 10, day: 31, fa: 'هالووین', en: 'Halloween', kind: 'international', official: false },
  { month: 12, day: 25, fa: 'کریسمس', en: 'Christmas Day', kind: 'international', official: false },
  { month: 12, day: 31, fa: 'شب سال نو میلادی', en: 'New Year’s Eve', kind: 'international', official: false },
];

function toCalendarEvent(entry: FixedEntry): CalendarEvent {
  return { title: entry.fa, titleEn: entry.en, kind: entry.kind, official: entry.official, subtitle: entry.subtitle, badge: entry.badge };
}

/** Holidays & commemorations attached to a Jalali date (max 31 sessions lookups). */
export function jalaliDayEvents(jy: number, jm: number, jd: number): CalendarEvent[] {
  return FIXED_JALALI_EVENTS.filter((entry) => entry.month === jm && entry.day === jd).map(toCalendarEvent);
}

/** International observances attached to a Gregorian date. */
export function gregorianDayEvents(date: Date): CalendarEvent[] {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return FIXED_GREGORIAN_EVENTS.filter((entry) => entry.month === month && entry.day === day).map(toCalendarEvent);
}

export function isFixedOfficialHoliday(date: Date): boolean {
  const jalali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return FIXED_JALALI_EVENTS.some((entry) => entry.official && entry.month === jalali.jm && entry.day === jalali.jd);
}

/* ------------------------------------------------------------------ *
 * user-defined holidays (lunar observances, company days off, …)
 * ------------------------------------------------------------------ */

export interface CustomHoliday {
  /** Gregorian `YYYY-MM-DD` */
  iso: string;
  title: string;
}

export const CUSTOM_HOLIDAYS_STORAGE_KEY = 'zebracode_custom_holidays';

export function readCustomHolidays(): CustomHoliday[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_HOLIDAYS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CustomHoliday =>
        typeof entry === 'object' && entry !== null
        && typeof (entry as CustomHoliday).iso === 'string'
        && typeof (entry as CustomHoliday).title === 'string',
    );
  } catch {
    return [];
  }
}

export function writeCustomHolidays(holidays: readonly CustomHoliday[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch {
    /* storage might be full or blocked — the tool keeps working in memory */
  }
}

export function customHolidayFor(date: Date, holidays: readonly CustomHoliday[]): CustomHoliday | undefined {
  const iso = formatIsoDate(date);
  return holidays.find((entry) => entry.iso === iso);
}

/* ------------------------------------------------------------------ *
 * day classification & business days
 * ------------------------------------------------------------------ */

export type DayKind = 'working' | 'weekend' | 'holiday';

export function classifyDay(date: Date, custom: readonly CustomHoliday[] = []): DayKind {
  if (isFixedOfficialHoliday(date) || customHolidayFor(date, custom)) return 'holiday';
  const weekday = date.getDay();
  if (weekday === 4 || weekday === 5) return 'weekend'; // Thursday & Friday
  return 'working';
}

export interface BusinessStats {
  total: number;
  working: number;
  weekend: number;
  holiday: number;
  /** guarding flag: ranges longer than 200 years are not iterated */
  truncated: boolean;
}

const MAX_ITERATED_DAYS = 365 * 200;

/**
 * Counts calendar days in `[start, end)` — the exact same window used by
 * `totalsBetween().days` — and classifies each one.
 */
export function businessDayStats(start: Date, end: Date, custom: readonly CustomHoliday[] = []): BusinessStats {
  const earlier = end.getTime() >= start.getTime() ? start : end;
  const later = end.getTime() >= start.getTime() ? end : start;
  const from = startOfDay(earlier);
  const to = startOfDay(later);
  const total = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);

  const stats: BusinessStats = { total: Math.max(0, total), working: 0, weekend: 0, holiday: 0, truncated: false };

  if (total > MAX_ITERATED_DAYS) {
    stats.truncated = true;
    return stats;
  }

  let cursor = from;
  for (let index = 0; index < total; index += 1) {
    const kind = classifyDay(cursor, custom);
    if (kind === 'holiday') stats.holiday += 1;
    else if (kind === 'weekend') stats.weekend += 1;
    else stats.working += 1;
    cursor = addDays(cursor, 1);
  }
  return stats;
}


/* ------------------------------------------------------------------ *
 * leap-year analysis
 * ------------------------------------------------------------------ */

export interface LeapAnalysis {
  jalaliYears: number[];
  gregorianYears: number[];
  /** Non-leap years inside the range — shown so the analysis is verifiable. */
  jalaliCommon: number[];
  gregorianCommon: number[];
  jalaliDays: number;
  gregorianDays: number;
}

const MAX_ANALYSED_YEARS = 60;

export function leapYearsInRange(start: Date, end: Date): LeapAnalysis {
  const from = start.getTime() <= end.getTime() ? start : end;
  const to = start.getTime() <= end.getTime() ? end : start;
  const jalaliFrom = toJalaali(from.getFullYear(), from.getMonth() + 1, from.getDate());
  const jalaliTo = toJalaali(to.getFullYear(), to.getMonth() + 1, to.getDate());

  const jalaliYears: number[] = [];
  const gregorianYears: number[] = [];
  const jalaliCommon: number[] = [];
  const gregorianCommon: number[] = [];

  for (let year = jalaliFrom.jy; year <= jalaliTo.jy && jalaliYears.length + jalaliCommon.length < MAX_ANALYSED_YEARS; year += 1) {
    if (daysInMonth('jalali', year, 12) === 30) jalaliYears.push(year);
    else jalaliCommon.push(year);
  }
  for (
    let year = Math.max(1, from.getFullYear());
    year <= to.getFullYear() && gregorianYears.length + gregorianCommon.length < MAX_ANALYSED_YEARS;
    year += 1
  ) {
    if (isGregorianLeapYear(year)) gregorianYears.push(year);
    else gregorianCommon.push(year);
  }

  return {
    jalaliYears,
    gregorianYears,
    jalaliCommon,
    gregorianCommon,
    jalaliDays: jalaliYears.length,
    gregorianDays: gregorianYears.length,
  };
}
