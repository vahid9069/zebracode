'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlignLeft,
    Check,
    Code2,
    Copy,
    Download,
    Eye,
    FileText,
    Maximize2,
    List as ListIcon,
    Minus,
    MoreHorizontal,
    Palette,
    PenLine,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Trash2,
    Type,
    Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Language = 'fa' | 'latin' | 'poem';
type Unit = 'paras' | 'sentences' | 'words' | 'lists';
type LengthMode = 'short' | 'medium' | 'long';

const banks: Record<Language, string[]> = {
    fa: ['لورم ایپسوم', 'متن ساختگی', 'با تولید سادگی', 'نامفهوم از صنعت چاپ', 'و با استفاده از', 'طراحان گرافیک', 'چاپگرها و متون', 'بلکه روزنامه و مجله', 'در ستون و سطر', 'آنچنان که لازم است', 'برای شرایط فعلی', 'تکنولوژی مورد نیاز', 'و کاربردهای متنوع', 'با هدف بهبود', 'ابزارهای کاربردی', 'می‌باشد کتابهای زیادی', 'در شصت و سه درصد', 'گذشته حال و آینده', 'شناخت فراوان', 'جامعه و متخصصان', 'راهکارها و شرایط', 'سخت تایپ به پایان رسد', 'زمان مورد نیاز', 'برای طراحان رایانه'],
    latin: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'proident', 'sunt', 'culpa', 'officia', 'deserunt', 'mollit', 'anim', 'laborum'],
    poem: ['ای نسیم سحر آرامگه یار کجاست', 'منزل آن مه عاشق‌کش عیار کجاست', 'شب تار است و ره وادی ایمن در پیش', 'آتش طور کجا موعد دیدار کجاست', 'هر که آمد به جهان نقش خرابی دارد', 'در خرابات بگویید که هشیار کجاست', 'آن کس است اهل بشارت که اشارت داند', 'نکته‌ها هست بسی محرم اسرار کجاست', 'ساقی و مطرب و می جمله مهیاست ولی', 'عیش بی یار مهیا نشود یار کجاست', 'حافظ از باد خزان در چمن دهر مرنج', 'فکر معقول بفرما گل بی خار کجاست'],
};

const limits: Record<Unit, number> = { paras: 20, sentences: 50, words: 200, lists: 20 };

export interface LoremGeneratorProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function LoremGenerator({ locale = 'fa', dict }: LoremGeneratorProps) {
    const ui = dict?.loremUi || fallbackUi[locale];
    const [language, setLanguage] = useState<Language>('fa');
    const [unit, setUnit] = useState<Unit>('paras');
    const [count, setCount] = useState(4);
    const [lengthMode, setLengthMode] = useState<LengthMode>('medium');
    const [wrapHtml, setWrapHtml] = useState(false);
    const [startWithLorem, setStartWithLorem] = useState(true);
    const [includeHeadings, setIncludeHeadings] = useState(false);
    const [view, setView] = useState<'rich' | 'raw'>('rich');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const isRTL = language === 'fa' || language === 'poem';
    const wordRange = useMemo(
        () => lengthMode === 'short' ? [5, 8] : lengthMode === 'long' ? [14, 22] : [9, 15],
        [lengthMode],
    );

    const random = (items: string[]) => items[Math.floor(Math.random() * items.length)];
    const sentence = useCallback(() => {
        const words = banks[language];
        const size = language === 'poem' ? 1 : Math.floor(Math.random() * (wordRange[1] - wordRange[0] + 1)) + wordRange[0];
        const value = Array.from({ length: size }, () => random(words)).join(language === 'poem' ? '\n' : ' ');
        if (language === 'poem') return value;
        return `${value.charAt(0).toUpperCase()}${value.slice(1)}${language === 'fa' ? ' .' : '.'}`;
    }, [language, wordRange]);

    const generate = useCallback(() => {
        let result = '';
        if (unit === 'words') {
            result = Array.from({ length: count }, () => random(banks[language])).join(' ');
        } else if (unit === 'sentences') {
            result = Array.from({ length: count }, sentence).join(' ');
        } else if (unit === 'lists') {
            result = Array.from({ length: count }, sentence).map((item) => `• ${item}`).join('\n');
        } else {
            const paragraphs = Array.from({ length: count }, (_, index) => {
                const sentences = Array.from({ length: lengthMode === 'short' ? 3 : lengthMode === 'long' ? 7 : 5 }, sentence).join(' ');
                const heading = includeHeadings ? `${language === 'fa' ? 'عنوان بخش' : 'Section heading'} ${index + 1}\n` : '';
                return `${heading}${sentences}`;
            });
            result = paragraphs.join('\n\n');
        }
        if (startWithLorem && result) {
            const opening = language === 'latin'
                ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                : language === 'poem'
                    ? 'لورم ایپسوم در دیوان شعر و سروده‌های کهن پارسی:'
                    : 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ.';
            if (!result.startsWith(opening)) result = `${opening}\n\n${result}`;
        }
        setOutput(result.trim());
        setCopied(false);
    }, [count, includeHeadings, language, lengthMode, sentence, startWithLorem, unit]);

    useEffect(() => { generate(); }, [generate]);

    const htmlOutput = useMemo(() => {
        if (!output) return '';
        if (unit === 'lists') return `<ul>\n${output.split('\n').map((item) => `  <li>${item.replace(/^•\s*/, '')}</li>`).join('\n')}\n</ul>`;
        return output.split(/\n\n+/).map((paragraph) => {
            const lines = paragraph.split('\n');
            const heading = lines[0].match(/^(عنوان بخش|Section heading)\s+\d+$/) ? `<h3>${lines.shift()}</h3>` : '';
            return `${heading}<p>${lines.join('<br />')}</p>`;
        }).join('\n');
    }, [output, unit]);

    const copyOutput = async () => {
        await navigator.clipboard.writeText(wrapHtml ? htmlOutput : output);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const downloadOutput = () => {
        const blob = new Blob([wrapHtml ? htmlOutput : output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = wrapHtml ? 'lorem-output.html' : 'lorem-output.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setLanguage('fa'); setUnit('paras'); setCount(4); setLengthMode('medium');
        setWrapHtml(false); setStartWithLorem(true); setIncludeHeadings(false); setView('rich');
    };
    const transformOutput = (kind: 'trim' | 'zwnj' | 'upper' | 'clear') => {
        if (kind === 'clear') return setOutput('');
        if (kind === 'trim') return setOutput(output.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim());
        if (kind === 'zwnj') return setOutput(output.replace(/\s+/g, ' '));
        setOutput(output.toUpperCase());
    };
    const stats = { words: output ? output.trim().split(/\s+/).length : 0, chars: output.length, paragraphs: output ? output.split(/\n\n+/).length : 0 };
    const labels = ui.units as Record<Unit, string>;

    const content = (
        <div className={`lorem-theme min-h-screen bg-[#f8fafc] px-4 py-6 text-[#0f172a] dark:bg-[#0b0f19] dark:text-[#e3e1ec] md:px-8 md:py-10 ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-500 dark:bg-[#0d1117] dark:text-[#94a3b8]">
                    <div className="flex items-center gap-2">
                        <a href={locale === 'en' ? '/en' : '/'} className="transition hover:text-blue-600">{ui.home}</a>
                        <span>/</span><span>{ui.tools}</span><span>/</span><span className="font-semibold text-slate-700 dark:text-white">{ui.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-emerald-700 shadow-sm dark:bg-[#161b26] dark:text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />{ui.localProcessing}</span>
                        <span className="hidden items-center gap-1 font-mono sm:flex"><Zap className="h-3.5 w-3.5 text-amber-500" />0 ms Latency</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><FileText className="h-6 w-6" /></div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold md:text-2xl">{ui.title}</h1>
                                <Badge>{ui.multilingual}</Badge><Badge tone="green">{ui.typography}</Badge>
                            </div>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-[#94a3b8]">{ui.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={copyOutput}><Copy className="h-4 w-4" />{ui.quickCopy}</Button>
                        <Button type="button" onClick={generate}><RefreshCw className="h-4 w-4" />{ui.regenerate}</Button>
                    </div>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-12">
                    <Card className="space-y-6 border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26] lg:col-span-5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#273043]">
                            <h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal className="h-5 w-5 text-blue-600" />{ui.settings}</h2>
                            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-blue-600"><RotateCcw className="h-3.5 w-3.5" />{ui.defaults}</button>
                        </div>
                        <FieldLabel>{ui.language}</FieldLabel>
                        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-[#0d1117]">
                            {(['fa', 'latin', 'poem'] as Language[]).map((item) => <button type="button" key={item} onClick={() => setLanguage(item)} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${language === item ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e1f26] dark:text-[#b4c5ff]' : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'}`}>{ui.languages[item]}</button>)}
                        </div>
                        <div><FieldLabel>{ui.unit}</FieldLabel><div className="grid grid-cols-4 gap-2">
                            {([['paras', AlignLeft], ['sentences', Type], ['words', MoreHorizontal], ['lists', ListIcon]] as [Unit, React.ComponentType<{ className?: string }>][])
                                .map(([item, Icon]) => <button type="button" key={item} onClick={() => { setUnit(item); setCount(Math.min(count, limits[item])); }} className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition ${unit === item ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#0d1117] dark:text-[#94a3b8] dark:hover:bg-[#1e1f26]'}`}><Icon className="h-5 w-5" />{labels[item]}</button>)}
                        </div></div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0d1117]">
                            <div className="flex items-center justify-between"><FieldLabel>{ui.count}</FieldLabel><span className="rounded-lg bg-white px-3 py-1 font-mono text-sm shadow-sm dark:bg-[#1e1f26]">{count}</span></div>
                            <input type="range" min={unit === 'words' ? 10 : 1} max={limits[unit]} value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-4 w-full accent-blue-600" />
                        </div>
                        <div><FieldLabel>{ui.length}</FieldLabel><div className="grid grid-cols-3 gap-2">{(['short', 'medium', 'long'] as LengthMode[]).map((item) => <button type="button" key={item} onClick={() => setLengthMode(item)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${lengthMode === item ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-[#b4c5ff]' : 'border-slate-200 text-slate-600 dark:border-[#273043] dark:text-[#94a3b8]'}`}>{ui.lengths[item]}</button>)}</div></div>
                        <div className="space-y-2">
                            <Toggle checked={wrapHtml} onChange={setWrapHtml} icon={Code2} label={ui.html} description={ui.htmlDescription} />
                            <Toggle checked={startWithLorem} onChange={setStartWithLorem} icon={Sparkles} label={ui.start} description={ui.startDescription} />
                            <Toggle checked={includeHeadings} onChange={setIncludeHeadings} icon={Type} label={ui.headings} description={ui.headingsDescription} />
                        </div>
                        <Button type="button" onClick={generate} className="h-12 w-full bg-blue-600 font-bold hover:bg-blue-700"><Sparkles className="h-5 w-5" />{ui.generate}</Button>
                    </Card>

                    <div className="flex flex-col gap-5 lg:col-span-7">
                        <Card className="border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-[#0d1117]">
                                    <button type="button" onClick={() => setView('rich')} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === 'rich' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e1f26]' : 'text-slate-500 dark:text-[#94a3b8]'}`}><Eye className="h-4 w-4" />{ui.richView}</button>
                                    <button type="button" onClick={() => setView('raw')} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${view === 'raw' ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e1f26]' : 'text-slate-500 dark:text-[#94a3b8]'}`}><Code2 className="h-4 w-4" />{ui.rawView}</button>
                                </div>
                                <div className="flex gap-2"><Button type="button" size="sm" onClick={copyOutput}><Copy className="h-4 w-4" />{copied ? ui.copied : ui.copy}</Button><Button type="button" size="icon" variant="outline" onClick={downloadOutput} aria-label={ui.download}><Download className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)} aria-label={ui.fullscreen}><Maximize2 className="h-4 w-4" /></Button></div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 dark:bg-[#0d1117] sm:grid-cols-4">
                                <Stat label={ui.words} value={stats.words} /><Stat label={ui.characters} value={stats.chars} /><Stat label={ui.paragraphs} value={stats.paragraphs} /><Stat label={ui.readingTime} value={`~ ${Math.max(1, Math.ceil(stats.words / 220))} ${ui.minute}`} />
                            </div>
                            {view === 'rich' ? <div dir={isRTL ? 'rtl' : 'ltr'} className="mt-4 h-[420px] overflow-y-auto rounded-xl bg-slate-50 p-6 text-base leading-8 text-slate-800 shadow-inner dark:bg-[#0d1117] dark:text-[#e3e1ec]">{output ? output.split(/\n\n+/).map((paragraph, index) => { const lines = paragraph.split('\n'); const heading = lines[0].match(/^(عنوان بخش|Section heading)\s+\d+$/) ? lines.shift() : null; return <React.Fragment key={`${paragraph}-${index}`}>{heading && <h3 className="mb-2 mt-4 text-lg font-bold">{heading}</h3>}<p className="mb-3 whitespace-pre-wrap">{lines.join('\n')}</p></React.Fragment>; }) : ui.empty}</div> : <textarea readOnly value={wrapHtml ? htmlOutput : output} dir="ltr" className="mt-4 h-[420px] w-full resize-none rounded-xl bg-slate-900 p-6 font-mono text-sm leading-7 text-slate-200 outline-none" />}
                        </Card>
                        <Card className="border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26]">
                            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><PenLine className="h-4 w-4 text-indigo-500" />{ui.utilities}</h3><span className="text-xs text-slate-500">{ui.applyToOutput}</span></div>
                            <div className="mt-4 flex flex-wrap gap-2"><Utility icon={Minus} text={ui.trim} onClick={() => transformOutput('trim')} /><Utility icon={Type} text={ui.zwnj} onClick={() => transformOutput('zwnj')} /><Utility icon={MoreHorizontal} text={ui.uppercase} onClick={() => transformOutput('upper')} /><Utility danger icon={Trash2} text={ui.clear} onClick={() => transformOutput('clear')} /></div>
                        </Card>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <InfoCard icon={Eye} title={ui.guide[0].title} description={ui.guide[0].description} />
                    <InfoCard icon={Palette} title={ui.guide[1].title} description={ui.guide[1].description} />
                    <InfoCard icon={Code2} title={ui.guide[2].title} description={ui.guide[2].description} />
                </div>
                <Card className="border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26]"><h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-blue-600" />{ui.faqTitle}</h2><div className="mt-4 space-y-2">{ui.faqs.map((faq: { question: string; answer: string }) => <details key={faq.question} className="rounded-lg bg-slate-50 p-4 dark:bg-[#0d1117]"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#94a3b8]">{faq.answer}</p></details>)}</div></Card>
            </div>
        </div>
    );

    return isFullscreen ? <>{content}<button type="button" onClick={() => setIsFullscreen(false)} className="fixed right-5 top-5 z-[60] rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-slate-900">{ui.closeFullscreen}</button></> : content;
}

function FieldLabel({ children }: { children: React.ReactNode }) { return <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-[#cbd5e1]">{children}</label>; }
function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'}`}>{children}</span>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="text-center"><span className="block text-[10px] text-slate-500 dark:text-[#64748b]">{label}</span><strong className="text-sm text-blue-600 dark:text-[#b4c5ff]">{value}</strong></div>; }
function Toggle({ checked, onChange, icon: Icon, label, description }: { checked: boolean; onChange: (value: boolean) => void; icon: React.ComponentType<{ className?: string }>; label: string; description: string }) { return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-[#0d1117]"><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-blue-600" /><span><span className="block text-sm font-medium">{label}</span><span className="block text-[10px] text-slate-500 dark:text-[#64748b]">{description}</span></span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>; }
function Utility({ icon: Icon, text, onClick, danger = false }: { icon: React.ComponentType<{ className?: string }>; text: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition ${danger ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#0d1117] dark:text-[#cbd5e1] dark:hover:bg-[#1e1f26]'}`}><Icon className="h-4 w-4" />{text}</button>; }
function InfoCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) { return <Card className="border-slate-200 bg-white p-5 shadow-sm dark:border-[#273043] dark:bg-[#161b26]"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-[#b4c5ff]"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-[#94a3b8]">{description}</p></Card>; }

const fallbackUi = {
    fa: {
        title: 'تولیدکننده لورم ایپسوم و متن ساختگی', home: 'خانه', tools: 'ابزارها', localProcessing: 'پردازش ۱۰۰٪ محلی', fullscreen: 'نمای تمام‌صفحه', closeFullscreen: 'بستن تمام‌صفحه', description: 'ایجاد محتوای ساختگی استاندارد برای طراحی، پروتوتایپ و تست صفحه‌آرایی با پشتیبانی از فارسی و لاتین.', multilingual: 'چندزبانه + تگ HTML', typography: 'تایپوگرافی استاندارد', quickCopy: 'کپی سریع', regenerate: 'تولید مجدد', settings: 'تنظیمات تولید متن', defaults: 'پیش‌فرض', language: 'زبان و نوع نوشتار', unit: 'واحد خروجی متن', count: 'تعداد خروجی', length: 'طول متن', generate: 'تولید متن تازه', html: 'پوشش با تگ‌های HTML', htmlDescription: 'افزودن تگ‌های p و li به محتوا', start: 'شروع با لورم ایپسوم', startDescription: 'آغاز استاندارد متن', headings: 'درج تیترهای میانی', headingsDescription: 'افزودن عنوان میان پاراگراف‌ها', richView: 'پیش‌نمایش بصری', rawView: 'کد سورس HTML', copy: 'کپی خروجی', copied: 'کپی شد', download: 'دانلود خروجی', words: 'تعداد کلمات', characters: 'تعداد حروف', paragraphs: 'پاراگراف‌ها', readingTime: 'زمان مطالعه', minute: 'دقیقه', empty: 'برای تولید متن دکمه را بزنید', utilities: 'ابزارهای دستکاری سریع متن', applyToOutput: 'اعمال مستقیم بر خروجی', trim: 'حذف فاصله‌های اضافه', zwnj: 'اصلاح فاصله‌ها', uppercase: 'UPPERCASE', clear: 'پاکسازی کامل', languages: { fa: 'فارسی مدرن', latin: 'Latin Dolor', poem: 'متن کلاسیک' }, units: { paras: 'پاراگراف', sentences: 'جمله', words: 'کلمه', lists: 'لیست' }, lengths: { short: 'کوتاه', medium: 'متوسط', long: 'بلند' }, guide: [{ title: 'چرا لورم فارسی؟', description: 'متن فارسی برای سنجش دقیق وزن بصری، شکست خطوط و تراکم رابط کاربری ضروری است.' }, { title: 'آزمون تایپوگرافی', description: 'پاراگراف‌های متغیر به ارزیابی فاصله‌ها و خوانایی فونت کمک می‌کنند.' }, { title: 'تگ‌های معنایی', description: 'خروجی HTML برای پرکردن سریع بلاک‌ها و لیست‌های تستی آماده است.' }], faqTitle: 'پرسش‌های پرتکرار', faqs: [{ question: 'لورم ایپسوم چه کاربردی دارد؟', answer: 'برای بررسی طراحی و چیدمان پیش از آماده‌شدن متن واقعی استفاده می‌شود.' }, { question: 'آیا تولید متن محلی است؟', answer: 'بله، تمام تولید در مرورگر انجام می‌شود و داده‌ای ارسال نمی‌گردد.' }, { question: 'چه نوع خروجی‌هایی می‌توانم تولید کنم؟', answer: 'می‌توانید متن را به‌صورت پاراگراف، جمله، کلمه یا لیست و با طول دلخواه تولید کنید.' }] },
    en: {
        title: 'Lorem Ipsum and Dummy Text Generator', home: 'Home', tools: 'Tools', localProcessing: '100% local processing', fullscreen: 'Fullscreen preview', closeFullscreen: 'Close fullscreen', description: 'Create standard placeholder content for designs, prototypes, and layout testing in Persian and Latin.', multilingual: 'Multilingual + HTML tags', typography: 'Typography ready', quickCopy: 'Quick copy', regenerate: 'Regenerate', settings: 'Text generation settings', defaults: 'Defaults', language: 'Language and style', unit: 'Output unit', count: 'Output count', length: 'Text length', generate: 'Generate fresh text', html: 'Wrap with HTML tags', htmlDescription: 'Add p and li tags to the output', start: 'Start with Lorem Ipsum', startDescription: 'Use a standard opening phrase', headings: 'Insert headings', headingsDescription: 'Add headings between paragraphs', richView: 'Visual preview', rawView: 'HTML source', copy: 'Copy output', copied: 'Copied', download: 'Download output', words: 'Words', characters: 'Characters', paragraphs: 'Paragraphs', readingTime: 'Reading time', minute: 'min', empty: 'Generate text to see the preview', utilities: 'Quick text utilities', applyToOutput: 'Apply directly to output', trim: 'Trim extra spaces', zwnj: 'Normalize spaces', uppercase: 'UPPERCASE', clear: 'Clear all', languages: { fa: 'Modern Persian', latin: 'Latin Dolor', poem: 'Classic text' }, units: { paras: 'Paragraphs', sentences: 'Sentences', words: 'Words', lists: 'Lists' }, lengths: { short: 'Short', medium: 'Medium', long: 'Long' }, guide: [{ title: 'Why Persian Lorem?', description: 'Persian text is essential for checking visual weight, line breaks, and UI density.' }, { title: 'Typography testing', description: 'Variable paragraphs help evaluate spacing and font readability.' }, { title: 'Semantic tags', description: 'HTML output is ready to fill test blocks and lists.' }], faqTitle: 'Frequently asked questions', faqs: [{ question: 'What is Lorem Ipsum used for?', answer: 'It helps preview design and layout before final copy is available.' }, { question: 'Is text generated locally?', answer: 'Yes. Everything runs in your browser and no data is uploaded.' }, { question: 'What output formats can I generate?', answer: 'Generate paragraphs, sentences, words, or lists with a length and count that fit your layout.' }] },
};
