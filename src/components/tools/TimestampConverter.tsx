'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { isValidJalaaliDate, toGregorian, toJalaali } from 'jalaali-js';
import { CalendarDays, Check, ChevronDown, Clock3, Copy, Globe2, Minus, Plus, Timer, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type CalendarMode = 'jalali' | 'gregorian';
type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number; millisecond: number };
type Shift = { [key: string]: number; years: number; months: number; weeks: number; days: number; hours: number; minutes: number; seconds: number };

const jalaliMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const gregorianMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const faNumber = (value: number) => value.toLocaleString('fa-IR');
const TIME_ZONE = 'Asia/Tehran';
const zonedDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
});

function getZonedParts(date: Date): Parts {
    const values = Object.fromEntries(zonedDateFormatter.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
    return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second, millisecond: values.fractionalSecond };
}

function utcTime(parts: Parts): number {
    const date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
    return date.getTime();
}

function fromGregorianParts(parts: Parts, mode: CalendarMode): Parts {
    if (mode === 'jalali') {
        if (parts.year < 560 || parts.year > 3798) return { ...parts, year: Number.NaN, month: Number.NaN, day: Number.NaN };
        const j = toJalaali(parts.year, parts.month, parts.day);
        return { ...parts, year: j.jy, month: j.jm, day: j.jd };
    }
    return parts;
}

function fromDate(date: Date, mode: CalendarMode): Parts {
    return fromGregorianParts(getZonedParts(date), mode);
}

function daysInGregorianMonth(year: number, month: number): number {
    const date = new Date(0);
    date.setUTCFullYear(year, month, 0);
    return date.getUTCDate();
}

function isValidParts(parts: Parts, mode: CalendarMode): boolean {
    if (!Object.values(parts).every(Number.isInteger)
        || parts.hour < 0 || parts.hour > 23
        || parts.minute < 0 || parts.minute > 59
        || parts.second < 0 || parts.second > 59
        || parts.millisecond < 0 || parts.millisecond > 999) return false;

    if (mode === 'jalali') return isValidJalaaliDate(parts.year, parts.month, parts.day);
    return parts.year >= 1 && parts.year <= 9999
        && parts.month >= 1 && parts.month <= 12
        && parts.day >= 1 && parts.day <= daysInGregorianMonth(parts.year, parts.month);
}

function toDate(parts: Parts, mode: CalendarMode): Date {
    if (!isValidParts(parts, mode)) return new Date(Number.NaN);
    const g = mode === 'jalali'
        ? toGregorian(parts.year, parts.month, parts.day)
        : { gy: parts.year, gm: parts.month, gd: parts.day };
    const desired = { ...parts, year: g.gy, month: g.gm, day: g.gd };
    const target = utcTime(desired);
    let timestamp = target;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const represented = utcTime(getZonedParts(new Date(timestamp)));
        const adjustment = target - represented;
        timestamp += adjustment;
        if (adjustment === 0) break;
    }
    return new Date(timestamp);
}

function daysInMonth(year: number, month: number, mode: CalendarMode): number {
    if (mode === 'jalali') return month <= 6 ? 31 : month <= 11 ? 30 : isValidJalaaliDate(year, month, 30) ? 30 : 29;
    return daysInGregorianMonth(year, month);
}

function addCalendarMonths(parts: Parts, amount: number, mode: CalendarMode): Parts {
    const monthIndex = parts.year * 12 + parts.month - 1 + amount;
    const year = Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12 + 1;
    return { ...parts, year, month, day: Math.min(parts.day, daysInMonth(year, month, mode)) };
}

function addCalendarDays(parts: Parts, amount: number, mode: CalendarMode): Parts {
    if (!isValidParts(parts, mode)) return { ...parts, year: Number.NaN, month: Number.NaN, day: Number.NaN };
    const g = mode === 'jalali'
        ? toGregorian(parts.year, parts.month, parts.day)
        : { gy: parts.year, gm: parts.month, gd: parts.day };
    const date = new Date(0);
    date.setUTCFullYear(g.gy, g.gm - 1, g.gd + amount);
    date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
    return fromGregorianParts({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        millisecond: date.getUTCMilliseconds(),
    }, mode);
}

function calendarDayNumber(parts: Parts, mode: CalendarMode): number {
    const g = mode === 'jalali'
        ? toGregorian(parts.year, parts.month, parts.day)
        : { gy: parts.year, gm: parts.month, gd: parts.day };
    const date = new Date(0);
    date.setUTCFullYear(g.gy, g.gm - 1, g.gd);
    return Math.floor(date.getTime() / 86400000);
}

function formatUnixTimestamp(parts: Parts, mode: CalendarMode): string {
    if (!isValidParts(parts, mode)) return '';
    const timestamp = toDate(parts, mode).getTime();
    return String(parts.millisecond === 0 ? Math.floor(timestamp / 1000) : timestamp);
}

function InputParts({ value, onChange, mode }: { value: Parts; onChange: (value: Parts) => void; mode: CalendarMode }) {
    const labels = mode === 'jalali' ? ['سال', 'ماه', 'روز'] : ['Year', 'Month', 'Day'];
    const update = (key: keyof Parts, raw: string) => onChange({ ...value, [key]: Number(raw) || 0 });
    return <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {(['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'] as (keyof Parts)[]).map((key, index) => (
            <label key={key} className="text-[11px] text-slate-500">
                {index < 3 ? labels[index] : ['ساعت', 'دقیقه', 'ثانیه', 'میلی‌ثانیه'][index - 3]}
                <input type="number" step="1" value={value[key]} min={key === 'month' || key === 'day' ? 1 : 0} max={key === 'month' ? 12 : key === 'day' ? daysInMonth(value.year, value.month, mode) : key === 'hour' ? 23 : key === 'minute' || key === 'second' ? 59 : key === 'millisecond' ? 999 : undefined} aria-invalid={!isValidParts(value, mode)} onChange={(event) => update(key, event.target.value)} className="mt-1 h-10 w-full rounded-lg bg-white px-2 text-center font-mono text-sm text-slate-800 shadow-sm outline-none ring-blue-500 focus:ring-2 aria-[invalid=true]:ring-red-500 dark:bg-[#161b26] dark:text-white" />
            </label>
        ))}
        {!isValidParts(value, mode) && <p className="col-span-full text-xs text-red-600">تاریخ یا ساعت واردشده معتبر نیست.</p>}
    </div>;
}

function CopyButton({ value, disabled = false }: { value: string; disabled?: boolean }) {
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
    return <button type="button" disabled={disabled} aria-label={failed ? 'کپی انجام نشد' : copied ? 'کپی شد' : 'کپی'} onClick={copy} className="rounded-lg bg-white p-2 text-slate-500 shadow-sm hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#161b26]">{failed ? <span className="text-xs text-red-600">خطا</span> : copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>;
}

function Metric({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return <div className="flex flex-col justify-between gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-[#161b26]"><span className="text-xs text-slate-500">{title}</span><div className="flex items-center justify-between"><strong className="text-xl font-bold text-slate-900 dark:text-white">{value}</strong><CopyButton value={value} /></div><span className="text-[11px] text-slate-500">{subtitle}</span></div>;
}

export default function TimestampConverter() {
    const now = useMemo(() => new Date(), []);
    const [tab, setTab] = useState<'diff' | 'math'>('diff');
    const [mode, setMode] = useState<CalendarMode>('jalali');
    const [start, setStart] = useState<Parts>(() => fromDate(new Date(now.getTime() - 621 * 86400000), 'jalali'));
    const [end, setEnd] = useState<Parts>(() => fromDate(now, 'jalali'));
    const [inclusive, setInclusive] = useState(true);
    const [base, setBase] = useState<Parts>(() => fromDate(now, 'jalali'));
    const [operation, setOperation] = useState<'add' | 'sub'>('add');
    const [shift, setShift] = useState<Shift>({ years: 0, months: 3, weeks: 2, days: 10, hours: 4, minutes: 30, seconds: 0 });

    const difference = useMemo(() => {
        if (!isValidParts(start, mode) || !isValidParts(end, mode)) return null;
        const startDate = toDate(start, mode);
        const endDate = toDate(end, mode);
        if (endDate < startDate) return null;
        const inclusiveEnd = inclusive ? addCalendarDays(end, 1, mode) : end;
        if (!isValidParts(inclusiveEnd, mode)) return null;
        const milliseconds = toDate(inclusiveEnd, mode).getTime() - startDate.getTime();
        const totalSeconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const remainder = totalSeconds % 86400;
        const hours = Math.floor(remainder / 3600);
        const minutes = Math.floor((remainder % 3600) / 60);
        const seconds = remainder % 60;
        let totalMonths = (inclusiveEnd.year - start.year) * 12 + inclusiveEnd.month - start.month;
        let monthCursor = addCalendarMonths(start, totalMonths, mode);
        while (totalMonths > 0 && toDate(monthCursor, mode) > toDate(inclusiveEnd, mode)) {
            totalMonths -= 1;
            monthCursor = addCalendarMonths(start, totalMonths, mode);
        }
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        const remainingDays = calendarDayNumber(inclusiveEnd, mode) - calendarDayNumber(monthCursor, mode);
        return { days, hours, minutes, seconds, years, months, remainingDays, totalHours: Math.floor(totalSeconds / 3600), totalMinutes: Math.floor(totalSeconds / 60), totalSeconds, milliseconds };
    }, [end, inclusive, mode, start]);

    const shifted = useMemo(() => {
        if (!isValidParts(base, mode)) return { date: new Date(Number.NaN), parts: base, timestamp: Number.NaN };
        const date = toDate(base, mode);
        const sign = operation === 'add' ? 1 : -1;
        const shiftedMonths = addCalendarMonths(base, sign * (shift.years * 12 + shift.months), mode);
        if (!isValidParts(shiftedMonths, mode)) return { date: new Date(Number.NaN), parts: shiftedMonths, timestamp: Number.NaN };
        const shiftedDays = addCalendarDays(shiftedMonths, sign * (shift.weeks * 7 + shift.days), mode);
        if (!isValidParts(shiftedDays, mode)) return { date: new Date(Number.NaN), parts: shiftedDays, timestamp: Number.NaN };
        const shiftedDate = toDate(shiftedDays, mode);
        const amount = (shift.hours * 3600 + shift.minutes * 60 + shift.seconds) * 1000;
        shiftedDate.setTime(shiftedDate.getTime() + sign * amount);
        return { date: shiftedDate, parts: fromDate(shiftedDate, mode), timestamp: Math.floor(shiftedDate.getTime() / 1000) };
    }, [base, mode, operation, shift]);

    const updateMode = (next: CalendarMode) => {
        if (next === mode) return;
        const convert = (parts: Parts) => isValidParts(parts, mode) ? fromDate(toDate(parts, mode), next) : parts;
        setStart(convert(start));
        setEnd(convert(end));
        setBase(convert(base));
        setMode(next);
    };
    const quick = (target: 'start' | 'end', kind: 'now' | 'today' | 'year') => {
        const current = fromDate(new Date(), mode);
        const value = kind === 'now' ? current : kind === 'today'
            ? { ...current, hour: 0, minute: 0, second: 0, millisecond: 0 }
            : { ...current, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 };
        target === 'start' ? setStart(value) : setEnd(value);
    };
    const dateLabel = (parts: Parts) => mode === 'jalali' ? `${faNumber(parts.year)}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}` : `${parts.year}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`;
    const shiftedLabel = Number.isNaN(shifted.date.getTime()) ? 'تاریخ پایه معتبر نیست' : shifted.date.toLocaleString('fa-IR', { dateStyle: 'full', timeStyle: 'medium', timeZone: TIME_ZONE, calendar: mode === 'jalali' ? 'persian' : 'gregory' });

    return <div dir="rtl" className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-[#0b1c30] dark:bg-[#0b0f19] dark:text-white md:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><div className="flex items-center gap-2"><a href="/">خانه</a><ChevronDown className="h-4 w-4 -rotate-90" /><span>ابزارها</span><ChevronDown className="h-4 w-4 -rotate-90" /><span className="font-semibold text-slate-800 dark:text-white">تاریخ و زمان</span></div><div className="flex gap-2"><Badge text="پردازش ۱۰۰٪ محلی در مرورگر" /><Badge text="دقت میلی‌ثانیه" blue /></div></div>
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-blue-600"><CalendarDays /></div><div><h1 className="text-2xl font-bold">جعبه ابزار و محاسبه اختلاف تاریخ و زمان</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">محاسبه دقیق فاصله زمانی، روزهای کاری، ساعت، دقیقه و تبدیل همزمان شمسی و میلادی</p></div></div></div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 p-1 dark:bg-[#0d1117]"><div className="flex gap-1"><button type="button" onClick={() => setTab('diff')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'diff' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#161b26]' : 'text-slate-500'}`}><Timer className="h-4 w-4" />محاسبه اختلاف دو تاریخ</button><button type="button" onClick={() => setTab('math')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'math' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#161b26]' : 'text-slate-500'}`}><Plus className="h-4 w-4" />افزودن یا کاستن زمان</button></div><code className="hidden px-3 text-xs text-slate-500 sm:block">منطقهٔ زمانی: Asia/Tehran</code></div>

            {tab === 'diff' ? <div className="grid items-start gap-6 lg:grid-cols-12"><Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:col-span-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><Clock3 className="h-5 w-5 text-blue-600" />پارامترهای ورودی</h2><div className="flex rounded-lg bg-slate-100 p-1 text-xs dark:bg-[#0d1117]"><button type="button" onClick={() => updateMode('jalali')} className={`rounded px-3 py-1 ${mode === 'jalali' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#161b26]' : 'text-slate-500'}`}>شمسی</button><button type="button" onClick={() => updateMode('gregorian')} className={`rounded px-3 py-1 ${mode === 'gregorian' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#161b26]' : 'text-slate-500'}`}>میلادی</button></div></div><DateBlock title="تاریخ و ساعت شروع (مبدأ)" value={start} onChange={setStart} mode={mode} onTimestampApply={setStart} actions={<><button type="button" onClick={() => quick('start', 'now')}>اکنون</button><button type="button" onClick={() => quick('start', 'today')}>شروع امروز</button><button type="button" onClick={() => quick('start', 'year')}>شروع سال</button></>} /><DateBlock title="تاریخ و ساعت پایان" value={end} onChange={setEnd} mode={mode} onTimestampApply={setEnd} actions={<><button type="button" onClick={() => quick('end', 'now')}>اکنون</button><button type="button" onClick={() => setEnd(start)}>تطبیق با شروع</button></>} /><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={inclusive} onChange={(event) => setInclusive(event.target.checked)} className="accent-blue-600" />شامل روز پایانی در محاسبه</label><Button type="button" onClick={() => { setStart(end); setEnd(start); }} className="bg-blue-600"><Zap className="h-4 w-4" />جابه‌جایی تاریخ‌ها</Button></div>{!isValidParts(start, mode) || !isValidParts(end, mode) ? <p className="text-sm text-red-600">لطفاً تاریخ و ساعت معتبر وارد کنید.</p> : toDate(end, mode) < toDate(start, mode) ? <p className="text-sm text-red-600">زمان پایان نباید پیش از زمان شروع باشد.</p> : null}</Card>{difference ? <ResultCard difference={difference} start={dateLabel(start)} end={dateLabel(end)} /> : <Card className="flex min-h-40 items-center justify-center border-0 bg-white p-6 text-sm text-slate-500 shadow-sm dark:bg-[#161b26] lg:col-span-6">برای مشاهدهٔ نتیجه، ورودی‌ها را اصلاح کنید.</Card>}</div> : <MathView mode={mode} base={base} setBase={setBase} operation={operation} setOperation={setOperation} shift={shift} setShift={setShift} shifted={shifted} shiftedLabel={shiftedLabel} />}

            <Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><div><span className="text-xs font-bold uppercase tracking-wider text-blue-600">راهنمای کاربردی</span><h2 className="mt-1 text-xl font-bold">همه چیز درباره محاسبه تاریخ و زمان</h2><p className="mt-1 text-sm text-slate-500">تبدیل دقیق تقویم جلالی و میلادی، محاسبه بازه‌ها و مدیریت زمان به‌صورت محلی در مرورگر.</p></div><div className="grid gap-4 md:grid-cols-3"><Info title="تقویم شمسی و میلادی" text="تاریخ‌ها را در هر دو تقویم وارد کنید و نتیجه را بدون نیاز به تبدیل دستی ببینید." icon={<Globe2 />} /><Info title="جزئیات بازه زمانی" text="مقدار فاصله به روز، ساعت، دقیقه، ثانیه و میلی‌ثانیه محاسبه می‌شود." icon={<Clock3 />} /><Info title="پردازش خصوصی" text="همه محاسبات در مرورگر انجام می‌شود و داده‌های تاریخ شما ارسال نمی‌گردد." icon={<Check />} /></div></Card>
            <section className="mx-auto max-w-4xl space-y-4 pb-8"><h2 className="text-center text-2xl font-bold">راهنمای کاربردی و سؤالات متداول</h2>{[['چگونه سال‌های کبیسه در تقویم جلالی محاسبه می‌شوند؟', 'تبدیل تاریخ با الگوریتم استاندارد jalaali-js انجام می‌شود و طول ماه‌ها و سال‌های کبیسه در نتیجه لحاظ می‌گردد.'], ['گزینه شامل روز پایانی چه تأثیری دارد؟', 'با فعال بودن این گزینه، روز پایانی نیز به تعداد کل روزها اضافه می‌شود؛ این حالت برای قراردادها و محاسبات بازه‌های تقویمی کاربردی است.'], ['آیا داده‌های واردشده به سرور ارسال می‌شوند؟', 'خیر. محاسبات مستقیماً در مرورگر انجام می‌شوند و هیچ درخواست شبکه‌ای برای تاریخ‌های شما ارسال نمی‌شود.']].map(([question, answer], index) => <details key={question} open={index === 0} className="group rounded-xl bg-white p-5 shadow-sm dark:bg-[#161b26]"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{question}<ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" /></summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p></details>)}</section>
        </div>
    </div>;
}

function DateBlock({ title, value, onChange, mode, actions, onTimestampApply }: { title: string; value: Parts; onChange: (value: Parts) => void; mode: CalendarMode; actions: React.ReactNode; onTimestampApply?: (value: Parts) => void }) {
    const currentTimestamp = formatUnixTimestamp(value, mode);
    const [timestampInput, setTimestampInput] = useState(currentTimestamp);
    const [timestampError, setTimestampError] = useState('');

    useEffect(() => {
        setTimestampInput(currentTimestamp);
        setTimestampError('');
    }, [currentTimestamp]);

    const applyTimestamp = () => {
        const raw = timestampInput.trim();
        if (!/^-?\d+$/.test(raw)) {
            setTimestampError('یک تایم‌استمپ صحیح وارد کنید.');
            return;
        }
        const numeric = Number(raw);
        const timestamp = Math.abs(numeric) >= 100_000_000_000 ? numeric : numeric * 1000;
        const date = new Date(timestamp);
        if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) {
            setTimestampError('مقدار تایم‌استمپ خارج از محدودهٔ قابل پشتیبانی است.');
            return;
        }
        const parts = fromDate(date, mode);
        if (!isValidParts(parts, mode)) {
            setTimestampError('تاریخ این تایم‌استمپ در محدودهٔ تقویم قابل پشتیبانی نیست.');
            return;
        }
        onTimestampApply?.(parts);
        setTimestampError('');
    };

    return <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-[#0d1117]">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />{title}</strong><div className="flex gap-2 text-xs text-slate-500">{actions}</div></div>
        <InputParts value={value} onChange={onChange} mode={mode} />
        {onTimestampApply && <div className="space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">تایم‌استمپ یونیکس (ثانیه یا میلی‌ثانیه)
                <div className="mt-1 flex gap-2">
                    <input type="text" inputMode="numeric" dir="ltr" value={timestampInput} onChange={(event) => { setTimestampInput(event.target.value); setTimestampError(''); }} placeholder="مثلاً 1790502786 یا 1790502786000" className="h-10 min-w-0 flex-1 rounded-lg bg-white px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#161b26] dark:text-white" />
                    <Button type="button" onClick={applyTimestamp} className="shrink-0 bg-blue-600">اعمال</Button>
                </div>
            </label>
            {timestampError && <p role="alert" className="text-xs text-red-600">{timestampError}</p>}
        </div>}
    </div>;
}

function ResultCard({ difference, start, end }: { difference: { days: number; hours: number; minutes: number; seconds: number; years: number; months: number; remainingDays: number; totalHours: number; totalMinutes: number; totalSeconds: number; milliseconds: number }; start: string; end: string }) {
    return <div className="space-y-4 lg:col-span-6">
        <Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]">
            <div className="flex items-center justify-between text-xs text-slate-500"><span>خلاصه کل فاصله زمانی</span><span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">محاسبه معتبر</span></div>
            <div className="rounded-xl bg-blue-50 p-5 dark:bg-blue-950/30"><span className="text-xs font-semibold text-blue-600">مدت زمان به زبان طبیعی:</span><h2 className="mt-2 text-2xl font-bold">{faNumber(difference.years)} سال و {faNumber(difference.months)} ماه و {faNumber(difference.remainingDays)} روز</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">معادل <b>{faNumber(difference.days)} روز کامل</b> و {faNumber(difference.hours)} ساعت و {faNumber(difference.minutes)} دقیقه و {faNumber(difference.seconds)} ثانیه</p></div>
            <div className="flex items-center justify-between text-xs text-slate-500"><span>{start}</span><span className="font-semibold text-blue-600">بازهٔ محاسبه‌شده</span><span>{end}</span></div>
        </Card>
        <div className="grid grid-cols-2 gap-4"><Metric title="روزهای کامل سپری‌شده" value={faNumber(difference.days)} subtitle="هر روز برابر ۲۴ ساعت" /><Metric title="کل ساعت‌ها" value={faNumber(difference.totalHours)} subtitle="ساعت سپری‌شده" /><Metric title="کل دقیقه‌ها" value={faNumber(difference.totalMinutes)} subtitle="دقیقه استاندارد" /><Metric title="ثانیه و میلی‌ثانیه" value={faNumber(difference.totalSeconds)} subtitle={`${faNumber(difference.milliseconds)} ms`} /></div>
    </div>;
}

function MathView({ mode, base, setBase, operation, setOperation, shift, setShift, shifted, shiftedLabel }: { mode: CalendarMode; base: Parts; setBase: (value: Parts) => void; operation: 'add' | 'sub'; setOperation: (value: 'add' | 'sub') => void; shift: Shift; setShift: React.Dispatch<React.SetStateAction<Shift>>; shifted: { timestamp: number; parts: Parts }; shiftedLabel: string }) {
    const labels: Record<keyof Shift, string> = { years: 'سال', months: 'ماه', weeks: 'هفته', days: 'روز', hours: 'ساعت', minutes: 'دقیقه', seconds: 'ثانیه' };
    const fields = Object.keys(shift) as (keyof Shift)[];
    return <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:col-span-7">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Timer className="h-5 w-5 text-blue-600" />افزودن یا کاستن زمان از تاریخ مبدأ</h2>
            <DateBlock title="انتخاب تاریخ پایه" value={base} onChange={setBase} mode={mode} actions={null} />
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setOperation('add')} className={`rounded-xl p-4 text-right ${operation === 'add' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500' : 'bg-slate-50 text-slate-600'}`}><Plus className="mb-2 h-5 w-5" /><b>افزودن زمان (+)</b><small className="mt-1 block">حرکت به آینده</small></button>
                <button type="button" onClick={() => setOperation('sub')} className={`rounded-xl p-4 text-right ${operation === 'sub' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500' : 'bg-slate-50 text-slate-600'}`}><Minus className="mb-2 h-5 w-5" /><b>کاستن زمان (-)</b><small className="mt-1 block">حرکت به گذشته</small></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {fields.map((key) => <label key={key} className="text-xs text-slate-500">{labels[key]}<input type="number" min="0" step="1" value={shift[key]} onChange={(event) => setShift((current) => ({ ...current, [key]: Math.max(0, Math.floor(Number(event.target.value) || 0)) }))} className="mt-1 h-10 w-full rounded-lg bg-slate-50 px-2 text-center font-mono dark:bg-[#0d1117]" /></label>)}
            </div>
        </Card>
        <Card className="space-y-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:col-span-5">
            <div className="flex justify-between text-xs text-slate-500"><span>تاریخ و زمان حاصل‌شده</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">پاسخ نهایی</span></div>
            <div className="rounded-xl bg-blue-50 p-5 dark:bg-blue-950/30"><span className="text-xs text-blue-600">تقویم {mode === 'jalali' ? 'خورشیدی (جلالی)' : 'میلادی'}:</span><h2 className="mt-2 text-xl font-bold">{shiftedLabel}</h2></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-[#0d1117]"><span className="text-xs text-slate-500">تایم‌استمپ یونیکس</span><strong dir="ltr" className="font-mono">{Number.isFinite(shifted.timestamp) ? shifted.timestamp : '—'}</strong><CopyButton value={Number.isFinite(shifted.timestamp) ? String(shifted.timestamp) : ''} disabled={!Number.isFinite(shifted.timestamp)} /></div>
        </Card>
    </div>;
}

function Badge({ text, blue = false }: { text: string; blue?: boolean }) { return <span className={`rounded-full px-3 py-1 text-xs ${blue ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{text}</span>; }
function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-xl bg-slate-50 p-5 dark:bg-[#0d1117]"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p></div>; }
