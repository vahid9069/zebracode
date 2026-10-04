import type { Dictionary } from '@/i18n/getDictionary';
import type { RelativeResult } from '@/lib/datetime/jalali';
import type { CalendarWidgetLabels } from './DualCalendarWidget';

type SharedStrings = Dictionary['common']['toolsUi']['shared'];

/**
 * Single place that adapts the `toolsUi.shared` dictionary block to the label
 * contract of `DualCalendarWidget`, so both datetime tools stay in sync.
 */
export function buildCalendarLabels(shared: SharedStrings): CalendarWidgetLabels {
  return {
    jumpToday: shared.today,
    jumpYesterday: shared.yesterday,
    jumpTomorrow: shared.tomorrow,
    jumpNextWeek: shared.nextWeek,
    jumpNextMonth: shared.nextMonth,
    quickJumpTitle: shared.quickJumpTitle,
    switchToJalali: shared.switchToJalali,
    switchToGregorian: shared.switchToGregorian,
    jalali: shared.jalali,
    gregorian: shared.gregorian,
    selectMonth: shared.selectMonth,
    selectYear: shared.selectYear,
    prevMonth: shared.prevMonth,
    nextMonth: shared.nextMonthLabel,
    todayButton: shared.todayButton,
    weekdaysJalali: shared.weekdaysJalali,
    weekdaysGregorian: shared.weekdaysGregorian,
    weekdayNames: shared.weekdayNames,
    jalaliMonths: shared.jalaliMonths,
    gregorianMonths: shared.gregorianMonths,
    gregorianShortMonths: shared.gregorianShortMonths,
    monthDays: shared.monthDays,
    leapYear: shared.leapYear,
    commonYear: shared.commonYear,
    yearDays: shared.yearDays,
    parallelHint: shared.parallelHint,
  };
}

/** `۳ ساعت پیش` / `in 3 hours`. */
export function formatRelative(rel: SharedStrings['rel'], result: RelativeResult, num: (input: number) => string): string {
  if (result.unit === 'now') return rel.now;
  const unitLabel = result.value === 1 ? rel.units[result.unit].one : rel.units[result.unit].many;
  const pattern = result.future ? rel.future : rel.past;
  return pattern.replace('{value}', num(result.value)).replace('{unit}', unitLabel);
}
