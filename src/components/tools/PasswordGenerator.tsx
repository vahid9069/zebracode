'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Check, ChevronDown, CloudOff, Copy, Database, Download,
    Eye, EyeOff, History, KeyRound, Lock, MemoryStick, RefreshCw, Shield,
    ShieldCheck, Trash2, Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Mode = 'password' | 'passphrase' | 'pin';
type CharacterOption = 'upper' | 'lower' | 'numbers' | 'symbols';
type ToggleKey = CharacterOption | 'similar' | 'ambiguous' | 'consecutive';

const STORAGE_KEY = 'zebracode_password_history';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const WORDS = ['falcon', 'orbit', 'quantum', 'matrix', 'beacon', 'cipher', 'zenith', 'cobalt', 'vector', 'nexus', 'pulse', 'summit', 'frost', 'timber', 'aurora', 'shadow', 'breeze', 'dynamo', 'flame', 'glacier', 'harbor', 'island', 'jungle', 'meteor', 'nebula', 'plasma', 'quasar', 'ripple', 'spark', 'trident', 'vortex', 'wildfire', 'anchor', 'bronze', 'comet', 'drifter', 'ember', 'granite', 'horizon'];
const CHARACTER_OPTIONS: readonly CharacterOption[] = ['upper', 'lower', 'numbers', 'symbols'];
const isCharacterOption = (key: ToggleKey): key is CharacterOption => CHARACTER_OPTIONS.some((option) => option === key);

const randomInt = (max: number) => {
    if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
        throw new RangeError('max must be an integer between 1 and 2^32');
    }

    const limit = Math.floor(0x100000000 / max) * max;
    const values = new Uint32Array(1);
    do {
        crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
};

const pick = (pool: string | readonly string[]) => pool[randomInt(pool.length)];

const getCharacterPools = (options: Record<ToggleKey, boolean>) => {
    const remove = (pool: string, chars: string) => pool.split('').filter((char) => !chars.includes(char)).join('');
    const similar = 'il1Lo0O';
    const ambiguous = '{}[]()/\\\'"`~,:;<>';
    return {
        upper: options.similar ? remove(UPPER, similar) : UPPER,
        lower: options.similar ? remove(LOWER, similar) : LOWER,
        numbers: options.similar ? remove(NUMBERS, similar) : NUMBERS,
        symbols: options.ambiguous ? remove(SYMBOLS, ambiguous) : SYMBOLS,
    };
};

export default function PasswordGenerator() {
    const [mode, setMode] = useState<Mode>('password');
    const [length, setLength] = useState(20);
    const [wordsCount, setWordsCount] = useState(4);
    const [separator, setSeparator] = useState('-');
    const [pinLength, setPinLength] = useState(6);
    const [password, setPassword] = useState('');
    const [masked, setMasked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [bulk, setBulk] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [toast, setToast] = useState('');
    const toastTimeout = useRef<number | null>(null);
    const [options, setOptions] = useState<Record<ToggleKey, boolean>>({
        upper: true, lower: true, numbers: true, symbols: true,
        similar: false, ambiguous: false, consecutive: false,
    });
    const [capitalizeWords, setCapitalizeWords] = useState(true);
    const [addNumber, setAddNumber] = useState(true);
    const [uniquePin, setUniquePin] = useState(false);

    const showToast = useCallback((message: string) => {
        setToast(message);
        if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
        toastTimeout.current = window.setTimeout(() => {
            setToast('');
            toastTimeout.current = null;
        }, 2200);
    }, []);

    useEffect(() => () => {
        if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
    }, []);

    useEffect(() => {
        try {
            window.sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            showToast('دسترسی به پاک‌سازی تاریخچهٔ قدیمی مرورگر ممکن نیست.');
        }
    }, [showToast]);

    const generate = useCallback((selectedMode: Mode = mode) => {
        if (selectedMode === 'passphrase') {
            const selected = Array.from({ length: wordsCount }, () => {
                const word = pick(WORDS);
                return capitalizeWords ? word[0].toUpperCase() + word.slice(1) : word;
            });
            if (addNumber) selected[selected.length - 1] += String(randomInt(90) + 10);
            return selected.join(separator);
        }
        if (selectedMode === 'pin') {
            const digits = [...NUMBERS];
            const effectiveLength = uniquePin ? Math.min(pinLength, digits.length) : pinLength;
            return Array.from({ length: effectiveLength }, () => uniquePin ? digits.splice(randomInt(digits.length), 1)[0] : pick(NUMBERS)).join('');
        }

        const pools = getCharacterPools(options);
        const active = CHARACTER_OPTIONS.filter((key) => options[key]);
        const safeActive = active.length ? active : ['lower' as const];
        const pool = safeActive.map((key) => pools[key]).join('');
        const result = safeActive.map((key) => pick(pools[key]));
        while (result.length < length) {
            const char = pick(pool);
            if (options.consecutive && result.at(-1) === char) continue;
            result.push(char);
        }
        for (let index = result.length - 1; index > 0; index -= 1) {
            const swap = randomInt(index + 1);
            [result[index], result[swap]] = [result[swap], result[index]];
        }
        return result.join('');
    }, [addNumber, capitalizeWords, length, mode, options, pinLength, separator, uniquePin, wordsCount]);

    const regenerate = useCallback(() => {
        const next = generate();
        setPassword(next);
        setCopied(false);
        setHistory((current) => [next, ...current.filter((item) => item !== next)].slice(0, 5));
    }, [generate]);

    useEffect(() => {
        setPassword(generate());
        setCopied(false);
    }, [generate]);

    const metrics = useMemo(() => {
        let entropy = 0;
        if (mode === 'passphrase') {
            entropy = wordsCount * Math.log2(WORDS.length) + (addNumber ? Math.log2(90) : 0);
        } else if (mode === 'pin') {
            entropy = uniquePin
                ? Array.from({ length: Math.min(pinLength, NUMBERS.length) }, (_, index) => Math.log2(NUMBERS.length - index)).reduce((sum, bits) => sum + bits, 0)
                : pinLength * Math.log2(NUMBERS.length);
        } else {
            const pools = getCharacterPools(options);
            const active = CHARACTER_OPTIONS.filter((key) => options[key]);
            const safeActive = active.length ? active : ['lower' as const];
            const poolSize = safeActive.reduce((total, key) => total + pools[key].length, 0);
            entropy = safeActive.reduce((sum, key) => sum + Math.log2(pools[key].length), 0)
                + Math.max(0, length - safeActive.length) * Math.log2(poolSize);
        }
        entropy = Math.round(entropy * 10) / 10;
        const score = entropy >= 80 ? 4 : entropy >= 60 ? 3 : entropy >= 40 ? 2 : 1;
        return { entropy, score };
    }, [addNumber, length, mode, options, pinLength, uniquePin, wordsCount]);

    const strength = [
        { label: 'ضعیف', color: 'text-red-600', bar: 'bg-red-500' },
        { label: 'متوسط', color: 'text-amber-600', bar: 'bg-amber-500' },
        { label: 'قوی', color: 'text-blue-600', bar: 'bg-blue-600' },
        { label: 'بسیار قوی', color: 'text-emerald-600', bar: 'bg-emerald-500' },
    ][metrics.score - 1];

    const copy = async (value = password, isGeneratedPassword = true) => {
        if (!value) {
            showToast('ابتدا رمز یا فهرستی تولید کنید.');
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
            if (isGeneratedPassword) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
            }
            showToast(isGeneratedPassword ? 'رمز عبور با موفقیت کپی شد!' : 'محتوا با موفقیت کپی شد!');
        } catch {
            showToast('کپی انجام نشد؛ دسترسی کلیپ‌بورد در این مرورگر در دسترس نیست.');
        }
    };

    const setOption = (key: ToggleKey) => {
        if (isCharacterOption(key) && options[key]
            && !CHARACTER_OPTIONS.some((candidate) => candidate !== key && options[candidate])) {
            showToast('حداقل یک مجموعهٔ کاراکتر باید فعال بماند.');
            return;
        }
        setOptions((current) => ({ ...current, [key]: !current[key] }));
    };
    const runBulk = () => setBulk(Array.from({ length: 10 }, () => generate()).join('\n'));
    const downloadBulk = () => {
        if (!bulk) {
            showToast('ابتدا فهرست رمزها را تولید کنید.');
            return;
        }
        const url = URL.createObjectURL(new Blob([bulk], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'zebracode-passwords.txt';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const reset = () => {
        setLength(20); setWordsCount(4); setSeparator('-'); setPinLength(6);
        setCapitalizeWords(true); setAddNumber(true); setUniquePin(false);
        setOptions({ upper: true, lower: true, numbers: true, symbols: true, similar: false, ambiguous: false, consecutive: false });
        setMode('password'); setMasked(false); setBulk('');
        showToast('تنظیمات به حالت پایه بازگردانده شد.');
    };
    const labelForMode: Record<Mode, string> = { password: 'کاراکتر تصادفی', passphrase: 'عبارت کلمه‌ای', pin: 'پین‌کد عددی' };

    return (
        <div dir="rtl" className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-[#0b1c30] dark:bg-[#0b0f19] dark:text-white md:px-6 lg:pr-72">
            <div className="mx-auto max-w-[1440px] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><a href="/">خانه</a><ChevronDown className="h-4 w-4 -rotate-90" /><span>ابزارها</span><ChevronDown className="h-4 w-4 -rotate-90" /><span className="font-semibold text-slate-800 dark:text-white">رمز عبور امن</span></div>
                    <div className="flex flex-wrap gap-2"><Badge icon={<ShieldCheck />} text="Web Crypto API (CSPRNG)" /><Badge icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} text="پردازش ۱۰۰٪ محلی در مرورگر" green /></div>
                </div>

                <Card className="flex flex-col justify-between gap-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:flex-row lg:items-center">
                    <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><KeyRound /></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">تولیدکننده رمز عبور امن و تصادفی</h1><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">v2.4.0</span></div><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">تولید رمز با Web Crypto در مرورگر؛ هیچ رمزی به سرور ارسال نمی‌شود و تاریخچه فقط تا زمان بازبودن همین صفحه در حافظه می‌ماند.</p></div></div>
                    <div className="flex items-center justify-center gap-4 rounded-xl bg-slate-50 p-3 dark:bg-[#0d1117]"><Metric label="آنتروپی اسمی" value={`${metrics.entropy} bit`} /><Metric label="قدرت تقریبی" value={strength.label} green /><Metric label="روش تصادفی" value="Web Crypto" /></div>
                </Card>

                <div className="grid items-start gap-6 lg:grid-cols-12">
                    <div className="min-w-0 space-y-6 lg:col-span-7">
                        <Card className="space-y-6 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]">
                            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex min-w-0 flex-wrap items-center gap-2 text-lg font-semibold"><Lock className="h-5 w-5 shrink-0 text-blue-600" />رمز عبور تولید شده <span className="text-xs text-slate-500">طول: {password.length} کاراکتر</span></h2><button type="button" aria-label={masked ? 'نمایش رمز عبور' : 'پنهان‌کردن رمز عبور'} onClick={() => setMasked(!masked)} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100">{masked ? <EyeOff /> : <Eye />}</button></div>
                            <div dir="ltr" aria-label="رمز تولیدشده" className="block min-h-24 w-full min-w-0 break-all rounded-xl bg-slate-50 p-5 text-left font-mono text-xl font-semibold tracking-wider shadow-inner dark:bg-[#0d1117]">{masked ? '•'.repeat(password.length) : password.split('').map((char, index) => <span key={`${char}-${index}`} className={/[A-Z]/.test(char) ? 'text-blue-600' : /[a-z]/.test(char) ? 'text-slate-800 dark:text-slate-200' : /[0-9]/.test(char) ? 'text-orange-600' : 'text-emerald-600'}>{char}</span>)}</div>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500"><Legend color="bg-blue-600" text="حروف بزرگ (A-Z)" /><Legend color="bg-slate-800" text="حروف کوچک (a-z)" /><Legend color="bg-orange-600" text="اعداد (0-9)" /><Legend color="bg-emerald-600" text="نمادها (!@#$)" /></div>
                            <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={regenerate} className="h-12 flex-1 bg-blue-600 text-base hover:bg-blue-700"><RefreshCw className="h-5 w-5" />تولید مجدد رمز عبور</Button><Button type="button" variant="outline" onClick={() => copy()} className="h-12 sm:px-6"><Copy className="h-5 w-5" />{copied ? 'کپی شد' : 'کپی در کلیپ‌بورد'}</Button></div>
                            <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-[#0d1117]"><div className="flex items-center justify-between text-sm"><span className="font-semibold">ارزیابی تقریبی قدرت رمز: <strong className={strength.color}>{strength.label}</strong></span><span className="font-mono text-slate-500">{metrics.score * 25}%</span></div><div className="flex h-2 gap-1 overflow-hidden rounded-full bg-white p-0.5">{[1, 2, 3, 4].map((bar) => <span key={bar} className={`h-full flex-1 rounded-full ${bar <= metrics.score ? strength.bar : 'bg-slate-200'}`} />)}</div><p className="text-xs text-slate-500">این برآورد بر اساس گزینه‌های تولید است و تضمین امنیت یا زمان لازم برای شکستن رمز نیست.</p></div>
                            <div className="space-y-2"><div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span className="flex items-center gap-1"><History className="h-4 w-4" />تاریخچهٔ رمزهای همین صفحه</span><button type="button" onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-red-600"><Trash2 className="h-3.5 w-3.5" />پاک‌سازی تاریخچه</button></div>{history.length ? history.map((item) => <div key={item} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-[#0d1117]"><span dir="ltr" className="truncate font-mono text-sm text-slate-600">{item}</span><button type="button" aria-label="کپی رمز از تاریخچه" onClick={() => copy(item, false)} className="p-1 text-slate-500"><Copy className="h-4 w-4" /></button></div>) : <span className="text-xs text-slate-500">تاریخچه‌ای ثبت نشده است.</span>}<p className="text-xs text-slate-500">تاریخچه فقط در حافظهٔ موقت این صفحه نگهداری می‌شود و با بارگذاری مجدد پاک خواهد شد.</p></div>
                        </Card>
                        <Card className="space-y-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><h2 className="flex items-center gap-2 text-lg font-semibold"><Database className="h-5 w-5 text-blue-600" />تولید دسته‌ای برای مدیریت سرور و دواپس</h2><div className="relative"><textarea value={bulk} rows={5} dir="ltr" readOnly className="w-full resize-none break-all rounded-lg bg-slate-50 p-4 font-mono text-sm outline-none dark:bg-[#0d1117]" placeholder="روی دکمه تولید لیست کلیک کنید..." /><div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={runBulk}><Zap className="h-4 w-4" />تولید لیست</Button><Button type="button" size="sm" variant="outline" onClick={() => copy(bulk, false)}><Copy className="h-4 w-4" />کپی همه</Button><Button type="button" size="sm" variant="outline" onClick={downloadBulk}><Download className="h-4 w-4" />دانلود txt</Button></div></div></Card>
                    </div>

                    <Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:col-span-5">
                        <div className="flex rounded-lg bg-slate-100 p-1 text-xs dark:bg-[#0d1117]">{(['password', 'passphrase', 'pin'] as Mode[]).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 rounded-md px-2 py-2 font-semibold ${mode === item ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1e1f26] dark:text-white' : 'text-slate-500'}`}>{labelForMode[item]}</button>)}</div>
                        {mode === 'password' && <div className="space-y-5"><Range label="طول رمز عبور (تعداد کاراکترها)" value={length} min={6} max={128} onChange={setLength} suffix="کاراکتر" /><Divider /><OptionGroup title="مجموعه کاراکترهای مجاز" options={[['upper', 'حروف بزرگ لاتین', 'A-Z'], ['lower', 'حروف کوچک لاتین', 'a-z'], ['numbers', 'اعداد ده‌دهی', '0-9'], ['symbols', 'کاراکترهای خاص و نمادها', '!@#$%^&*']] as [ToggleKey, string, string][]} values={options} toggle={setOption} /><Divider /><OptionGroup title="فیلترها و بهینه‌سازی خوانایی" options={[['similar', 'اجتناب از کاراکترهای مشابه و گیج‌کننده', 'I, l, 1, O, 0, o'], ['ambiguous', 'اجتناب از کاراکترهای تداخل‌دار با شل لینوکس', '{} [] () /'], ['consecutive', 'عدم تکرار متوالی کاراکترها', 'No Duplicate Consecutive']] as [ToggleKey, string, string][]} values={options} toggle={setOption} detailed /></div>}
                        {mode === 'passphrase' && <div className="space-y-5"><Range label="تعداد کلمات در عبارت" value={wordsCount} min={3} max={8} onChange={setWordsCount} suffix="کلمه" /><label className="block text-sm font-semibold">جداکننده کلمات<select value={separator} onChange={(event) => setSeparator(event.target.value)} className="mt-2 h-10 w-full rounded-lg bg-slate-100 px-3 dark:bg-[#0d1117]"><option value="-">خط تیره ( - )</option><option value=".">نقطه ( . )</option><option value="_">زیرخط ( _ )</option><option value=" ">فاصله خالی</option></select></label><CheckOption checked={capitalizeWords} onChange={() => setCapitalizeWords(!capitalizeWords)} text="بزرگ بودن حرف اول کلمات (TitleCase)" /><CheckOption checked={addNumber} onChange={() => setAddNumber(!addNumber)} text="افزودن عدد تصادفی به انتهای عبارت عبور" /></div>}
                        {mode === 'pin' && <div className="space-y-5"><Range label="طول پین‌کد عددی" value={pinLength} min={4} max={uniquePin ? 10 : 16} onChange={setPinLength} suffix="رقم" /><CheckOption checked={uniquePin} onChange={() => { setUniquePin(!uniquePin); if (!uniquePin && pinLength > 10) setPinLength(10); }} text="ارقام کاملاً غیرتکراری (حداکثر ۱۰ رقم)" /></div>}
                        <button type="button" onClick={reset} className="w-full pt-2 text-center text-sm text-slate-500 hover:text-blue-600">بازنشانی تنظیمات به مقادیر پیش‌فرض</button>
                    </Card>
                </div>

                <Card className="space-y-6 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div><span className="text-xs font-bold uppercase tracking-wider text-blue-600">تولید امن در مرورگر</span><h2 className="mt-1 text-xl font-bold">رمزها چگونه تولید و نگهداری می‌شوند؟</h2></div><div className="flex flex-wrap gap-2 text-xs"><Badge text="Web Crypto API" green /><Badge text="عدم ارسال رمز به سرور" /></div></div><div className="grid gap-4 md:grid-cols-3"><SecurityCard icon={<MemoryStick />} title="مولد اعداد تصادفی امن" text="برای انتخاب کاراکترها از crypto.getRandomValues مرورگر با حذف سوگیری modulo استفاده می‌شود." /><SecurityCard icon={<CloudOff />} title="پردازش محلی" text="رمزها در این ابزار به API ارسال نمی‌شوند؛ تولید و تاریخچهٔ موقت در مرورگر انجام می‌شود." /><SecurityCard icon={<ShieldCheck />} title="برآورد آنتروپی اسمی" text="آنتروپی بر اساس طول و مجموعه‌های فعال محاسبه می‌شود؛ این عدد تخمینی است و تضمین امنیت یا مقاومت در برابر حمله نیست." /></div></Card>

                <section className="mx-auto max-w-4xl space-y-5 pb-8"><div className="text-center"><span className="text-xs font-bold uppercase text-blue-600">پاسخ به ابهامات متداول</span><h2 className="mt-1 text-2xl font-bold">پرسش‌های متداول پیرامون امنیت کلمات عبور</h2></div>{[['تفاوت این ابزار با Math.random() در چیست؟', 'Math.random برای امنیت مناسب نیست؛ این ابزار مستقیماً از Web Crypto API مرورگر استفاده می‌کند و خروجی آن برای حملات پیش‌بینی‌پذیر طراحی نشده است.'], ['طول استاندارد یک رمز عبور چقدر باید باشد؟', 'برای استفاده عمومی حداقل ۱۶ کاراکتر تصادفی پیشنهاد می‌شود؛ طول بیشتر فضای کلید و مقاومت در برابر حدس را افزایش می‌دهد.'], ['آیا عبارت عبور چندکلمه‌ای امن است؟', 'بله، عبارت‌های ۴ یا ۵ کلمه‌ای تصادفی به دلیل طول و ترکیب‌های بسیار زیاد، هم امن و هم قابل حفظ‌کردن هستند.'], ['چرا گزینه اجتناب از کاراکترهای مشابه وجود دارد؟', 'برای جلوگیری از اشتباه هنگام خواندن یا تایپ دستی کاراکترهایی مانند 1 و l یا 0 و O.']].map(([question, answer]) => <details key={question} className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#161b26]"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{question}<ChevronDown className="h-5 w-5 text-slate-500" /></summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p></details>)}</section>
            </div>
            {toast && <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-xl"><Check className="h-5 w-5 text-emerald-400" />{toast}</div>}
        </div>
    );
}

function Badge({ text, icon, green = false }: { text: string; icon?: React.ReactNode; green?: boolean }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${green ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{icon}{text}</span>; }
function Metric({ label, value, green = false }: { label: string; value: string; green?: boolean }) { return <div className="flex min-w-20 flex-col items-center px-2 text-center"><span className="text-[10px] text-slate-500">{label}</span><strong className={`font-mono text-xs ${green ? 'text-emerald-600' : 'text-blue-600'}`}>{value}</strong></div>; }
function Legend({ color, text }: { color: string; text: string }) { return <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${color}`} />{text}</span>; }
function Divider() { return <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />; }
function Range({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) { return <div><div className="flex items-center justify-between text-sm font-semibold"><label>{label}</label><span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-blue-600 dark:bg-[#0d1117]">{value} {suffix}</span></div><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-4 w-full accent-blue-600" /><div className="flex justify-between text-xs text-slate-500"><span>{min}</span><span>{max}</span></div></div>; }
function OptionGroup({ title, options, values, toggle, detailed = false }: { title: string; options: [ToggleKey, string, string][]; values: Record<ToggleKey, boolean>; toggle: (key: ToggleKey) => void; detailed?: boolean }) { return <div className="space-y-2"><h3 className="text-sm font-semibold">{title}</h3>{options.map(([key, label, hint]) => <label key={key} className="flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-[#0d1117]"><span className="flex gap-2"><input type="checkbox" checked={values[key]} onChange={() => toggle(key)} className="mt-1 accent-blue-600" /><span><span className="block text-sm">{label}</span>{detailed && <small className="block pt-1 text-xs text-slate-500">{hint}</small>}</span></span>{!detailed && <code className="rounded bg-white px-2 py-0.5 text-xs text-blue-600 dark:bg-[#161b26]">{hint}</code>}</label>)}</div>; }
function CheckOption({ checked, onChange, text }: { checked: boolean; onChange: () => void; text: string }) { return <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-[#0d1117]"><input type="checkbox" checked={checked} onChange={onChange} className="accent-blue-600" />{text}</label>; }
function SecurityCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-xl bg-slate-50 p-5 dark:bg-[#0d1117]"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p></div>; }
