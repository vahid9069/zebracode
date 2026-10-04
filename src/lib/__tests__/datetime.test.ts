import { describe, expect, it } from 'vitest';
import {
  civilDifference,
  dateToParts,
  daysInMonth,
  detectEpochUnit,
  formatCount,
  formatNumber,
  isLeapYear,
  normaliseDigits,
  parseEpoch,
  partsToDate,
  relativeToNow,
  toInt,
  totalsBetween,
  weekIndex,
} from '@/lib/datetime/jalali';
import { businessDayStats, classifyDay, isFixedOfficialHoliday, leapYearsInRange } from '@/lib/datetime/holidays';

describe('Jalali <-> Gregorian conversion', () => {
  it('converts the briefed reference date both ways', () => {
    const parts = dateToParts(new Date(2026, 8, 30, 12, 0, 0), 'jalali');
    expect([parts.year, parts.month, parts.day]).toEqual([1405, 7, 8]);

    const back = partsToDate({ year: 1405, month: 7, day: 8, hour: 0, minute: 0, second: 0 }, 'jalali');
    expect([back.getFullYear(), back.getMonth() + 1, back.getDate()]).toEqual([2026, 9, 30]);
  });

  it('places Nowruz on the vernal equinox', () => {
    for (const [year, iso] of [
      [1403, [2024, 3, 20]],
      [1404, [2025, 3, 21]],
      [1405, [2026, 3, 21]],
    ] as const) {
      const date = partsToDate({ year, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, 'jalali');
      expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([...iso]);
    }
  });

  it('keeps the time of day stable when switching calendars', () => {
    const instant = new Date(2026, 8, 30, 14, 45, 12);
    const jalali = dateToParts(instant, 'jalali');
    const restored = partsToDate(jalali, 'jalali');
    expect(restored.getTime()).toBe(instant.getTime());
  });
});

describe('leap-year engine', () => {
  it('matches the known Jalali leap years', () => {
    expect(isLeapYear('jalali', 1403)).toBe(true);
    expect(isLeapYear('jalali', 1404)).toBe(false);
    expect(isLeapYear('jalali', 1405)).toBe(false);
    expect(daysInMonth('jalali', 1403, 12)).toBe(30);
    expect(daysInMonth('jalali', 1405, 12)).toBe(29);
  });

  it('applies the 4/100/400 rule to Gregorian years', () => {
    expect(isLeapYear('gregorian', 2024)).toBe(true);
    expect(isLeapYear('gregorian', 2100)).toBe(false);
    expect(isLeapYear('gregorian', 2000)).toBe(true);
    expect(daysInMonth('gregorian', 2024, 2)).toBe(29);
  });

  it('lists the leap years inside a range', () => {
    const analysis = leapYearsInRange(new Date(2023, 8, 30), new Date(2026, 9, 18));
    expect(analysis.jalaliYears).toEqual([1403]);
    expect(analysis.gregorianYears).toEqual([2024]);
  });
});

describe('civil difference', () => {
  it('reproduces the briefed 3y / 0m / 18d / 04:14:30 example', () => {
    const start = new Date(2023, 8, 30, 14, 15, 30);
    const end = new Date(2026, 9, 18, 18, 30, 0);
    const diff = civilDifference(start, end);

    expect([diff.years, diff.months, diff.days]).toEqual([3, 0, 18]);
    expect([diff.hours, diff.minutes, diff.seconds]).toEqual([4, 14, 30]);
    expect(diff.reversed).toBe(false);
    expect(totalsBetween(start, end).days).toBe(1114);
  });

  it('flags a reversed range without producing negatives', () => {
    const diff = civilDifference(new Date(2026, 0, 10), new Date(2024, 0, 10));
    expect(diff.reversed).toBe(true);
    expect(diff.years).toBe(2);
    expect(diff.months).toBeGreaterThanOrEqual(0);
    expect(diff.days).toBeGreaterThanOrEqual(0);
  });

  it('borrows from the real length of the previous month', () => {
    // 31 March -> 1 April must read as 0 months / 1 day, not as a 30-day jump.
    const diff = civilDifference(new Date(2026, 2, 31), new Date(2026, 3, 1));
    expect([diff.years, diff.months, diff.days]).toEqual([0, 0, 1]);
  });
});

describe('Iranian business days', () => {
  it('excludes Thursday and Friday but not the weekend-adjacent days', () => {
    // 2026-09-19 (Sat) .. 2026-09-26 (Sat) = 5 working days + Thu 24 + Fri 25.
    const stats = businessDayStats(new Date(2026, 8, 19), new Date(2026, 8, 26));
    expect(stats.total).toBe(7);
    expect(stats.working).toBe(5);
    expect(stats.weekend).toBe(2);
    expect(stats.holiday).toBe(0);
  });

  it('treats Nowruz and 22 Bahman as official closures', () => {
    const nowruz = partsToDate({ year: 1405, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, 'jalali');
    expect(isFixedOfficialHoliday(nowruz)).toBe(true);
    expect(classifyDay(nowruz)).toBe('holiday');

    const bahman = partsToDate({ year: 1405, month: 11, day: 22, hour: 0, minute: 0, second: 0 }, 'jalali');
    expect(classifyDay(bahman)).toBe('holiday');
  });

  it('lets user-defined holidays override a working day', () => {
    const monday = partsToDate({ year: 1405, month: 7, day: 5, hour: 0, minute: 0, second: 0 }, 'jalali');
    const iso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    expect(classifyDay(monday)).toBe('working');
    expect(classifyDay(monday, [{ iso, title: 'Company day off' }])).toBe('holiday');
  });

  it('reports the day-of-week index with Saturday as zero', () => {
    expect(weekIndex(new Date(2026, 8, 19))).toBe(0);
    expect(weekIndex(new Date(2026, 8, 25))).toBe(6);
  });
});

describe('epoch parsing', () => {
  it('detects seconds and milliseconds by length', () => {
    expect(detectEpochUnit('1798666666')).toBe('seconds');
    expect(detectEpochUnit('1798666666000')).toBe('milliseconds');
  });

  it('normalises both units onto the same instant', () => {
    const seconds = parseEpoch('1798666666');
    const milliseconds = parseEpoch('1798666666000');
    expect(seconds?.seconds).toBe(1798666666);
    expect(milliseconds?.seconds).toBe(1798666666);
    expect(milliseconds?.unit).toBe('milliseconds');
  });

  it('rejects junk and out-of-range values', () => {
    expect(parseEpoch('abc')).toBeNull();
    expect(parseEpoch('')).toBeNull();
    expect(parseEpoch('99999999999999999999')).toBeNull();
  });
});

describe('digit helpers', () => {
  it('keeps years ungrouped while grouping real counts', () => {
    expect(formatNumber(1405, 'fa')).toBe('۱۴۰۵');
    expect(formatNumber(1405, 'en')).toBe('1405');
    expect(formatCount(1114, 'fa')).toBe('۱,۱۱۴');
    expect(formatCount(159.1, 'fa')).toBe('۱۵۹.۱');
    expect(formatCount(1114, 'en')).toBe('1,114');
    expect(formatCount(1604415, 'en')).toBe('1,604,415');
  });

  it('accepts Persian digits as input', () => {
    expect(normaliseDigits('۱۴۰۵')).toBe('1405');
    expect(toInt('۱۴۰۵')).toBe(1405);
    expect(toInt('', 7)).toBe(7);
  });
});

describe('relative time', () => {
  const now = new Date(2026, 8, 30, 12, 0, 0);

  it('buckets a few hours into hours', () => {
    expect(relativeToNow(new Date(2026, 8, 30, 9, 0, 0), now)).toEqual({ unit: 'hour', value: 3, future: false });
  });

  it('marks future instants', () => {
    const result = relativeToNow(new Date(2028, 8, 30, 12, 0, 0), now);
    expect(result.future).toBe(true);
    expect(result.unit).toBe('year');
    expect(result.value).toBe(2);
  });

  it('collapses sub-minute distances to now', () => {
    expect(relativeToNow(new Date(now.getTime() - 5000), now).unit).toBe('now');
  });
});
