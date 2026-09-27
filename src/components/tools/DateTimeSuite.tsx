'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { isLeapJalaaliYear, isValidJalaaliDate, toGregorian, toJalaali } from 'jalaali-js';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, Pause, Play, RefreshCw, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const gregorianMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const gregorianShortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fa = (value: number) => value.toLocaleString('fa-IR');
const daysInJalaliMonth = (year: number, month: number) => month <= 6 ? 31 : month <= 11 ? 30 : isLeapJalaaliYear(year) ? 30 : 29;
const TIME_ZONE = 'Asia/Tehran';
type Calendar = 'jalali' | 'gregorian';
type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const zonedDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

function getZonedParts(date: Date): DateParts {
    const values = Object.fromEntries(zonedDateFormatter.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
    return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second };
}

function toJalaaliSafe(year: number, month: number, day: number) {
    return year >= 560 && year <= 3798 ? toJalaali(year, month, day) : null;
}

function fromDate(date: Date, calendar: Calendar): DateParts {
    const parts = getZonedParts(date);
    if (calendar === 'gregorian') return parts;
    const jalali = toJalaaliSafe(parts.year, parts.month, parts.day);
    if (!jalali) return { ...parts, year: Number.NaN, month: Number.NaN, day: Number.NaN };
    return { ...parts, year: jalali.jy, month: jalali.jm, day: jalali.jd };
}

function utcTime(parts: DateParts): number {
    const value = new Date(0);
    value.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    value.setUTCHours(parts.hour, parts.minute, parts.second, 0);
    return value.getTime();
}

function isValidDateParts(parts: DateParts, calendar: Calendar): boolean {
    if (!Object.values(parts).every(Number.isInteger)
        || parts.hour < 0 || parts.hour > 23
        || parts.minute < 0 || parts.minute > 59
        || parts.second < 0 || parts.second > 59) return false;
    if (calendar === 'jalali') return isValidJalaaliDate(parts.year, parts.month, parts.day);
    return parts.year >= 1 && parts.year <= 9999
        && parts.month >= 1 && parts.month <= 12
        && parts.day >= 1
        && parts.day <= daysInMonth(parts.year, parts.month, 'gregorian');
}

function toDate(parts: DateParts, calendar: Calendar): Date {
    if (!isValidDateParts(parts, calendar)) return new Date(Number.NaN);
    const gregorian = calendar === 'jalali'
        ? toGregorian(parts.year, parts.month, parts.day)
        : { gy: parts.year, gm: parts.month, gd: parts.day };
    const target = utcTime({ ...parts, year: gregorian.gy, month: gregorian.gm, day: gregorian.gd });
    let timestamp = target;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const adjustment = target - utcTime(getZonedParts(new Date(timestamp)));
        timestamp += adjustment;
        if (adjustment === 0) break;
    }
    return utcTime(getZonedParts(new Date(timestamp))) === target ? new Date(timestamp) : new Date(Number.NaN);
}

function daysInMonth(year: number, month: number, calendar: Calendar): number {
    if (month < 1 || month > 12) return 31;
    if (calendar === 'jalali') {
        if (year < -61 || year > 3177) return 31;
        return daysInJalaliMonth(year, month);
    }
    const date = new Date(0);
    date.setUTCFullYear(year, month, 0);
    return date.getUTCDate();
}

function isCalendarMonthSupported(year: number, month: number, calendar: Calendar): boolean {
    return month >= 1 && month <= 12 && (calendar === 'jalali'
        ? year >= -61 && year <= 3177
        : year >= 1 && year <= 9999);
}

function parseTimestamp(value: string): Date | null {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    const numeric = Number(trimmed);
    const milliseconds = Math.abs(numeric) >= 100_000_000_000 ? numeric : numeric * 1000;
    if (!Number.isSafeInteger(milliseconds)) return null;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
}

function Field({ label, value, onChange, min = 0, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
    return <label className="text-[11px] text-slate-500">{label}<input type="number" step="1" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value) || 0)} className="mt-1 h-10 w-full rounded-lg bg-[#f8fafc] px-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-white" /></label>;
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setFailed(false);
        } catch {
            setCopied(false);
            setFailed(true);
        }
        window.setTimeout(() => { setCopied(false); setFailed(false); }, 1200);
    };
    return <button type="button" aria-label={failed ? 'کپی انجام نشد' : copied ? 'کپی شد' : 'کپی'} onClick={copy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-[#0d1117]">{failed ? <span className="text-xs text-red-600">خطا</span> : copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>;
}

export default function DateTimeSuite() {
    const [now, setNow] = useState(() => Date.now());
    const [live, setLive] = useState(true);
    const [calendar, setCalendar] = useState<Calendar>('jalali');
    const [date, setDate] = useState<DateParts>(() => fromDate(new Date(), 'jalali'));
    const [timestampInput, setTimestampInput] = useState(String(Math.floor(now / 1000)));
    const [converted, setConverted] = useState<Date | null>(null);
    const [conversionError, setConversionError] = useState('');
    const [month, setMonth] = useState(date.month);
    const [year, setYear] = useState(date.year);

    useEffect(() => {
        if (!live) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [live]);

    const validDateParts = isValidDateParts(date, calendar);
    const selectedDate = validDateParts ? toDate(date, calendar) : new Date(Number.NaN);
    const validDate = validDateParts && Number.isFinite(selectedDate.getTime());
    const timestamp = validDate ? Math.floor(selectedDate.getTime() / 1000) : Number.NaN;
    const result = converted;
    const resultJalaliParts = result ? fromDate(result, 'jalali') : null;
    const resultJalali = resultJalaliParts && Number.isFinite(resultJalaliParts.year) ? resultJalaliParts : null;
    const resultGregorian = result ? fromDate(result, 'gregorian') : null;
    const calendarCells = useMemo(() => {
        if (!isCalendarMonthSupported(year, month, calendar)) return [];
        const first = calendar === 'jalali' ? toGregorian(year, month, 1) : { gy: year, gm: month, gd: 1 };
        const firstDate = new Date(0);
        firstDate.setUTCFullYear(first.gy, first.gm - 1, first.gd);
        const offset = (firstDate.getUTCDay() + 1) % 7;
        const count = daysInMonth(year, month, calendar);
        const cells: Array<{ day: number; secondary: string; muted: boolean; friday: boolean; selectedYear: number; selectedMonth: number } | null> = [];
        for (let index = 0; index < offset; index += 1) {
            const value = new Date(firstDate);
            value.setUTCDate(value.getUTCDate() - offset + index);
            const previousJalali = toJalaaliSafe(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
            const previous = calendar === 'jalali'
                ? previousJalali || { jy: value.getUTCFullYear(), jm: value.getUTCMonth() + 1, jd: value.getUTCDate() }
                : { jy: value.getUTCFullYear(), jm: value.getUTCMonth() + 1, jd: value.getUTCDate() };
            cells.push({
                day: previous.jd,
                secondary: calendar === 'jalali' ? `${gregorianShortMonths[value.getUTCMonth()]} ${value.getUTCDate()}` : previousJalali ? `${fa(previousJalali.jm)}/${fa(previousJalali.jd)}` : '—',
                muted: true,
                friday: value.getUTCDay() === 5,
                selectedYear: previous.jy,
                selectedMonth: previous.jm,
            });
        }
        for (let index = 0; index < count; index += 1) {
            const value = new Date(firstDate);
            value.setUTCDate(value.getUTCDate() + index);
            const currentJalali = toJalaaliSafe(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
            const current = calendar === 'jalali'
                ? currentJalali || { jy: value.getUTCFullYear(), jm: value.getUTCMonth() + 1, jd: value.getUTCDate() }
                : { jy: value.getUTCFullYear(), jm: value.getUTCMonth() + 1, jd: value.getUTCDate() };
            cells.push({
                day: current.jd,
                secondary: calendar === 'jalali' ? `${gregorianShortMonths[value.getUTCMonth()]} ${value.getUTCDate()}` : currentJalali ? `${fa(currentJalali.jm)}/${fa(currentJalali.jd)}` : '—',
                muted: false,
                friday: value.getUTCDay() === 5,
                selectedYear: current.jy,
                selectedMonth: current.jm,
            });
        }
        return cells;
    }, [calendar, month, year]);

    const setToday = () => {
        const value = new Date();
        const parts = fromDate(value, calendar);
        setYear(parts.year);
        setMonth(parts.month);
        setDate(parts);
        setTimestampInput(String(Math.floor(value.getTime() / 1000)));
        setConverted(value);
        setConversionError('');
    };
    const setCalendarMode = (next: Calendar) => {
        if (next === calendar) return;
        const convertedDate = validDate ? fromDate(toDate(date, calendar), next) : date;
        setCalendar(next);
        setDate(convertedDate);
        if (isValidDateParts(convertedDate, next)) {
            setYear(convertedDate.year);
            setMonth(convertedDate.month);
        }
    };
    const updateDatePart = (part: keyof DateParts, value: number) => {
        setDate((currentDate) => ({ ...currentDate, [part]: value }));
        if (part === 'year') setYear(value);
        if (part === 'month') setMonth(value);
    };
    const changeMonth = (delta: number) => {
        let nextMonth = month + delta; let nextYear = year;
        if (nextMonth < 1) { nextMonth = 12; nextYear--; }
        if (nextMonth > 12) { nextMonth = 1; nextYear++; }
        if (!isCalendarMonthSupported(nextYear, nextMonth, calendar)) return;
        setMonth(nextMonth); setYear(nextYear);
    };
    const selectDay = (day: number) => {
        setDate((value) => ({ ...value, year, month, day }));
    };
    const selectedCalendarDate = { year: date.year, month: date.month, day: date.day };
    const convertTimestamp = () => {
        const convertedDate = parseTimestamp(timestampInput);
        if (!convertedDate) {
            setConverted(null);
            setConversionError('تایم‌استمپ معتبر وارد کنید؛ ورودی‌های ثانیه و میلی‌ثانیه پشتیبانی می‌شوند.');
            return;
        }
        setConverted(convertedDate);
        setConversionError('');
    };

    return <div dir="rtl" className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-[#0b1c30] dark:bg-[#0b0f19] dark:text-white md:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><div className="flex items-center gap-2"><a href="/">خانه</a><ChevronDown className="h-4 w-4 -rotate-90" /><span>ابزارها</span><ChevronDown className="h-4 w-4 -rotate-90" /><span>تاریخ و زمان</span><ChevronDown className="h-4 w-4 -rotate-90" /><b className="text-slate-800 dark:text-white">مبدل Timestamp یونیکس</b></div><div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-[#161b26]"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Epoch زنده: <code className="font-mono font-bold">{Math.floor(now / 1000)}</code><button type="button" onClick={() => navigator.clipboard.writeText(String(Math.floor(now / 1000)))}><Copy className="h-4 w-4" /></button><button type="button" onClick={() => setLive(!live)}>{live ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button></div></div>
            <Card className="flex flex-col justify-between gap-5 border-0 bg-white p-7 shadow-sm dark:bg-[#161b26] md:flex-row md:items-center"><div className="max-w-2xl"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white"><Clock3 /></div><h1 className="text-2xl font-bold">مبدل Timestamp یونیکس</h1><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Epoch &amp; Jalali 2-Way</span></div><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">تبدیل سریع و دوطرفه بین زمان یونیکس (ثانیه‌ها و میلی‌ثانیه‌ها)، تقویم شمسی (جلالی)، میلادی و استانداردهای ISO 8601 و RFC 2822. پردازش ۱۰۰٪ لوکال، بلادرنگ و بدون وقفه در مرورگر شما.</p></div><div className="flex gap-5 rounded-lg bg-slate-50 p-4 text-xs dark:bg-[#0d1117]"><div><span className="block text-slate-500">منطقه زمانی</span><b>Asia/Tehran</b></div><div className="border-r border-slate-200 pr-5 dark:border-slate-700"><span className="block text-slate-500">دقت زمان</span><b className="text-emerald-600">ثانیه (s)</b></div></div></Card>
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <Card className="overflow-hidden border-0 bg-white p-0 shadow-sm dark:bg-[#161b26]">
                    <PanelTitle icon={<CalendarDays />} title="تبدیل تاریخ به زمان یونیکس">
                        <div className="flex rounded-lg bg-white p-1 shadow-sm dark:bg-[#161b26]">
                            <button type="button" onClick={() => setCalendarMode('jalali')} className={`rounded px-3 py-1 text-xs ${calendar === 'jalali' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>شمسی</button>
                            <button type="button" onClick={() => setCalendarMode('gregorian')} className={`rounded px-3 py-1 text-xs ${calendar === 'gregorian' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>میلادی</button>
                        </div>
                    </PanelTitle>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            <Field label="سال" value={date.year} min={calendar === 'jalali' ? -61 : 1} max={calendar === 'jalali' ? 3177 : 9999} onChange={(value) => updateDatePart('year', value)} />
                            <Field label="ماه" value={date.month} min={1} max={12} onChange={(value) => updateDatePart('month', value)} />
                            <Field label="روز" value={date.day} min={1} max={daysInMonth(date.year, date.month, calendar)} onChange={(value) => updateDatePart('day', value)} />
                            <Field label="ساعت" value={date.hour} max={23} onChange={(value) => updateDatePart('hour', value)} />
                            <Field label="دقیقه" value={date.minute} max={59} onChange={(value) => updateDatePart('minute', value)} />
                            <Field label="ثانیه" value={date.second} max={59} onChange={(value) => updateDatePart('second', value)} />
                        </div>
                        {!validDate && <p className="text-xs text-red-600">تاریخ یا ساعت واردشده معتبر نیست.</p>}
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={setToday}><RefreshCw className="h-4 w-4" />زمان فعلی</Button>
                            <Button type="button" disabled={!validDate} onClick={() => { setTimestampInput(String(timestamp)); setConverted(toDate(date, calendar)); setConversionError(''); }} className="bg-blue-600 disabled:opacity-50"><Zap className="h-4 w-4" />تولید Timestamp</Button>
                        </div>
                        <Output label="ثانیه (Unix Epoch)" value={validDate ? String(timestamp) : '—'} suffix="s" />
                        <Output label="میلی‌ثانیه" value={validDate ? String(timestamp * 1000) : '—'} suffix="ms" />
                    </div>
                </Card>
                <Card className="overflow-hidden border-0 bg-white p-0 shadow-sm dark:bg-[#161b26]">
                    <PanelTitle icon={<RotateCcw />} title="تبدیل Timestamp به تاریخ">
                        <div className="flex gap-1 text-xs">
                            <button type="button" onClick={() => { const currentDate = new Date(); setTimestampInput(String(Math.floor(currentDate.getTime() / 1000))); setConverted(currentDate); setConversionError(''); }} className="rounded bg-white px-2 py-1 shadow-sm dark:bg-[#161b26]">هم‌اکنون</button>
                            <button type="button" onClick={setToday} className="rounded bg-white px-2 py-1 shadow-sm dark:bg-[#161b26]">امروز</button>
                        </div>
                    </PanelTitle>
                    <div className="space-y-5 p-6">
                        <div className="flex gap-2">
                            <input value={timestampInput} onChange={(event) => { setTimestampInput(event.target.value); setConverted(null); setConversionError(''); }} dir="ltr" aria-invalid={Boolean(conversionError)} className="h-10 min-w-0 flex-1 rounded-lg bg-slate-50 px-3 font-mono outline-none focus:ring-2 focus:ring-blue-500 aria-[invalid=true]:ring-red-500 dark:bg-[#0d1117]" placeholder="Timestamp برحسب ثانیه یا میلی‌ثانیه..." />
                            <Button type="button" onClick={convertTimestamp} className="bg-slate-900">تبدیل</Button>
                        </div>
                        {conversionError && <p role="alert" className="text-xs text-red-600">{conversionError}</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Result title="تقویم شمسی (جلالی)" value={resultJalali ? `${fa(resultJalali.day)} ${months[resultJalali.month - 1]} ${fa(resultJalali.year)}` : '—'} />
                            <Result title="تقویم میلادی" value={resultGregorian ? `${resultGregorian.year}-${String(resultGregorian.month).padStart(2, '0')}-${String(resultGregorian.day).padStart(2, '0')} ${String(resultGregorian.hour).padStart(2, '0')}:${String(resultGregorian.minute).padStart(2, '0')}:${String(resultGregorian.second).padStart(2, '0')}` : '—'} ltr />
                            <Result title="فرمت ISO 8601" value={result?.toISOString() || '—'} ltr />
                            <Result title="فاصله تا هم‌اکنون" value={result ? `${Math.round((result.getTime() - Date.now()) / 86400000)} روز` : '—'} />
                        </div>
                    </div>
                </Card>
            </div>
            <Card className="flex flex-col gap-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40"><CalendarDays className="h-5 w-5" /></div>
                        <div><h2 className="text-lg font-bold">نمای تقویم و انتخابگر روز</h2><p className="text-xs text-slate-500">با کلیک روی هر روز، مقدار دقیق Timestamp آن تولید می‌شود.</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-[#0d1117]">
                            <button type="button" disabled={!isCalendarMonthSupported(year, month === 1 ? 12 : month - 1, calendar) || (month === 1 && !isCalendarMonthSupported(year - 1, 12, calendar))} onClick={() => changeMonth(-1)} className="rounded p-1.5 text-slate-600 hover:bg-white disabled:opacity-40 dark:hover:bg-[#161b26]"><ChevronRight className="h-4 w-4" /></button>
                            <b className="min-w-[130px] px-3 text-center text-sm">{!isCalendarMonthSupported(year, month, calendar) ? 'محدودهٔ پشتیبانی‌نشده' : calendar === 'jalali' ? `${months[month - 1]} ${fa(year)}` : `${gregorianMonths[month - 1]} ${year}`}</b>
                            <button type="button" disabled={!isCalendarMonthSupported(year, month === 12 ? 1 : month + 1, calendar) || (month === 12 && !isCalendarMonthSupported(year + 1, 1, calendar))} onClick={() => changeMonth(1)} className="rounded p-1.5 text-slate-600 hover:bg-white disabled:opacity-40 dark:hover:bg-[#161b26]"><ChevronLeft className="h-4 w-4" /></button>
                        </div>
                        <button type="button" onClick={setToday} className="h-9 rounded bg-slate-100 px-3 text-xs text-slate-600 hover:bg-slate-200 dark:bg-[#0d1117]">امروز</button>
                    </div>
                </div>
                <div className="w-full overflow-x-auto">
                    <div className="grid min-w-[620px] grid-cols-7 gap-1 text-center text-xs">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, index) => <span key={day} className={`py-2 font-semibold ${index === 6 ? 'text-red-600' : 'text-slate-500'}`}>{day}</span>)}
                        {calendarCells.map((cell, index) => cell ? <button disabled={cell.muted} type="button" key={index} onClick={() => selectDay(cell.day)} className={`flex h-14 flex-col items-center justify-between rounded p-1 transition-colors ${cell.muted ? 'bg-slate-100/40 text-slate-400 opacity-60 dark:bg-[#0d1117]/40' : 'hover:bg-slate-100 dark:hover:bg-blue-950/40'} ${cell.friday && !cell.muted ? 'hover:bg-red-50 dark:hover:bg-red-950/20' : ''} ${selectedCalendarDate.day === cell.day && selectedCalendarDate.month === cell.selectedMonth && selectedCalendarDate.year === cell.selectedYear ? 'bg-blue-600 text-white opacity-100 hover:bg-blue-700' : ''}`}><span className={`text-sm font-bold ${cell.friday && !(selectedCalendarDate.day === cell.day && selectedCalendarDate.month === cell.selectedMonth && selectedCalendarDate.year === cell.selectedYear) ? 'text-red-600' : ''}`}>{fa(cell.day)}</span><span className={`text-[10px] ${selectedCalendarDate.day === cell.day && selectedCalendarDate.month === cell.selectedMonth && selectedCalendarDate.year === cell.selectedYear ? 'text-blue-100' : 'text-slate-500'}`}>{cell.secondary}</span></button> : <span key={index} className="h-14" />)}
                    </div>
                </div>
            </Card>
            <div className="grid gap-6 md:grid-cols-2"><Card className="space-y-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><CalendarDays className="h-5 w-5" /></div><h2 className="text-xl font-bold">راهنمای تبدیل زمان یونیکس (Epoch)</h2></div><p className="text-sm leading-7 text-slate-600 dark:text-slate-400">timestampهای یونیکس را به‌سادگی به تاریخ‌های خوانای میلادی یا شمسی تبدیل کنید و تاریخ‌های تقویمی را دوباره به timestamp برگردانید.</p><Info title="timestamp یونیکس چیست؟" text="تعداد ثانیه‌های سپری‌شده از اول ژانویه ۱۹۷۰ به وقت UTC است و در سیستم‌های نرم‌افزاری و APIها کاربرد فراوان دارد." icon={<Clock3 />} /><Info title="تبدیل بین تقویم‌ها" text="با این ابزار timestamp را در قالب میلادی یا جلالی مشاهده و مقدار را به فرمت‌های استاندارد ISO 8601 و RFC 2822 استخراج کنید." icon={<RefreshCw />} /><Info title="مناسب برای بررسی API و لاگ‌ها" text="تبدیل timestamp به تاریخ خوانا، تحلیل لاگ‌های سرور، رکوردهای پایگاه داده و پاسخ‌های API را سریع‌تر می‌کند." icon={<Zap />} /></Card><Card className="space-y-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><ShieldCheck className="h-5 w-5" /></div><h2 className="text-xl font-bold">سؤالات متداول</h2></div>{[['آیا تاریخ فارسی یا شمسی دقیقاً پشتیبانی می‌شود؟', 'بله، الگوریتم تبدیل تقویم خورشیدی جلالی با احتساب سال‌های کبیسه، تبدیل دوطرفه را با دقت بالا ارائه می‌دهد.'], ['تفاوت Timestamp ثانیه و میلی‌ثانیه چیست؟', 'سیستم‌های لینوکس و پایگاه‌های داده معمولاً مقدار ۱۰ رقمی برحسب ثانیه دارند؛ JavaScript و Java مقدار ۱۳ رقمی برحسب میلی‌ثانیه تولید می‌کنند و این ابزار هر دو را تشخیص می‌دهد.'], ['آیا داده‌های زمانی به سرور ارسال می‌شوند؟', 'خیر؛ تمامی محاسبات تبدیل تاریخ و فرمت‌ها به‌صورت ۱۰۰٪ محلی در مرورگر انجام می‌شوند و درخواست شبکه‌ای ارسال نمی‌گردد.'], ['چگونه منطقه زمانی روی نتیجه اثر می‌گذارد؟', 'Timestamp یونیکس مستقل از منطقه زمانی و بر پایه UTC است؛ منطقه زمانی فقط نحوه نمایش ساعت محلی را تغییر می‌دهد.']].map(([question, answer], index) => <details key={question} open={index === 0} className="rounded-lg bg-slate-50 p-4 dark:bg-[#0d1117]"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold hover:text-blue-600">{question}<ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" /></summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p></details>)}</Card></div>
        </div>
    </div>;
}

function PanelTitle({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <div className="flex items-center justify-between bg-slate-100 px-5 py-4 dark:bg-[#0d1117]"><h2 className="flex items-center gap-2 font-semibold"><span className="text-blue-600">{icon}</span>{title}</h2>{children}</div>; }
function Output({ label, value, suffix }: { label: string; value: string; suffix: string }) { return <div><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span className="text-blue-600">کپی</span></div><div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-[#0d1117]"><code dir="ltr" className="font-mono font-bold text-blue-600">{value}</code><span className="text-xs text-slate-500">{suffix}</span><CopyButton value={value} /></div></div>; }
function Result({ title, value, ltr = false }: { title: string; value: string; ltr?: boolean }) { return <div className="rounded-lg bg-slate-50 p-3 dark:bg-[#0d1117]"><span className="block text-xs text-slate-500">{title}</span><strong dir={ltr ? 'ltr' : 'rtl'} className="mt-1 block truncate text-sm">{value}</strong></div>; }
function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-xl bg-slate-50 p-5 dark:bg-[#0d1117]"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p></div>; }
