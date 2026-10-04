'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check, ChevronDown, CloudOff, Copy, Database, Download,
    Eye, EyeOff, History, KeyRound, Lock, MemoryStick, RefreshCw, Shield,
    ShieldCheck, Trash2, Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';

type Mode = 'password' | 'passphrase' | 'pin';
type ToggleKey = 'upper' | 'lower' | 'numbers' | 'symbols' | 'similar' | 'ambiguous' | 'consecutive';

const STORAGE_KEY = 'zebracode_password_history';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const WORDS = ['falcon', 'orbit', 'quantum', 'matrix', 'beacon', 'cipher', 'zenith', 'cobalt', 'vector', 'nexus', 'pulse', 'summit', 'frost', 'timber', 'aurora', 'shadow', 'breeze', 'dynamo', 'flame', 'glacier', 'harbor', 'island', 'jungle', 'meteor', 'nebula', 'plasma', 'quasar', 'ripple', 'spark', 'trident', 'vortex', 'wildfire', 'anchor', 'bronze', 'comet', 'drifter', 'ember', 'granite', 'horizon'];

const randomInt = (max: number) => {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
};

const pick = (pool: string) => pool[randomInt(pool.length)];

export default function PasswordGenerator() {
    const { locale, dict } = useI18n();
    const ui = dict.common.toolsUi.password;
    const homeHref = locale === 'en' ? '/en' : '/';

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
    const [options, setOptions] = useState<Record<ToggleKey, boolean>>({
        upper: true, lower: true, numbers: true, symbols: true,
        similar: false, ambiguous: false, consecutive: false,
    });
    const [capitalizeWords, setCapitalizeWords] = useState(true);
    const [addNumber, setAddNumber] = useState(true);
    const [uniquePin, setUniquePin] = useState(false);

    useEffect(() => {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const showToast = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 2200);
    };

    const generate = useCallback((selectedMode: Mode = mode) => {
        if (selectedMode === 'passphrase') {
            const selected = Array.from({ length: wordsCount }, () => {
                const word = WORDS[randomInt(WORDS.length)];
                return capitalizeWords ? word[0].toUpperCase() + word.slice(1) : word;
            });
            if (addNumber) selected[selected.length - 1] += String(randomInt(90) + 10);
            return selected.join(separator);
        }
        if (selectedMode === 'pin') {
            const digits = [...NUMBERS];
            return Array.from({ length: pinLength }, () => uniquePin && digits.length ? digits.splice(randomInt(digits.length), 1)[0] : pick(NUMBERS)).join('');
        }

        const remove = (pool: string, chars: string) => pool.split('').filter((char) => !chars.includes(char)).join('');
        const similar = 'il1Lo0O';
        const ambiguous = '{}[]()/\\\'"`~,:;<>';
        const pools = {
            upper: options.similar ? remove(UPPER, similar) : UPPER,
            lower: options.similar ? remove(LOWER, similar) : LOWER,
            numbers: options.similar ? remove(NUMBERS, similar) : NUMBERS,
            symbols: options.ambiguous ? remove(SYMBOLS, ambiguous) : SYMBOLS,
        };
        const active = (['upper', 'lower', 'numbers', 'symbols'] as const).filter((key) => options[key] && pools[key]);
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
        setHistory((current) => {
            const updated = [next, ...current.filter((item) => item !== next)].slice(0, 5);
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, [generate]);

    useEffect(() => { regenerate(); }, [mode]);

    const metrics = useMemo(() => {
        let poolSize = 0;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^A-Za-z0-9]/.test(password)) poolSize += 33;
        const entropy = password ? Math.round(password.length * Math.log2(Math.max(poolSize, 1)) * 10) / 10 : 0;
        const score = entropy >= 80 ? 4 : entropy >= 60 ? 3 : entropy >= 40 ? 2 : 1;
        return { entropy, score };
    }, [password]);

    const strength = [
        { color: 'text-red-600', bar: 'bg-red-500' },
        { color: 'text-amber-600', bar: 'bg-amber-500' },
        { color: 'text-blue-600', bar: 'bg-blue-600' },
        { color: 'text-emerald-600', bar: 'bg-emerald-500' },
    ][metrics.score - 1];
    const strengthInfo = ui.strength[metrics.score - 1];

    const copy = async (value = password) => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        showToast(ui.toastCopied);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const setOption = (key: ToggleKey) => setOptions((current) => ({ ...current, [key]: !current[key] }));
    const runBulk = () => setBulk(Array.from({ length: 10 }, () => generate()).join('\n'));
    const reset = () => {
        setLength(20); setWordsCount(4); setSeparator('-'); setPinLength(6);
        setCapitalizeWords(true); setAddNumber(true); setUniquePin(false);
        setOptions({ upper: true, lower: true, numbers: true, symbols: true, similar: false, ambiguous: false, consecutive: false });
        showToast(ui.toastReset);
    };
    const labelForMode: Record<Mode, string> = ui.modes;

    const charsetKeys: ToggleKey[] = ['upper', 'lower', 'numbers', 'symbols'];
    const charsetOptions = ui.charsets.map((option, index) => [charsetKeys[index], option.label, option.hint] as [ToggleKey, string, string]);
    const filterKeys: ToggleKey[] = ['similar', 'ambiguous', 'consecutive'];
    const filterOptions = ui.filters.map((option, index) => [filterKeys[index], option.label, option.hint] as [ToggleKey, string, string]);
    const separatorValues = ['-', '.', '_', ' '];

    return (
        <div dir={locale === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-[#0b1c30] dark:bg-[#0b0f19] dark:text-white md:px-6 lg:pr-72">
            <div className="mx-auto max-w-[1440px] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><a href={homeHref}>{ui.home}</a><ChevronDown className="h-4 w-4 -rotate-90" /><span>{ui.tools}</span><ChevronDown className="h-4 w-4 -rotate-90" /><span className="font-semibold text-slate-800 dark:text-white">{ui.category}</span></div>
                    <div className="flex flex-wrap gap-2"><Badge icon={<ShieldCheck />} text={ui.badgeApi} /><Badge icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} text={ui.badgeLocal} green /></div>
                </div>

                <Card className="flex flex-col justify-between gap-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:flex-row lg:items-center">
                    <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><KeyRound /></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{ui.title}</h1><span className="rounded bg-slate-100 px-2 py-0.5 font-sans text-xs text-slate-500">{ui.version}</span></div><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">{ui.description}</p></div></div>
                    <div className="flex items-center justify-center gap-4 rounded-xl bg-slate-50 p-3 dark:bg-[#0d1117]"><Metric label={ui.metricEntropy} value={`${metrics.entropy} bit`} /><Metric label={ui.metricCrackTime} value={strengthInfo.time} green /><Metric label={ui.metricRandom} value={ui.webCrypto} /></div>
                </Card>

                <div className="grid items-start gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-7">
                        <Card className="space-y-6 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]">
                            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><Lock className="h-5 w-5 text-blue-600" />{ui.generatedTitle} <span className="text-xs text-slate-500">{ui.lengthPrefix} {password.length} {ui.charsUnit}</span></h2><button type="button" onClick={() => setMasked(!masked)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">{masked ? <EyeOff /> : <Eye />}</button></div>
                            <div dir="ltr" className="flex min-h-24 items-center rounded-xl bg-slate-50 p-5 font-sans text-xl font-semibold tracking-wider shadow-inner dark:bg-[#0d1117]">{masked ? '•'.repeat(password.length) : password.split('').map((char, index) => <span key={`${char}-${index}`} className={/[A-Z]/.test(char) ? 'text-blue-600' : /[a-z]/.test(char) ? 'text-slate-800 dark:text-slate-200' : /[0-9]/.test(char) ? 'text-orange-600' : 'text-emerald-600'}>{char}</span>)}</div>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500"><Legend color="bg-blue-600" text={ui.legendUpper} /><Legend color="bg-slate-800" text={ui.legendLower} /><Legend color="bg-orange-600" text={ui.legendNumbers} /><Legend color="bg-emerald-600" text={ui.legendSymbols} /></div>
                            <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={regenerate} className="h-12 flex-1 bg-blue-600 text-base hover:bg-blue-700"><RefreshCw className="h-5 w-5" />{ui.regenerate}</Button><Button type="button" variant="outline" onClick={() => copy()} className="h-12 sm:px-6"><Copy className="h-5 w-5" />{copied ? ui.copied : ui.copyToClipboard}</Button></div>
                            <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-[#0d1117]"><div className="flex items-center justify-between text-sm"><span className="font-semibold">{ui.bruteForceLabel} <strong className={strength.color}>{strengthInfo.label}</strong></span><span className="font-sans text-slate-500">{metrics.score * 25}%</span></div><div className="flex h-2 gap-1 overflow-hidden rounded-full bg-white p-0.5">{[1, 2, 3, 4].map((bar) => <span key={bar} className={`h-full flex-1 rounded-full ${bar <= metrics.score ? strength.bar : 'bg-slate-200'}`} />)}</div><div className="flex justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Shield className="h-4 w-4 text-emerald-600" />{ui.resistantNote}</span><span>{ui.shaResistant}</span></div></div>
                            <div className="space-y-2"><div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span className="flex items-center gap-1"><History className="h-4 w-4" />{ui.historyTitle}</span><button type="button" onClick={() => { setHistory([]); window.sessionStorage.removeItem(STORAGE_KEY); }} className="flex items-center gap-1 text-xs text-red-600"><Trash2 className="h-3.5 w-3.5" />{ui.clearHistory}</button></div>{history.length ? history.map((item) => <div key={item} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-[#0d1117]"><span dir="ltr" className="truncate font-sans text-sm text-slate-600">{item}</span><button type="button" onClick={() => copy(item)} className="p-1 text-slate-500"><Copy className="h-4 w-4" /></button></div>) : <span className="text-xs text-slate-500">{ui.noHistory}</span>}</div>
                        </Card>
                        <Card className="space-y-4 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><h2 className="flex items-center gap-2 text-lg font-semibold"><Database className="h-5 w-5 text-blue-600" />{ui.bulkTitle}</h2><div className="relative"><textarea value={bulk} onChange={(event) => setBulk(event.target.value)} rows={5} dir="ltr" readOnly className="w-full resize-none rounded-lg bg-slate-50 p-4 font-sans text-sm outline-none dark:bg-[#0d1117]" placeholder={ui.bulkPlaceholder} /><div className="mt-2 flex gap-2"><Button type="button" size="sm" onClick={runBulk}><Zap className="h-4 w-4" />{ui.bulkGenerate}</Button><Button type="button" size="sm" variant="outline" onClick={() => copy(bulk)}><Copy className="h-4 w-4" />{ui.bulkCopyAll}</Button><Button type="button" size="sm" variant="outline" onClick={() => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([bulk], { type: 'text/plain' })); link.download = 'zebracode-passwords.txt'; link.click(); }}> <Download className="h-4 w-4" />{ui.bulkDownload}</Button></div></div></Card>
                    </div>

                    <Card className="space-y-5 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26] lg:col-span-5">
                        <div className="flex rounded-lg bg-slate-100 p-1 text-xs dark:bg-[#0d1117]">{(['password', 'passphrase', 'pin'] as Mode[]).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 rounded-md px-2 py-2 font-semibold ${mode === item ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1e1f26] dark:text-white' : 'text-slate-500'}`}>{labelForMode[item]}</button>)}</div>
                        {mode === 'password' && <div className="space-y-5"><Range label={ui.lengthTitle} value={length} min={6} max={128} onChange={setLength} suffix={ui.charsUnit} /><Divider /><OptionGroup title={ui.charsetsTitle} options={charsetOptions} values={options} toggle={setOption} /><Divider /><OptionGroup title={ui.filtersTitle} options={filterOptions} values={options} toggle={setOption} detailed /></div>}
                        {mode === 'passphrase' && <div className="space-y-5"><Range label={ui.wordsTitle} value={wordsCount} min={3} max={8} onChange={setWordsCount} suffix={ui.wordsUnit} /><label className="block text-sm font-semibold">{ui.separatorLabel}<select value={separator} onChange={(event) => setSeparator(event.target.value)} className="mt-2 h-10 w-full rounded-lg bg-slate-100 px-3 dark:bg-[#0d1117]">{separatorValues.map((value, index) => <option key={value} value={value}>{ui.separators[index]}</option>)}</select></label><CheckOption checked={capitalizeWords} onChange={() => setCapitalizeWords(!capitalizeWords)} text={ui.capitalize} /><CheckOption checked={addNumber} onChange={() => setAddNumber(!addNumber)} text={ui.addNumber} /></div>}
                        {mode === 'pin' && <div className="space-y-5"><Range label={ui.pinTitle} value={pinLength} min={4} max={16} onChange={setPinLength} suffix={ui.digitsUnit} /><CheckOption checked={uniquePin} onChange={() => setUniquePin(!uniquePin)} text={ui.uniqueDigits} /></div>}
                        <button type="button" onClick={reset} className="w-full pt-2 text-center text-sm text-slate-500 hover:text-blue-600">{ui.reset}</button>
                    </Card>
                </div>

                <Card className="space-y-6 border-0 bg-white p-6 shadow-sm dark:bg-[#161b26]"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div><span className="text-xs font-bold uppercase tracking-wider text-blue-600">{ui.securityLabel}</span><h2 className="mt-1 text-xl font-bold">{ui.securityTitle}</h2></div><div className="flex gap-2 text-xs"><Badge text={ui.securityBadges[0]} green /><Badge text={ui.securityBadges[1]} /></div></div><div className="grid gap-4 md:grid-cols-3">{ui.security.map((item, index) => <SecurityCard key={item.title} icon={[<MemoryStick key="mem" />, <CloudOff key="cloud" />, <ShieldCheck key="shield" />][index]} title={item.title} text={item.text} />)}</div></Card>

                <section className="mx-auto max-w-4xl space-y-5 pb-8"><div className="text-center"><span className="text-xs font-bold uppercase text-blue-600">{ui.faqLabel}</span><h2 className="mt-1 text-2xl font-bold">{ui.faqTitle}</h2></div>{ui.faqs.map((faq) => <details key={faq.question} className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#161b26]"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{faq.question}<ChevronDown className="h-5 w-5 text-slate-500" /></summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{faq.answer}</p></details>)}</section>
            </div>
            {toast && <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-xl"><Check className="h-5 w-5 text-emerald-400" />{toast}</div>}
        </div>
    );
}

function Badge({ text, icon, green = false }: { text: string; icon?: React.ReactNode; green?: boolean }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${green ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{icon}{text}</span>; }
function Metric({ label, value, green = false }: { label: string; value: string; green?: boolean }) { return <div className="flex min-w-20 flex-col items-center px-2 text-center"><span className="text-[10px] text-slate-500">{label}</span><strong className={`font-sans text-xs ${green ? 'text-emerald-600' : 'text-blue-600'}`}>{value}</strong></div>; }
function Legend({ color, text }: { color: string; text: string }) { return <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${color}`} />{text}</span>; }
function Divider() { return <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />; }
function Range({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) { return <div><div className="flex items-center justify-between text-sm font-semibold"><label>{label}</label><span className="rounded-lg bg-slate-100 px-2 py-1 font-sans text-blue-600 dark:bg-[#0d1117]">{value} {suffix}</span></div><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-4 w-full accent-blue-600" /><div className="flex justify-between text-xs text-slate-500"><span>{min}</span><span>{max}</span></div></div>; }
function OptionGroup({ title, options, values, toggle, detailed = false }: { title: string; options: [ToggleKey, string, string][]; values: Record<ToggleKey, boolean>; toggle: (key: ToggleKey) => void; detailed?: boolean }) { return <div className="space-y-2"><h3 className="text-sm font-semibold">{title}</h3>{options.map(([key, label, hint]) => <label key={key} className="flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-[#0d1117]"><span className="flex gap-2"><input type="checkbox" checked={values[key]} onChange={() => toggle(key)} className="mt-1 accent-blue-600" /><span><span className="block text-sm">{label}</span>{detailed && <small className="block pt-1 text-xs text-slate-500">{hint}</small>}</span></span>{!detailed && <code className="rounded bg-white px-2 py-0.5 text-xs text-blue-600 dark:bg-[#161b26]">{hint}</code>}</label>)}</div>; }
function CheckOption({ checked, onChange, text }: { checked: boolean; onChange: () => void; text: string }) { return <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-[#0d1117]"><input type="checkbox" checked={checked} onChange={onChange} className="accent-blue-600" />{text}</label>; }
function SecurityCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-xl bg-slate-50 p-5 dark:bg-[#0d1117]"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p></div>; }
