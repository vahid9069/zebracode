'use client';

import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Code2,
    GitBranch,
    Github,
    Heart,
    History,
    LockKeyhole,
    Rocket,
    ShieldCheck,
    Sparkles,
    Terminal,
    Users,
    WifiOff,
    Zap,
} from 'lucide-react';

interface AboutViewProps {
    dict: any;
}

const icons = {
    instant: Zap,
    privacy: ShieldCheck,
    opensource: Github,
    developers: Users,
    range: Code2,
    community: Heart,
};

export default function AboutView({ dict }: AboutViewProps) {
    const d = dict;
    const features = d.features || [];
    const metrics = d.metrics || [];
    const pillars = d.pillars || [];
    const comparison = d.comparison || {};
    const faqs = d.faqs || [];

    return (
        <div className="about-theme min-h-screen bg-[#0b0f19] text-[#e3e1ec] transition-colors">
            <main>
                <section className="relative overflow-hidden border-b border-[#273043] bg-gradient-to-b from-[#0d1117] via-[#0e1422] to-[#0b0f19]">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
                    <div className="pointer-events-none absolute left-10 top-48 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 md:px-8 md:pb-20">
                        <nav className="mb-8 flex items-center gap-2 text-sm text-[#64748b]" aria-label={d.breadcrumbLabel}>
                            <Link href="/" className="flex items-center gap-1 transition hover:text-[#b4c5ff]">
                                <Terminal className="h-4 w-4" />
                                {d.homeLabel}
                            </Link>
                            <ArrowLeft className="h-3.5 w-3.5 rtl:hidden" />
                            <ArrowRight className="hidden h-3.5 w-3.5 rtl:block" />
                            <span className="text-[#e3e1ec]">{d.aboutLabel}</span>
                        </nav>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#273043] bg-[#161b26] px-4 py-1.5 text-sm text-[#94a3b8]">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
                            <span>{d.missionBadge}</span>
                            <span className="text-[#64748b]">•</span>
                            <span className="font-mono text-xs">Story &amp; Mission</span>
                        </div>
                        <div className="mt-6 max-w-4xl">
                            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                                {d.heroTitle}
                                <span className="bg-gradient-to-l from-[#b4c5ff] via-[#4f8cff] to-[#4edea3] bg-clip-text text-transparent"> {d.heroAccent}</span>
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-[#94a3b8] md:text-lg">{d.heroDescription}</p>
                        </div>
                        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {metrics.map((metric: any) => (
                                <div key={metric.id} className="group rounded-xl border border-[#273043] bg-[#161b26] p-5 transition hover:-translate-y-1 hover:bg-[#1e1f26]">
                                    <div className="flex items-center justify-between">
                                        <MetricIcon id={metric.id} />
                                        <span className="rounded border border-[#273043] bg-[#1e1f26] px-2 py-0.5 font-mono text-[10px] text-[#94a3b8]">{metric.badge}</span>
                                    </div>
                                    <div className="mt-5 font-mono text-3xl font-bold tracking-tight text-white" dir="ltr">{metric.value}</div>
                                    <div className="mt-1 font-semibold text-white">{metric.title}</div>
                                    <p className="mt-1 text-sm leading-6 text-[#94a3b8]">{metric.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
                    <div className="grid items-stretch gap-10 lg:grid-cols-12">
                        <div className="flex flex-col justify-between lg:col-span-7">
                            <div>
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#b4c5ff]">
                                    <History className="h-4 w-4" />
                                    {d.storyLabel}
                                </div>
                                <h2 className="mt-3 text-2xl font-bold leading-relaxed text-white md:text-3xl">{d.storyTitle}</h2>
                                <div className="mt-6 space-y-4 leading-8 text-[#94a3b8]">
                                    {(d.storyParagraphs || []).map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}
                                </div>
                            </div>
                            <div className="mt-8 rounded-xl border border-[#273043] bg-[#161b26] p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e1f26] text-[#b4c5ff]"><Sparkles className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-lg font-semibold italic leading-8 text-white">«{d.manifesto}»</p>
                                        <p className="mt-2 text-xs text-[#64748b]">{d.manifestoCaption}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ArchitectureCard d={d} />
                    </div>
                </section>

                <section className="border-y border-[#273043] bg-[#0d1117]">
                    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
                        <div className="mb-10 max-w-3xl">
                            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#b4c5ff]"><ShieldCheck className="h-4 w-4" /> {d.pillarsLabel}</div>
                            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{d.pillarsTitle}</h2>
                            <p className="mt-3 leading-7 text-[#94a3b8]">{d.pillarsDescription}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {pillars.map((pillar: any, index: number) => (
                                <div key={pillar.id || index} className="flex flex-col justify-between rounded-xl border border-[#273043] bg-[#161b26] p-6 transition hover:-translate-y-1 hover:border-[#b4c5ff]/50">
                                    <div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1e1f26] text-[#b4c5ff]"><PillarIcon index={index} /></div>
                                        <h3 className="mt-5 text-lg font-semibold text-white">{pillar.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-[#94a3b8]">{pillar.description}</p>
                                    </div>
                                    <div className="mt-6 font-mono text-xs font-semibold text-[#4edea3]" dir="ltr">&gt; {pillar.code}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
                    <div className="mb-10 max-w-3xl">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#b4c5ff]"><GitBranch className="h-4 w-4" /> {d.comparisonLabel}</div>
                        <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{d.comparisonTitle}</h2>
                        <p className="mt-3 leading-7 text-[#94a3b8]">{d.comparisonDescription}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <ComparisonCard title={comparison.legacyTitle} badge={comparison.legacyBadge} description={comparison.legacyDescription} steps={comparison.legacySteps} danger />
                        <ComparisonCard title={comparison.localTitle} badge={comparison.localBadge} description={comparison.localDescription} steps={comparison.localSteps} />
                    </div>
                </section>

                <section className="border-y border-[#273043] bg-[#0d1117]">
                    <div className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
                        <div className="mb-10 text-center">
                            <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#64748b]"><Sparkles className="h-4 w-4" /> {d.faqLabel}</div>
                            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{d.faqTitle}</h2>
                        </div>
                        <div className="space-y-3">
                            {faqs.map((faq: any, index: number) => (
                                <details key={faq.question} open={index === 0} className="group rounded-xl border border-[#273043] bg-[#161b26] p-5">
                                    <summary className="cursor-pointer list-none font-semibold text-white marker:hidden">{faq.question}<span className="float-left text-[#64748b] transition group-open:rotate-180">⌄</span></summary>
                                    <p className="mt-4 leading-8 text-[#94a3b8]">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
                    <div className="relative overflow-hidden rounded-2xl border border-[#273043] bg-gradient-to-b from-[#161b26] to-[#0d1117] p-8 text-center shadow-xl md:p-14">
                        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-[#b4c5ff]"><Rocket className="h-7 w-7" /></div>
                            <h2 className="mt-6 text-2xl font-bold text-white md:text-3xl">{d.ctaTitle}</h2>
                            <p className="mt-3 leading-8 text-[#94a3b8]">{d.ctaDescription}</p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-3 font-semibold text-white transition hover:bg-blue-600"><span>{d.ctaPrimary}</span><ArrowLeft className="h-4 w-4" /></Link>
                                <a href="https://github.com/vahid9069/zebracode" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#273043] bg-[#1e1f26] px-5 py-3 font-semibold text-white transition hover:border-[#b4c5ff]"><Github className="h-4 w-4" /><span>{d.ctaSecondary}</span></a>
                            </div>
                            <div className="mt-7 flex flex-wrap justify-center gap-5 text-xs text-[#94a3b8]">
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-[#4edea3]" />{d.ctaGuarantees.safe}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-[#4edea3]" />{d.ctaGuarantees.free}</span>
                                <span className="flex items-center gap-1"><WifiOff className="h-4 w-4 text-[#4edea3]" />{d.ctaGuarantees.offline}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function MetricIcon({ id }: { id: string }) {
    const Icon = id === 'zero-net' ? WifiOff : id === 'tools' ? Code2 : id === 'latency' ? Zap : ShieldCheck;
    return <Icon className="h-6 w-6 text-[#4edea3]" />;
}

function PillarIcon({ index }: { index: number }) {
    const Icon = [LockKeyhole, Zap, Sparkles, Terminal][index] || Code2;
    return <Icon className="h-6 w-6" />;
}

function ArchitectureCard({ d }: { d: any }) {
    return <div className="flex flex-col justify-center rounded-2xl border border-[#273043] bg-[#161b26] p-6 shadow-lg lg:col-span-5">
        <div className="flex items-center justify-between border-b border-[#273043] pb-4">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" /><span className="ml-2 font-mono text-xs text-[#64748b]">runtime-sandbox.wasm</span></div>
            <span className="rounded bg-[#1e1f26] px-2 py-0.5 font-mono text-[11px] text-[#4edea3]">Sandbox Active</span>
        </div>
        <div className="mt-5 rounded-xl border border-[#273043] bg-[#0d1117] p-5">
            <div className="flex items-center justify-between font-mono text-xs text-[#64748b]"><span className="text-[#b4c5ff]">Browser Memory Heap</span><span className="text-[#4edea3]">100% In-Memory</span></div>
            <div className="my-8 flex items-center justify-between gap-2 font-mono text-[10px] text-center">
                <Node label={d.architecture?.input || 'User Input'} />
                <span className="text-blue-400">━━▶</span>
                <Node label="WASM / V8" active />
                <span className="text-emerald-400">━━▶</span>
                <Node label={d.architecture?.output || 'Result'} />
            </div>
            <div className="border-t border-[#273043] pt-4 text-center font-mono text-xs text-[#4edea3]">{d.architecture?.caption || 'Local isolation · zero egress'}</div>
        </div>
    </div>;
}

function Node({ label, active = false }: { label: string; active?: boolean }) {
    return <div className={`rounded-lg border px-3 py-3 ${active ? 'border-blue-500 bg-blue-950/40 text-[#b4c5ff]' : 'border-[#273043] bg-[#161b26] text-[#94a3b8]'}`}>{label}</div>;
}

function ComparisonCard({ title, badge, description, steps, danger = false }: { title: string; badge: string; description: string; steps: string[]; danger?: boolean }) {
    return <div className="rounded-2xl border border-[#273043] bg-[#161b26] p-6">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${danger ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>{danger ? <ShieldCheck className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div><h3 className="font-semibold text-white">{title}</h3></div><span className={`rounded px-2 py-0.5 font-mono text-[10px] ${danger ? 'bg-red-950/50 text-red-300' : 'bg-emerald-950/50 text-emerald-300'}`}>{badge}</span></div>
        <p className="mt-4 text-sm leading-7 text-[#94a3b8]">{description}</p>
        <div className="mt-5 space-y-3">{(steps || []).map((step, index) => <div key={step} className="flex items-start gap-3 rounded-lg bg-[#1e1f26] p-3 text-sm leading-6"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${danger && index === 1 ? 'bg-red-500/20 text-red-300' : 'bg-[#161b26] text-[#94a3b8]'}`}>{index + 1}</span><span className={danger && index === 1 ? 'text-red-300' : 'text-[#e3e1ec]'}>{step}</span></div>)}</div>
    </div>;
}
