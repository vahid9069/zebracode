// src/components/TimestampConverter.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toJalaali, toGregorian, isLeapJalaaliYear } from 'jalaali-js';
import { Copy, Calendar, Clock, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MONTH_NAMES_FA = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const GREGORIAN_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const GREGORIAN_MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function shamsiDaysInMonth(year: number, month: number): number {
    if (month >= 1 && month <= 6) return 31;
    if (month >= 7 && month <= 11) return 30;
    if (month === 12) return isLeapJalaaliYear(year) ? 30 : 29;
    return 30;
}

interface SelectedDate {
    year: number;
    month: number;
    day: number;
}

export default function TimestampConverter() {
    const [tsNow, setTsNow] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    const [tsInput, setTsInput] = useState<string>('');
    const [tsOutput, setTsOutput] = useState<{ shamsi: string; gregorian: string } | null>(null);
    const [tsCopied, setTsCopied] = useState(false);

    const [dateInput, setDateInput] = useState({ jy: 1405, jm: 1, jd: 1, h: 0, m: 0, s: 0 });
    const [useShamsi, setUseShamsi] = useState(true);
    const [generatedTs, setGeneratedTs] = useState<number | null>(null);
    const [tsGeneratedCopied, setTsGeneratedCopied] = useState(false);

    const [calendarMode, setCalendarMode] = useState<'shamsi' | 'gregorian'>('shamsi');
    const [calYear, setCalYear] = useState<number>(1405);
    const [calMonth, setCalMonth] = useState<number>(1);
    const [gCalYear, setGCalYear] = useState<number>(2026);
    const [gCalMonth, setGCalMonth] = useState<number>(1);

    const [selectedShamsi, setSelectedShamsi] = useState<SelectedDate>({ year: 1405, month: 1, day: 1 });
    const [selectedGregorian, setSelectedGregorian] = useState<SelectedDate>({ year: 2026, month: 1, day: 1 });

    useEffect(() => {
        const now = new Date();
        const ts = Math.floor(now.getTime() / 1000);
        setTsNow(ts);
        const timer = setInterval(() => setTsNow(Math.floor(Date.now() / 1000)), 1000);

        const shamsi = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        setCalYear(shamsi.jy);
        setCalMonth(shamsi.jm);
        setGCalYear(now.getFullYear());
        setGCalMonth(now.getMonth() + 1);

        setDateInput({
            jy: shamsi.jy,
            jm: shamsi.jm,
            jd: shamsi.jd,
            h: now.getHours(),
            m: now.getMinutes(),
            s: now.getSeconds(),
        });

        setSelectedShamsi({ year: shamsi.jy, month: shamsi.jm, day: shamsi.jd });
        setSelectedGregorian({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        });

        setMounted(true);
        return () => clearInterval(timer);
    }, []);

    const formatShamsi = (jy: number, jm: number, jd: number) =>
        `${jd} ${MONTH_NAMES_FA[jm - 1]} ${jy}`;

    const handleTsConvert = useCallback(() => {
        const num = parseInt(tsInput, 10);
        if (isNaN(num)) return;
        const timestamp = num.toString().length === 13 ? Math.floor(num / 1000) : num;
        const date = new Date(timestamp * 1000);
        const g = toJalaali(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate()
        );
        setTsOutput({
            shamsi: formatShamsi(g.jy, g.jm, g.jd),
            gregorian: date.toLocaleString('en-US', {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
            }),
        });
    }, [tsInput]);

    const handleDateToTs = useCallback(() => {
        if (!mounted) return;
        let gy: number, gm: number, gd: number;
        if (useShamsi) {
            const g = toGregorian(dateInput.jy, dateInput.jm, dateInput.jd);
            gy = g.gy; gm = g.gm; gd = g.gd;
        } else {
            gy = dateInput.jy; gm = dateInput.jm; gd = dateInput.jd;
        }
        const dt = new Date(gy, gm - 1, gd, dateInput.h, dateInput.m, dateInput.s);
        setGeneratedTs(Math.floor(dt.getTime() / 1000));
        setTsGeneratedCopied(false);
    }, [dateInput, useShamsi, mounted]);

    const convertDateForCalendar = (toShamsi: boolean) => {
        if (toShamsi === useShamsi) return;
        let newJy: number, newJm: number, newJd: number;
        if (toShamsi) {
            const g = toJalaali(dateInput.jy, dateInput.jm, dateInput.jd);
            newJy = g.jy; newJm = g.jm; newJd = g.jd;
        } else {
            const g = toGregorian(dateInput.jy, dateInput.jm, dateInput.jd);
            newJy = g.gy; newJm = g.gm; newJd = g.gd;
        }
        setDateInput(prev => ({ ...prev, jy: newJy, jm: newJm, jd: newJd }));
        setUseShamsi(toShamsi);
    };

    const handleCalendarDayClick = (day: number) => {
        if (!mounted) return;
        if (calendarMode === 'shamsi') {
            setDateInput(prev => ({ ...prev, jy: calYear, jm: calMonth, jd: day }));
            setUseShamsi(true);
            const g = toGregorian(calYear, calMonth, day);
            const dt = new Date(g.gy, g.gm - 1, g.gd, dateInput.h, dateInput.m, dateInput.s);
            setGeneratedTs(Math.floor(dt.getTime() / 1000));
            setSelectedShamsi({ year: calYear, month: calMonth, day });
            setTsGeneratedCopied(false);
        } else {
            setDateInput(prev => ({ ...prev, jy: gCalYear, jm: gCalMonth, jd: day }));
            setUseShamsi(false);
            const dt = new Date(gCalYear, gCalMonth - 1, day, dateInput.h, dateInput.m, dateInput.s);
            setGeneratedTs(Math.floor(dt.getTime() / 1000));
            setSelectedGregorian({ year: gCalYear, month: gCalMonth, day });
            setTsGeneratedCopied(false);
        }
    };

    const renderShamsiCalendar = (): { day: number | null; cross: string | null }[] => {
        if (!mounted) return [];
        const firstDayOfMonth = toGregorian(calYear, calMonth, 1);
        const dateObj = new Date(firstDayOfMonth.gy, firstDayOfMonth.gm - 1, firstDayOfMonth.gd);
        const firstDayOfWeek = (dateObj.getDay() + 1) % 7;
        const daysCount = shamsiDaysInMonth(calYear, calMonth);
        const cells: { day: number | null; cross: string | null }[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null, cross: null });
        for (let d = 1; d <= daysCount; d++) {
            const g = toGregorian(calYear, calMonth, d);
            const cross = `${g.gd} ${GREGORIAN_MONTH_SHORT[g.gm - 1]}`;
            cells.push({ day: d, cross });
        }
        return cells;
    };

    const renderGregorianCalendar = (): { day: number | null; cross: string | null }[] => {
        if (!mounted) return [];
        const daysInMonth = new Date(gCalYear, gCalMonth, 0).getDate();
        const firstDay = new Date(gCalYear, gCalMonth - 1, 1);
        const firstDayOfWeek = (firstDay.getDay() + 1) % 7;
        const cells: { day: number | null; cross: string | null }[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null, cross: null });
        for (let d = 1; d <= daysInMonth; d++) {
            const j = toJalaali(gCalYear, gCalMonth, d);
            const cross = `${j.jd} ${MONTH_NAMES_FA[j.jm - 1]?.substring(0, 3)}`;
            cells.push({ day: d, cross });
        }
        return cells;
    };

    const calendarCells = calendarMode === 'shamsi' ? renderShamsiCalendar() : renderGregorianCalendar();
    const displayedYear = calendarMode === 'shamsi' ? calYear : gCalYear;
    const displayedMonth = calendarMode === 'shamsi' ? calMonth : gCalMonth;
    const monthName = calendarMode === 'shamsi'
        ? MONTH_NAMES_FA[calMonth - 1]
        : GREGORIAN_MONTH_NAMES[gCalMonth - 1];

    const changeMonth = (delta: number) => {
        if (calendarMode === 'shamsi') {
            let newMonth = calMonth + delta;
            let newYear = calYear;
            if (newMonth < 1) { newMonth = 12; newYear--; }
            else if (newMonth > 12) { newMonth = 1; newYear++; }
            setCalYear(newYear);
            setCalMonth(newMonth);
        } else {
            let newMonth = gCalMonth + delta;
            let newYear = gCalYear;
            if (newMonth < 1) { newMonth = 12; newYear--; }
            else if (newMonth > 12) { newMonth = 1; newYear++; }
            setGCalYear(newYear);
            setGCalMonth(newMonth);
        }
    };

    const isDayHighlighted = (day: number): boolean => {
        if (calendarMode === 'shamsi') {
            return selectedShamsi.year === calYear && selectedShamsi.month === calMonth && selectedShamsi.day === day;
        } else {
            return selectedGregorian.year === gCalYear && selectedGregorian.month === gCalMonth && selectedGregorian.day === day;
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen max-w-6xl mx-auto p-6 space-y-10 bg-background text-foreground">
                <section className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Unix Timestamp Now</h2>
                    <div className="mt-4 text-5xl font-mono bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-2xl inline-block animate-pulse">
                        Loading...
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 space-y-8 bg-background text-foreground">
            {/* Timestamp زنده */}
            <section className="text-center relative">
                <Card className="inline-flex items-center gap-3 px-6 py-4 rounded-full shadow-xl">
                    <Clock size={28} className="text-blue-500" />
                    <span className="text-4xl md:text-5xl font-mono font-bold text-gray-800 dark:text-white transition-opacity">
            {tsNow}
          </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(tsNow?.toString() ?? '');
                            setTsCopied(true);
                            setTimeout(() => setTsCopied(false), 2000);
                        }}
                        className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        title="Copy timestamp"
                    >
                        {tsCopied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                </Card>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">The current Unix timestamp (seconds)</p>
            </section>

            {/* دو کارت تبدیل در یک ردیف */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timestamp → Date */}
                <Card className="rounded-2xl shadow-lg p-6">
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        <Clock size={24} className="text-indigo-500" />
                        Timestamp to Date
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Unix timestamp..."
                            value={tsInput}
                            onChange={e => setTsInput(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <Button type="button" onClick={handleTsConvert}>
                            Convert
                        </Button>
                    </div>
                    {tsOutput && (
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shamsi (Jalali)</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white " dir="rtl">{tsOutput.shamsi}</div>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(tsOutput.shamsi)}
                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gregorian</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">{tsOutput.gregorian}</div>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(tsOutput.gregorian)}
                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Date → Timestamp */}
                <Card className="rounded-2xl shadow-lg p-6">
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        <Calendar size={24} className="text-emerald-500" />
                        Date to Timestamp
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => convertDateForCalendar(true)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${useShamsi ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            Shamsi
                        </button>
                        <button
                            onClick={() => convertDateForCalendar(false)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!useShamsi ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            Gregorian
                        </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                        <Field label="Year" value={dateInput.jy} onChange={(v: number) => setDateInput(p => ({...p, jy: v}))} />
                        <Field label="Month" value={dateInput.jm} onChange={(v: number) => setDateInput(p => ({...p, jm: v}))} />
                        <Field label="Day" value={dateInput.jd} onChange={(v: number) => setDateInput(p => ({...p, jd: v}))} />
                        <Field label="Hour" value={dateInput.h} onChange={(v: number) => setDateInput(p => ({...p, h: v}))} />
                        <Field label="Min" value={dateInput.m} onChange={(v: number) => setDateInput(p => ({...p, m: v}))} />
                        <Field label="Sec" value={dateInput.s} onChange={(v: number) => setDateInput(p => ({...p, s: v}))} />
                    </div>
                    <button onClick={handleDateToTs} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full mb-4">
                        Generate Timestamp
                    </button>
                    {generatedTs !== null && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp (seconds)</div>
                                <div className="text-xl font-mono font-bold text-gray-900 dark:text-white">{generatedTs}</div>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedTs.toString());
                                    setTsGeneratedCopied(true);
                                    setTimeout(() => setTsGeneratedCopied(false), 2000);
                                }}
                                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            >
                                {tsGeneratedCopied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-blue-600 dark:text-blue-400" />}
                            </button>
                        </div>
                    )}
                </Card>
            </div>

            {/* تقویم */}
            <Card className="rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white">
                        <Calendar size={24} className="text-purple-500" />
                        Calendar
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCalendarMode('shamsi')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${calendarMode === 'shamsi' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            Persian
                        </button>
                        <button
                            onClick={() => setCalendarMode('gregorian')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${calendarMode === 'gregorian' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            Gregorian
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monthName} {displayedYear}
                    </h4>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarCells.map((cell, idx) =>
                            cell.day !== null ? (
                                <button
                                    key={idx}
                                    onClick={() => handleCalendarDayClick(cell.day!)}
                                    className={`relative p-3 rounded-xl flex flex-col items-center transition-all duration-200 ${
                                        isDayHighlighted(cell.day!)
                                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                <span className={`text-lg font-semibold ${isDayHighlighted(cell.day!) ? 'text-white' : ''}`}>
                  {cell.day}
                </span>
                                    {cell.cross && (
                                        <span className={`text-[10px] mt-0.5 ${isDayHighlighted(cell.day!) ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {cell.cross}
                  </span>
                                    )}
                                </button>
                            ) : (
                                <div key={idx} />
                            )
                    )}
                </div>
            </Card>
        </div>
    );
}

// فیلد کوچک برای ورودی‌های عددی
function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 ml-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={e => onChange(+e.target.value)}
                className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>
    );
}