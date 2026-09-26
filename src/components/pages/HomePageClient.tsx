'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    ArrowUpLeft,
    Code2,
    Github,
    Grid2X2,
    List,
    LockKeyhole,
    Search,
    SearchX,
    ShieldCheck,
    Sparkles,
    Star,
    Terminal,
    Zap,
} from 'lucide-react';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
import { BASE_URL } from '@/lib/env';
import type { Dictionary } from '@/i18n/getDictionary';
import { localizeCategory, localizeTool } from '@/i18n/localize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export interface HomePageClientProps {
    dict: Dictionary;
    locale: 'fa' | 'en';
}

const getToolHref = (tool: ToolMeta, locale: 'fa' | 'en') =>
    `${BASE_URL || ''}${locale === 'en' ? `/en${tool.href}` : tool.href}`;

export default function HomePageClient({ dict, locale }: HomePageClientProps) {
    const home = dict.home;
    const searchRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeTag, setActiveTag] = useState('');
    const [activeMode, setActiveMode] = useState<'dev' | 'general' | 'all'>('dev');
    const allTools = useMemo(() => Object.values(AllToolsList), []);
    const focusSearch = useCallback(() => {
        const input = searchRef.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        input.select();
    }, []);

    const categories = useMemo(() => {
        const counts = new Map<string, number>();
        allTools.forEach((tool) => counts.set(tool.category || 'other', (counts.get(tool.category || 'other') || 0) + 1));
        return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [allTools]);

    const filteredTools = useMemo(() => {
        const query = searchTerm.trim().toLowerCase().replace(/→/g, ' ');
        const queryTerms = query.split(/\s+/).filter(Boolean).map((term) => {
            if (term === 'ts') return 'typescript';
            if (term === 'js') return 'javascript';
            if (term === 'gql') return 'graphql';
            return term;
        });
        return allTools.filter((tool) => {
            const localized = localizeTool(tool, dict.tools);
            const categoryMatches = activeCategory === 'all' || tool.category === activeCategory;
            const modeMatches =
                activeMode === 'all' ||
                (activeMode === 'dev' && ['converters', 'encoders', 'generators'].includes(tool.category)) ||
                (activeMode === 'general' && !['converters', 'encoders', 'generators'].includes(tool.category));
            const searchableText = [localized.title, localized.shortDescription, localized.description, tool.category, tool.subCategory, tool.type]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const tagMatches = !activeTag || searchableText.includes(activeTag);
            const searchMatches =
                queryTerms.length === 0 || queryTerms.some((term) => searchableText.includes(term));
            return categoryMatches && modeMatches && tagMatches && searchMatches;
        });
    }, [activeCategory, activeMode, activeTag, allTools, dict.tools, searchTerm]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                event.stopPropagation();
                focusSearch();
            }
        };
        window.addEventListener('keydown', handleShortcut, true);
        return () => window.removeEventListener('keydown', handleShortcut, true);
    }, [focusSearch]);

    const quickSearches = home.quickSearches || [];
    const quickTags = home.quickTags || [];
    const toolCount = allTools.length;
    const modeCounts = {
        dev: allTools.filter((tool) => ['converters', 'encoders', 'generators'].includes(tool.category)).length,
        general: allTools.filter((tool) => !['converters', 'encoders', 'generators'].includes(tool.category)).length,
    };

    return (
        <div className="home-theme min-h-screen overflow-hidden bg-[#0b0f19] text-[#e3e1ec]">
            <section className="relative border-b border-[#273043] bg-gradient-to-b from-[#0d1117] via-[#0e1422] to-[#0b0f19]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-20 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
                    <div className="absolute left-1/4 top-48 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>
                <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-12 pt-16 text-center md:px-8 md:pb-20 md:pt-24">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-800/60 bg-blue-950/40 px-4 py-1.5 text-sm font-semibold text-[#b4c5ff]">
                        <span className="text-amber-400">⚡</span>
                        <span>{home.announcement.replace('{count}', String(toolCount))}</span>
                        <ArrowUpLeft className="h-4 w-4" />
                    </div>
                    <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                        {home.heroHeading}{' '}
                        <span className="bg-gradient-to-l from-[#b4c5ff] via-[#4f8cff] to-[#4edea3] bg-clip-text text-transparent">
                            {home.heroAccent}
                        </span>{' '}
                        {home.heroHeadingSuffix}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-[#94a3b8] md:text-lg">{home.heroDescription}</p>

                    <div className="mt-8 w-full max-w-3xl">
                        <div className="group flex items-center rounded-xl border border-[#334155] bg-[#161b26] p-2 shadow-2xl transition focus-within:border-[#b4c5ff] focus-within:ring-2 focus-within:ring-[#b4c5ff]/20">
                            <Search className="mx-3 h-5 w-5 shrink-0 text-[#64748b] transition group-focus-within:text-[#b4c5ff]" />
                            <Input
                                ref={searchRef}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder={home.searchPlaceholder}
                                className="h-12 border-0 bg-transparent px-0 text-base text-white shadow-none placeholder:text-[#64748b] focus-visible:ring-0"
                                dir={locale === 'fa' ? 'rtl' : 'ltr'}
                            />
                            <button
                                type="button"
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    focusSearch();
                                }}
                                onClick={focusSearch}
                                aria-label={home.focusSearch}
                                className="hidden cursor-pointer rounded border border-[#334155] bg-[#1e1f26] px-2 py-1 font-mono text-xs text-[#94a3b8] transition hover:border-[#b4c5ff] hover:text-[#b4c5ff] sm:block"
                            >
                                ⌘ K
                            </button>
                            <div className="mx-2 hidden h-6 w-px bg-[#273043] sm:block" />
                            <div className="flex rounded-lg border border-[#273043] bg-[#0d1117] p-0.5">
                                <Button type="button" variant="ghost" size="icon" aria-label={home.gridView} onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'h-9 w-9 bg-[#161b26] text-[#b4c5ff] dark:text-white' : 'h-9 w-9 text-[#64748b] dark:text-[#94a3b8]'}>
                                    <Grid2X2 className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" aria-label={home.listView} onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'h-9 w-9 bg-[#161b26] text-[#b4c5ff] dark:text-white' : 'h-9 w-9 text-[#64748b] dark:text-[#94a3b8]'}>
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-[#64748b]">
                            <span className="text-[#94a3b8]">{home.popularSearches}</span>
                            {quickSearches.map((item) => (
                                <button key={item} type="button" onClick={() => { setSearchTerm(item); setActiveTag(''); }} className="rounded-md border border-[#273043] bg-[#161b26] px-3 py-1.5 font-mono text-xs text-[#94a3b8] transition hover:border-[#b4c5ff]/50 hover:text-[#b4c5ff]">
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
                        <Assurance icon={ShieldCheck} color="text-[#4edea3]" text={home.assurances.local} />
                        <Assurance icon={Zap} color="text-[#b4c5ff]" text={home.assurances.fast} />
                        <Assurance icon={Code2} color="text-[#c0c1ff]" text={home.assurances.open} />
                    </div>
                </div>
            </section>

            <main className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8">
                <div className="mt-8 rounded-2xl border border-[#273043] bg-[#161b26] p-2 shadow-sm">
                    <div className="flex flex-col gap-2 rounded-xl border border-[#273043] bg-[#0d1117] p-1.5 lg:flex-row">
                        <div className="flex flex-1 gap-2 overflow-x-auto">
                            <ModeButton active={activeMode === 'dev'} onClick={() => setActiveMode('dev')} icon={<Terminal className="h-4 w-4" />} label={home.devMode} count={modeCounts.dev} />
                            <ModeButton active={activeMode === 'general'} onClick={() => setActiveMode('general')} icon={<Sparkles className="h-4 w-4" />} label={home.generalMode} count={modeCounts.general} />
                            <ModeButton active={activeMode === 'all'} onClick={() => setActiveMode('all')} icon={<Grid2X2 className="h-4 w-4" />} label={home.allMode} count={toolCount} />
                        </div>
                        <div className="hidden items-center gap-2 px-3 text-xs text-[#94a3b8] lg:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />{home.modeHint}</div>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                        <CategoryButton active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label={home.allCategories} count={toolCount} />
                        {categories.map(([category, count]) => (
                            <CategoryButton key={category} active={activeCategory === category} onClick={() => setActiveCategory(category)} label={localizeCategory(dict.categories, category)} count={count} />
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
                    <span>{home.filterByFormat}</span>
                    {quickTags.map((tag) => (
                        <button key={tag} type="button" onClick={() => setActiveTag(activeTag === tag.toLowerCase() ? '' : tag.toLowerCase())} className={`rounded-full border px-3 py-1.5 font-mono transition ${activeTag === tag.toLowerCase() ? 'border-[#b4c5ff] bg-blue-950/50 text-[#b4c5ff]' : 'border-[#273043] bg-[#161b26] hover:border-[#b4c5ff]/50 hover:text-[#b4c5ff]'}`}>{tag}</button>
                    ))}
                </div>

                <div className="mt-10 flex items-end justify-between border-b border-[#273043] pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800/60 bg-blue-950/60 text-[#b4c5ff]"><Terminal className="h-5 w-5" /></div>
                            <h2 className="text-xl font-bold text-white md:text-2xl">{home.toolsHeading}</h2>
                            <span className="rounded-full border border-blue-800/60 bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-[#b4c5ff]">{filteredTools.length}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#94a3b8]">{home.toolsDescription}</p>
                    </div>
                </div>

                {filteredTools.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center rounded-xl border border-[#273043] bg-[#161b26] px-6 py-16 text-center">
                        <SearchX className="mb-4 h-10 w-10 text-[#64748b]" />
                        <h3 className="text-lg font-bold text-white">{home.emptyTitle}</h3>
                        <p className="mt-2 text-sm text-[#94a3b8]">{home.emptyDescription}</p>
                        <Button className="mt-6 bg-[#2563eb] text-white hover:bg-blue-600" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>{home.resetFilters}</Button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'mt-6 grid grid-cols-1 gap-3'}>
                        {filteredTools.map((tool) => <ToolCard key={tool.href} tool={tool} locale={locale} dict={dict} list={viewMode === 'list'} />)}
                    </div>
                )}

                <section className="relative mt-16 overflow-hidden rounded-2xl border border-[#273043] bg-[#161b26] p-6 md:p-10">
                    <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-2">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-800/60 bg-emerald-950/60 px-2.5 py-1 font-mono text-xs text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" /> ZERO_LATENCY_ENGINE</div>
                            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{home.privacyHeading}</h2>
                            <p className="mt-4 leading-8 text-[#94a3b8]">{home.privacyDescription}</p>
                            <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
                                <div className="rounded-xl border border-[#273043] bg-[#0e131d] p-4"><span className="mb-1 block text-[#94a3b8]">{home.firstRun}</span><strong className="text-lg text-[#4edea3]">&lt; 1.8ms</strong></div>
                                <div className="rounded-xl border border-[#273043] bg-[#0e131d] p-4"><span className="mb-1 block text-[#94a3b8]">{home.transmission}</span><strong className="text-lg text-white">0 Bytes / Local</strong></div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs shadow-2xl" dir="ltr">
                            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0d14] px-4 py-3"><span className="text-slate-400">zebracode-client.ts</span><span className="rounded border border-emerald-800/60 bg-emerald-950/60 px-2 py-0.5 text-emerald-400">Client-side</span></div>
                            <pre className="overflow-x-auto p-5 leading-7 text-slate-300"><code><span className="text-slate-500">// Your data stays in your browser</span>{'\n'}<span className="text-pink-400">const</span> result = <span className="text-blue-400">await</span> tool.transform(input);{'\n'}<span className="text-pink-400">return</span> result; <span className="text-slate-500">// instant & secure</span></code></pre>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#273043] bg-[#0d1117]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#273043] bg-[#161b26] text-[#b4c5ff]"><Terminal className="h-4 w-4" /></span><strong>ZebraCode</strong><span className="rounded border border-[#273043] bg-[#161b26] px-1.5 py-0.5 font-mono text-[10px] text-[#94a3b8]">/dev</span></div>
                        <p className="mt-4 max-w-md text-sm leading-7 text-[#94a3b8]">{home.footerDescription}</p>
                        <div className="mt-5 flex gap-2"><a href="https://github.com/vahid9069/zebracode" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-lg border border-[#273043] bg-[#161b26] p-2 text-[#94a3b8] transition hover:text-[#b4c5ff]"><Github className="h-4 w-4" /></a><span className="rounded-lg border border-[#273043] bg-[#161b26] p-2 text-[#94a3b8]"><LockKeyhole className="h-4 w-4" /></span></div>
                    </div>
                    <div><h3 className="font-semibold text-white">{home.footerTools}</h3><p className="mt-3 text-sm leading-7 text-[#94a3b8]">{home.footerToolsDescription}</p></div>
                    <div><h3 className="font-semibold text-white">{home.footerStats}</h3><div className="mt-3 space-y-2 text-sm text-[#94a3b8]"><p className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-400" /> {home.footerFree}</p><p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-400" /> {home.footerPrivate}</p></div></div>
                </div>
                <div className="border-t border-[#273043] px-4 py-5 text-center text-xs text-[#64748b]">{home.footerCopyright}</div>
            </footer>
        </div>
    );
}

function Assurance({ icon: Icon, color, text }: { icon: React.ComponentType<{ className?: string }>; color: string; text: string }) {
    return <div className="flex items-center justify-center gap-2 rounded-lg border border-[#273043] bg-[#161b26] px-4 py-3 text-sm text-[#94a3b8]"><span className={color}><Icon className="h-5 w-5" /></span><span>{text}</span></div>;
}

function CategoryButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
    return <button type="button" onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${active ? 'bg-[#2563eb] text-white shadow-md' : 'text-[#94a3b8] hover:bg-[#161b26] hover:text-white'}`}><span>{label}</span><span className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] ${active ? 'bg-white/20' : 'bg-[#1e1f26] text-[#64748b]'}`}>{count}</span></button>;
}

function ModeButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
    return <button type="button" onClick={onClick} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${active ? 'bg-[#2563eb] text-white shadow-md' : 'text-[#94a3b8] hover:bg-[#161b26] hover:text-white'}`}>{icon}<span>{label}</span><span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${active ? 'bg-white/20' : 'bg-[#1e1f26] text-[#64748b]'}`}>{count}</span></button>;
}

function ToolCard({ tool, locale, dict, list }: { tool: ToolMeta; locale: 'fa' | 'en'; dict: Dictionary; list: boolean }) {
    const localizedTool = localizeTool(tool, dict.tools);
    const Icon = tool.icon;
    return <Card className={`group border-[#273043] bg-[#161b26] text-[#e3e1ec] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#b4c5ff]/60 hover:shadow-lg ${list ? 'rounded-xl' : ''}`}>
        <Link href={getToolHref(tool, locale)} className={`block p-5 ${list ? 'flex items-center gap-4' : ''}`}>
            <div className={`flex items-start justify-between ${list ? 'shrink-0' : 'mb-4'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-800/60 bg-blue-950/60 text-[#b4c5ff]">{renderIcon(Icon, 'h-5 w-5')}</div>
                {!list && <span className="rounded border border-[#273043] bg-[#1e1f26] px-2 py-0.5 font-mono text-[10px] text-[#94a3b8]">{localizeCategory(dict.categories, tool.subCategory || tool.category)}</span>}
            </div>
            <div className={list ? 'min-w-0 flex-1' : ''}>
                <h3 className="font-semibold text-white transition-colors group-hover:text-[#b4c5ff]">{localizedTool.title}</h3>
                <p className={`mt-1 text-sm leading-6 text-[#94a3b8] ${list ? 'truncate' : 'line-clamp-2'}`}>{localizedTool.shortDescription}</p>
                {!list && <div className="mt-4 flex items-center justify-between border-t border-[#273043] pt-3 text-xs text-[#94a3b8]"><span>{localizeCategory(dict.categories, tool.category)}</span><span className="flex items-center gap-1 font-semibold text-[#b4c5ff]">{dict.home.openTool}<ArrowUpLeft className="h-3.5 w-3.5" /></span></div>}
            </div>
            {list && <ArrowUpLeft className="h-4 w-4 shrink-0 text-[#64748b] transition group-hover:text-[#b4c5ff]" />}
        </Link>
    </Card>;
}
