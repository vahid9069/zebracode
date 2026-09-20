// src/components/DateTimeSuite.tsx
'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { toJalaali, toGregorian, isLeapJalaaliYear } from 'jalaali-js';
import { Copy, Calendar, Clock, Check, RotateCcw, Timer, CalendarRange } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------- ثابت‌ها ----------
const MONTH_NAMES_FA = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000; // 3.5 ساعت به میلی‌ثانیه

// ---------- انواع ----------
interface DateEntry {
    calendar: 'shamsi' | 'gregorian';
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}
type TabType = 'timestamp' | 'difference' | 'addsub';

// ---------- توابع تبدیل UTC <-> ایران ----------
function toDateObjUTC(entry: DateEntry): Date {
    let gy: number, gm: number, gd: number;
    if (entry.calendar === 'shamsi') {
        const g = toGregorian(entry.year, entry.month, entry.day);
        gy = g.gy; gm = g.gm; gd = g.gd;
    } else {
        gy = entry.year; gm = entry.month; gd = entry.day;
    }
    // ساعت وارد شده توسط کاربر را به وقت ایران در نظر می‌گیریم و به UTC تبدیل می‌کنیم
    const iranDate = new Date(Date.UTC(gy, gm - 1, gd, entry.hour, entry.minute, entry.second));
    return new Date(iranDate.getTime() - IRAN_OFFSET_MS);
}

function toGregorianString(entry: DateEntry): string {
    const d = toDateObjUTC(entry);
    const iranDate = new Date(d.getTime() + IRAN_OFFSET_MS);
    return iranDate.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC',
    });
}

function toShamsiString(entry: DateEntry): string {
    const d = toDateObjUTC(entry);
    const iranDate = new Date(d.getTime() + IRAN_OFFSET_MS);
    const j = toJalaali(iranDate.getUTCFullYear(), iranDate.getUTCMonth() + 1, iranDate.getUTCDate());
    return `${j.jd} ${MONTH_NAMES_FA[j.jm - 1]} ${j.jy} ${String(iranDate.getUTCHours()).padStart(2, '0')}:${String(iranDate.getUTCMinutes()).padStart(2, '0')}:${String(iranDate.getUTCSeconds()).padStart(2, '0')}`;
}

function tsToDateEntry(ts: number): DateEntry {
    const d = new Date(ts * 1000 + IRAN_OFFSET_MS);
    const j = toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    return {
        calendar: 'shamsi',
        year: j.jy, month: j.jm, day: j.jd,
        hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds(),
    };
}

// ---------- کامپوننت‌های پایدار ----------
const Field = memo(function Field({
                                      label,
                                      value,
                                      onChange,
                                  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseInt(e.target.value, 10);
        if (!isNaN(num)) onChange(num);
    };

    return (
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 mb-0.5">{label}</label>
            <input
                type="number"
                value={value}
                onChange={handleChange}
                className="w-full px-1 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-indigo-400 outline-none"
            />
        </div>
    );
});

const DateInputCard = memo(function DateInputCard({
                                                      value,
                                                      onChange,
                                                      label,
                                                  }: {
    value: DateEntry;
    onChange: (d: DateEntry) => void;
    label: string;
}) {
    const toggleCalendar = useCallback(() => {
        if (value.calendar === 'shamsi') {
            const g = toGregorian(value.year, value.month, value.day);
            onChange({ ...value, calendar: 'gregorian', year: g.gy, month: g.gm, day: g.gd });
        } else {
            const j = toJalaali(value.year, value.month, value.day);
            onChange({ ...value, calendar: 'shamsi', year: j.jy, month: j.jm, day: j.jd });
        }
    }, [value, onChange]);

    const crossDate = value.calendar === 'shamsi'
        ? toGregorianString(value)
        : toShamsiString(value);

    const updateYear = useCallback((year: number) => onChange({ ...value, year }), [value, onChange]);
    const updateMonth = useCallback((month: number) => onChange({ ...value, month }), [value, onChange]);
    const updateDay = useCallback((day: number) => onChange({ ...value, day }), [value, onChange]);
    const updateHour = useCallback((hour: number) => onChange({ ...value, hour }), [value, onChange]);
    const updateMinute = useCallback((minute: number) => onChange({ ...value, minute }), [value, onChange]);
    const updateSecond = useCallback((second: number) => onChange({ ...value, second }), [value, onChange]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-sm">{label}</span>
                <button onClick={toggleCalendar} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    {value.calendar === 'shamsi' ? 'Gregorian' : 'Shamsi'}
                </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
                <Field label="Y" value={value.year} onChange={updateYear} />
                <Field label="M" value={value.month} onChange={updateMonth} />
                <Field label="D" value={value.day} onChange={updateDay} />
                <Field label="H" value={value.hour} onChange={updateHour} />
                <Field label="m" value={value.minute} onChange={updateMinute} />
                <Field label="s" value={value.second} onChange={updateSecond} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{crossDate}</div>
        </div>
    );
});

export default function DateTimeSuite() {
    const [activeTab, setActiveTab] = useState<TabType>('timestamp');

    // ================= Timestamp =================
    const [tsNow, setTsNow] = useState<number | null>(null);
    const [tsInput, setTsInput] = useState('');
    const [tsCopied, setTsCopied] = useState(false);
    const [tsOutput, setTsOutput] = useState<{ shamsi: string; gregorian: string } | null>(null);
    const [toTsDate, setToTsDate] = useState<DateEntry>({
        calendar: 'shamsi', year: 1404, month: 2, day: 21, hour: 10, minute: 30, second: 0,
    });
    const [generatedTs, setGeneratedTs] = useState<number | null>(null);

    // ================= Date Difference =================
    const [diffDate1, setDiffDate1] = useState<DateEntry>({
        calendar: 'shamsi', year: 1404, month: 2, day: 20, hour: 10, minute: 0, second: 0,
    });
    const [diffDate2, setDiffDate2] = useState<DateEntry>({
        calendar: 'shamsi', year: 1404, month: 2, day: 21, hour: 10, minute: 0, second: 0,
    });
    const [diffResult, setDiffResult] = useState<any>(null);

    // ================= Add / Subtract =================
    const [baseDate, setBaseDate] = useState<DateEntry>({
        calendar: 'shamsi', year: 1404, month: 2, day: 20, hour: 10, minute: 0, second: 0,
    });
    const [baseTs, setBaseTs] = useState('');
    const [addDays, setAddDays] = useState(0);
    const [addHours, setAddHours] = useState(0);
    const [addMinutes, setAddMinutes] = useState(0);
    const [addSeconds, setAddSeconds] = useState(0);
    const [resultDate, setResultDate] = useState<DateEntry | null>(null);
    const [resultTs, setResultTs] = useState<number | null>(null);

    // تایمر زنده تایم‌استمپ
    useEffect(() => {
        const update = () => setTsNow(Math.floor(Date.now() / 1000));
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, []);

    // Timestamp → Date
    const handleTsConvert = useCallback(() => {
        const num = parseInt(tsInput, 10);
        if (isNaN(num)) return;
        const ts = num.toString().length === 13 ? Math.floor(num / 1000) : num;
        const entry = tsToDateEntry(ts);
        setTsOutput({
            shamsi: toShamsiString(entry),
            gregorian: toGregorianString(entry),
        });
    }, [tsInput]);

    // Date → Timestamp
    const handleDateToTs = useCallback(() => {
        const d = toDateObjUTC(toTsDate);
        setGeneratedTs(Math.floor(d.getTime() / 1000));
    }, [toTsDate]);

    // محاسبه اختلاف تاریخ
    const handleDiffCalc = useCallback(() => {
        const d1 = toDateObjUTC(diffDate1).getTime();
        const d2 = toDateObjUTC(diffDate2).getTime();
        const diffSec = Math.floor(Math.abs(d1 - d2) / 1000);
        let remaining = diffSec;
        const days = Math.floor(remaining / 86400); remaining %= 86400;
        const hours = Math.floor(remaining / 3600); remaining %= 3600;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30.44);
        setDiffResult({ diffSec, years, months, days, hours, minutes, seconds });
    }, [diffDate1, diffDate2]);

    // Add/Subtract
    const handleAddSub = useCallback(() => {
        let startDate: Date;
        if (baseTs.trim()) {
            const num = parseInt(baseTs, 10);
            if (isNaN(num)) return;
            const ts = num.toString().length === 13 ? Math.floor(num / 1000) : num;
            startDate = new Date(ts * 1000);
        } else {
            startDate = toDateObjUTC(baseDate);
        }
        const newMs = startDate.getTime() +
            addDays * 86400_000 +
            addHours * 3600_000 +
            addMinutes * 60_000 +
            addSeconds * 1000;
        const newDate = new Date(newMs);
        const entry = tsToDateEntry(Math.floor(newDate.getTime() / 1000));
        setResultDate(entry);
        setResultTs(Math.floor(newDate.getTime() / 1000));
    }, [baseDate, baseTs, addDays, addHours, addMinutes, addSeconds]);

    return (
        <div className="min-h-screen max-w-5xl mx-auto p-4 space-y-6 bg-background text-foreground">
            {/* تب‌ها */}
            <div className="flex flex-wrap gap-2 justify-center">
                {([
                    ['timestamp', Clock, 'Timestamp'],
                    ['difference', CalendarRange, 'Date Diff'],
                    ['addsub', Timer, 'Add/Sub'],
                ] as [TabType, any, string][]).map(([tab, Icon, label]) => (
                    <Button
                        type="button"
                        variant={activeTab === tab ? 'default' : 'outline'}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                            activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'
                        }`}
                    >
                        <Icon size={18} /> {label}
                    </Button>
                ))}
            </div>

            {/* ===== Timestamp Tab ===== */}
            {activeTab === 'timestamp' && (
                <div className="space-y-6">
                    {/* Timestamp زنده */}
                    <div className="text-center">
                        <Card className="inline-flex items-center gap-3 px-6 py-3 rounded-full shadow">
                            <Clock className="text-indigo-500" size={24} />
                            <span className="text-3xl font-mono font-bold">{tsNow}</span>
                            <button onClick={() => { navigator.clipboard.writeText(tsNow?.toString() ?? ''); setTsCopied(true); setTimeout(() => setTsCopied(false), 2000); }}>
                                {tsCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </Card>
                    </div>

                    {/* Timestamp → Date */}
                    <Card className="p-4 rounded-xl shadow space-y-3">
                        <h3 className="font-semibold">Timestamp to Date</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Timestamp..." value={tsInput} onChange={e => setTsInput(e.target.value)}
                                   className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <button onClick={handleTsConvert} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Convert</button>
                        </div>
                        {tsOutput && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between">
                                    <div><div className="text-xs">Shamsi</div><div className="font-bold" dir="rtl">{tsOutput.shamsi}</div></div>
                                    <button onClick={() => navigator.clipboard.writeText(tsOutput.shamsi)}><Copy size={16} /></button>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between">
                                    <div><div className="text-xs">Gregorian</div><div className="font-bold">{tsOutput.gregorian}</div></div>
                                    <button onClick={() => navigator.clipboard.writeText(tsOutput.gregorian)}><Copy size={16} /></button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Date → Timestamp */}
                    <Card className="p-4 rounded-xl shadow space-y-3">
                        <h3 className="font-semibold">Date to Timestamp</h3>
                        <DateInputCard value={toTsDate} onChange={setToTsDate} label="Date" />
                        <button onClick={handleDateToTs} className="bg-emerald-600 text-white px-4 py-2 rounded-lg w-full">Generate Timestamp</button>
                        {generatedTs !== null && (
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center font-mono">
                                <span>{generatedTs}</span>
                                <button onClick={() => { navigator.clipboard.writeText(generatedTs.toString()); }}>
                                    <Copy size={16} />
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* ===== Date Diff Tab ===== */}
            {activeTab === 'difference' && (
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <DateInputCard value={diffDate1} onChange={setDiffDate1} label="First Date" />
                        <DateInputCard value={diffDate2} onChange={setDiffDate2} label="Second Date" />
                    </div>
                    <div className="text-center">
                        <button onClick={handleDiffCalc} className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold">
                            <RotateCcw size={18} className="inline mr-2" /> Calculate Difference
                        </button>
                    </div>
                    {diffResult && (
                        <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-center">
                            {[
                                ['Years', diffResult.years],
                                ['Months', diffResult.months],
                                ['Days', diffResult.days],
                                ['Hours', diffResult.hours],
                                ['Minutes', diffResult.minutes],
                                ['Seconds', diffResult.seconds],
                                ['Total Sec', diffResult.diffSec],
                            ].map(([l, v]) => (
                                <div key={l} className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                    <div className="text-lg font-bold text-violet-700">{v}</div>
                                    <div className="text-[10px] text-gray-500">{l}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== Add/Sub Tab ===== */}
            {activeTab === 'addsub' && (
                <div className="space-y-6">
                    <Card className="p-4 rounded-xl shadow space-y-3">
                        <div className="flex gap-2">
                            <button onClick={() => setBaseTs('')} className={`px-3 py-1 text-sm rounded-full ${!baseTs ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'}`}>Date</button>
                            <button onClick={() => setBaseTs(tsNow?.toString() ?? '')} className={`px-3 py-1 text-sm rounded-full ${baseTs ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'}`}>Timestamp</button>
                        </div>
                        {!baseTs ? (
                            <DateInputCard value={baseDate} onChange={setBaseDate} label="Base Date" />
                        ) : (
                            <input type="text" value={baseTs} onChange={e => setBaseTs(e.target.value)} placeholder="Timestamp" className="w-full p-2 border rounded dark:bg-gray-700" />
                        )}
                    </Card>
                    <Card className="p-4 rounded-xl shadow">
                        <h3 className="font-semibold mb-3">Add / Subtract</h3>
                        <div className="grid grid-cols-4 gap-2">
                            <Field label="Days" value={addDays} onChange={setAddDays} />
                            <Field label="Hours" value={addHours} onChange={setAddHours} />
                            <Field label="Minutes" value={addMinutes} onChange={setAddMinutes} />
                            <Field label="Seconds" value={addSeconds} onChange={setAddSeconds} />
                        </div>
                        <Button type="button" onClick={handleAddSub} className="mt-4 w-full">Calculate</Button>
                    </Card>
                    {resultDate && (
                        <Card className="p-4 rounded-xl shadow space-y-2">
                            <div className="font-bold">New Date</div>
                            <div className="text-sm">Timestamp: {resultTs}</div>
                            <div className="text-sm">
                                Shamsi: <span dir="rtl">{toShamsiString(resultDate)}</span>
                            </div>
                            <div className="text-sm">Gregorian: {toGregorianString(resultDate)}</div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}