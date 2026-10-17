'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowUpLeft,
    Code2,
    Command,
    Github,
    Grid2X2,
    List,
    LockKeyhole,
    Search,
    SearchX,
    ShieldCheck,
    Star,
    Terminal,
    Zap,
} from 'lucide-react';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
import type { Dictionary } from '@/i18n/getDictionary';
import { localizeCategory, localizeTool } from '@/i18n/localize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createHomeFilters, filterHomeTools, getAvailableHomeModes, getHomeToolHref, matchesHomeMode } from '@/lib/home-catalog';
import { isModKShortcut } from '@/lib/keyboard';
import { matchesCommandSearch, normalizeCommandSearch } from '@/components/layout/commandMenuSearch';

const RECENT_SEARCHES_STORAGE_KEY = 'zebracode-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export interface HomePageClientProps {
    dict: Dictionary;
    locale: 'fa' | 'en';
}

interface HomeSearchResult {
    tool: ToolMeta;
    title: string;
    shortDescription: string;
    category: string;
}

export default function HomePageClient({ dict, locale }: HomePageClientProps) {
    const home = dict.home;
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const searchResultRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState(() => createHomeFilters());
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [recentSearchesLoaded, setRecentSearchesLoaded] = useState(false);
    const { searchTerm, activeCategory, activeTag, activeMode } = filters;
    const allTools = useMemo(() => Object.values(AllToolsList), []);
    const availableModes = useMemo(() => getAvailableHomeModes(allTools), [allTools]);
    const clearAllFilters = useCallback(() => setFilters(createHomeFilters()), []);
    const hasActiveFilters = searchTerm !== '' || activeCategory !== 'all' || activeTag !== '' || activeMode !== 'all';
    const focusSearch = useCallback(() => {
        const input = searchRef.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        input.select();
    }, []);

    const filteredTools = useMemo(() => filterHomeTools(allTools, filters, (tool) => localizeTool(tool, dict.tools)), [allTools, dict.tools, filters]);
    const searchResults = useMemo<HomeSearchResult[]>(() => {
        const query = normalizeCommandSearch(searchTerm);
        if (!query) return [];

        return allTools
            .map((tool) => {
                const localized = localizeTool(tool, dict.tools, tool.type);
                return {
                    tool,
                    title: localized.title,
                    shortDescription: localized.shortDescription,
                    category: localizeCategory(dict.categories, tool.subCategory || tool.category),
                    fields: [
                        localized.title,
                        localized.shortDescription,
                        localized.description,
                        tool.title,
                        tool.shortDescription,
                        tool.description,
                        tool.type,
                        tool.category,
                        tool.subCategory,
                        tool.inputLanguage,
                        tool.outputLanguage,
                        localized.category,
                    ],
                };
            })
            .filter((result) => matchesCommandSearch(result.fields, query))
            .slice(0, 8);
    }, [allTools, dict.categories, dict.tools, searchTerm]);

    const groupedFilteredTools = useMemo(() => {
        const groups = new Map<string, ToolMeta[]>();
        filteredTools.forEach((tool) => {
            const groupKey = tool.subCategory || tool.category || 'other';
            groups.set(groupKey, [...(groups.get(groupKey) || []), tool]);
        });
        return Array.from(groups.entries()).map(([key, tools]) => ({ key, tools }));
    }, [filteredTools]);

    const availableTags = useMemo(() => {
        const modeTools = allTools.filter((tool) => matchesHomeMode(tool, activeMode));
        return (home.quickTags || []).filter((tag) => filterHomeTools(
            modeTools,
            { ...createHomeFilters(), activeTag: tag.toLowerCase() },
            (tool) => localizeTool(tool, dict.tools),
        ).length > 0);
    }, [activeMode, allTools, dict.tools, home.quickTags]);

    const rememberSearch = useCallback((query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;
        setRecentSearches((previous) => [
            trimmedQuery,
            ...previous.filter((item) => item.toLocaleLowerCase() !== trimmedQuery.toLocaleLowerCase()),
        ].slice(0, MAX_RECENT_SEARCHES));
    }, []);

    const applySearch = useCallback((query: string) => {
        setFilters(createHomeFilters(query));
        rememberSearch(query);
        setIsSearchFocused(false);
        setActiveSearchIndex(-1);
    }, [rememberSearch]);

    const selectSearchResult = useCallback((result: HomeSearchResult) => {
        rememberSearch(searchTerm);
        setIsSearchFocused(false);
        setActiveSearchIndex(-1);
        router.push(getHomeToolHref(result.tool, locale));
    }, [locale, rememberSearch, router, searchTerm]);

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && searchResults.length > 0) {
            event.preventDefault();
            setActiveSearchIndex((current) => (current + 1 + searchResults.length) % searchResults.length);
            return;
        }
        if (event.key === 'ArrowUp' && searchResults.length > 0) {
            event.preventDefault();
            setActiveSearchIndex((current) => (current - 1 + searchResults.length) % searchResults.length);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (activeSearchIndex >= 0 && searchResults[activeSearchIndex]) {
                selectSearchResult(searchResults[activeSearchIndex]);
            } else {
                rememberSearch(searchTerm);
                setIsSearchFocused(false);
            }
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            setIsSearchFocused(false);
            setActiveSearchIndex(-1);
        }
    }, [activeSearchIndex, rememberSearch, searchResults, searchTerm, selectSearchResult]);

    useEffect(() => {
        try {
            const storedSearches = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
            if (storedSearches) {
                const parsed = JSON.parse(storedSearches);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES));
                }
            }
        } catch {
            // Ignore malformed or unavailable local storage; search remains usable.
        } finally {
            setRecentSearchesLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (recentSearchesLoaded) {
            window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(recentSearches));
        }
    }, [recentSearches, recentSearchesLoaded]);

    useEffect(() => {
        if (activeSearchIndex >= 0) {
            searchResultRefs.current[activeSearchIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeSearchIndex]);

    const resultAnnouncement = useMemo(() => {
        if (!hasActiveFilters) return '';
        if (filteredTools.length === 0) return home.noResultsAnnouncement;

        const formattedCount = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(filteredTools.length);
        return home.resultsCount.replace('{count}', formattedCount);
    }, [filteredTools.length, hasActiveFilters, home.noResultsAnnouncement, home.resultsCount, locale]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (isModKShortcut(event)) {
                if (document.querySelector('[data-command-menu="true"], [data-mobile-navigation="true"]')) return;
                event.preventDefault();
                event.stopPropagation();
                focusSearch();
            }
        };
        window.addEventListener('keydown', handleShortcut, true);
        return () => window.removeEventListener('keydown', handleShortcut, true);
    }, [focusSearch]);

    const toolCount = allTools.length;
    const toolsHeading = activeMode === 'all' ? home.toolsHeading : localizeCategory(dict.categories, activeMode);
    const currentYear = useMemo(
        () => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }).format(new Date().getFullYear()),
        [locale],
    );
    const showSearchResults = isSearchFocused && searchTerm.trim().length > 0;
    const handleTabChange = (mode: string) => {
        setFilters((previous) => ({
            ...previous,
            activeMode: mode,
            searchTerm: '',
            activeCategory: 'all',
            activeTag: '',
        }));
    };

    return (
        <div className="home-theme min-h-screen overflow-hidden bg-canvas text-text">
            <section className="relative border-b border-border bg-gradient-to-b from-surface via-surface-inset to-canvas">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-20 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-action/10 blur-3xl" />
                    <div className="absolute left-1/4 top-48 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
                </div>
                <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-12 pt-16 text-center md:px-8 md:pb-20 md:pt-24">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-action/40 bg-action-soft px-4 py-1.5 text-sm font-semibold text-focus">
                        <span className="text-warning">⚡</span>
                        <span>{home.announcement.replace('{count}', String(toolCount))}</span>
                    </div>
                    <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-text md:text-6xl">
                        {home.heroHeading}{' '}
                        <span className="bg-gradient-to-l from-action via-action-hover to-success bg-clip-text text-transparent">
                            {home.heroAccent}
                        </span>{' '}
                        {home.heroHeadingSuffix}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted md:text-lg">{home.heroDescription}</p>

                    <div className="relative mt-8 w-full max-w-3xl">
                        <div className="group flex items-center rounded-xl border border-border-strong bg-surface-raised p-2 shadow-2xl transition focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/20">
                            <Search className="mx-3 h-5 w-5 shrink-0 text-text-subtle transition group-focus-within:text-focus" />
                            <Input
                                ref={searchRef}
                                value={searchTerm}
                                onChange={(event) => setFilters({ ...filters, searchTerm: event.target.value })}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => window.setTimeout(() => {
                                    rememberSearch(searchTerm);
                                    setIsSearchFocused(false);
                                    setActiveSearchIndex(-1);
                                }, 120)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={home.searchPlaceholder}
                                aria-label={home.searchPlaceholder}
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls="home-search-results"
                                aria-expanded={showSearchResults}
                                aria-activedescendant={activeSearchIndex >= 0 ? `home-search-option-${activeSearchIndex}` : undefined}
                                className="h-12 border-0 bg-transparent px-0 text-base text-text shadow-none placeholder:text-text-subtle focus-visible:ring-0"
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
                                dir="ltr"
                                title={`${home.searchShortcutModifier} + ${home.searchShortcutKey}`}
                                className="hidden min-w-[3.75rem] cursor-pointer whitespace-nowrap rounded-md border border-border-strong bg-surface-inset px-2 py-1 font-sans text-[11px] font-semibold tracking-tight text-text-muted shadow-sm transition hover:border-focus hover:bg-action-soft hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised sm:block"
                            >
                                <span className="inline-flex items-center justify-center gap-1" aria-hidden="true">
                                    <Command className="h-3.5 w-3.5 text-focus" />
                                    <kbd className="rounded border border-border-strong bg-surface-raised px-1.5 py-0.5">{home.searchShortcutKey}</kbd>
                                </span>
                            </button>
                            <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
                            <div className="flex rounded-lg border border-border bg-surface-inset p-0.5">
                                <Button type="button" variant="ghost" size="icon" aria-label={home.gridView} aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'h-9 w-9 bg-surface-raised text-focus' : 'h-9 w-9 text-text-subtle'}>
                                    <Grid2X2 className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" aria-label={home.listView} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'h-9 w-9 bg-surface-raised text-focus' : 'h-9 w-9 text-text-subtle'}>
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {showSearchResults && <div id="home-search-results" role="listbox" aria-label={home.searchResults} className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-2 text-start shadow-2xl">
                            {searchResults.length > 0 ? searchResults.map((result, index) => <button
                                key={result.tool.href}
                                id={`home-search-option-${index}`}
                                ref={(element) => { searchResultRefs.current[index] = element; }}
                                type="button"
                                role="option"
                                aria-selected={activeSearchIndex === index}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setActiveSearchIndex(index)}
                                onClick={() => selectSearchResult(result)}
                                className={`flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${activeSearchIndex === index ? 'bg-action-soft' : 'hover:bg-action-soft'}`}
                            >
                                <span className="mt-0.5 shrink-0 rounded-md bg-surface-inset p-2 text-text-muted">{renderIcon(result.tool.icon, 'h-4 w-4')}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-text">{result.title}</span>
                                    <span className="mt-0.5 block truncate text-xs text-text-muted">{result.shortDescription}</span>
                                </span>
                                <span className="shrink-0 rounded-md bg-surface-inset px-2 py-1 text-[10px] text-text-muted">{result.category}</span>
                            </button>) : <p className="px-4 py-6 text-center text-sm text-text-muted">{home.noSearchResults}</p>}
                        </div>}
                        <div role="group" aria-label={home.recentSearches} className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
                            <span>{home.recentSearches}</span>
                            {recentSearches.length > 0 ? recentSearches.map((query) => <button key={query} type="button" aria-label={home.quickSearchLabel.replace('{query}', query)} onClick={() => applySearch(query)} className="min-h-10 cursor-pointer rounded-lg border border-border bg-surface-raised px-3 py-2 transition hover:border-focus hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                                <bdi dir="auto" className="font-sans">{query}</bdi>
                            </button>) : <span className="text-xs text-text-subtle">{home.noRecentSearches}</span>}
                        </div>
                    </div>

                    <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
                        <Assurance icon={ShieldCheck} color="text-success" text={home.assurances.local} />
                        <Assurance icon={Zap} color="text-focus" text={home.assurances.fast} />
                        <Assurance icon={Code2} color="text-focus" text={home.assurances.open} />
                    </div>
                    <p className="mt-3 max-w-3xl text-xs leading-6 text-text-subtle">{home.privacyShortNote}</p>
                </div>
            </section>

            <div className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8">
                <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-2 shadow-sm">
                    <div role="tablist" aria-label={home.toolGroups} className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-surface-inset p-1.5">
                        {availableModes.map(({ mode, count }) => <ModeButton
                            key={mode}
                            active={activeMode === mode}
                            onClick={() => handleTabChange(mode)}
                            icon={mode === 'all' ? <Grid2X2 className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                            label={mode === 'all' ? home.allMode : localizeCategory(dict.categories, mode)}
                            count={count}
                        />)}
                        <div className="hidden items-center gap-2 px-3 text-xs text-text-muted lg:flex"><span className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-success" />{home.modeHint}</div>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span>{home.filterByFormat}</span>
                    {availableTags.map((tag) => (
                         <button key={tag} type="button" aria-pressed={activeTag === tag.toLowerCase()} onClick={() => setFilters({ ...filters, activeTag: activeTag === tag.toLowerCase() ? '' : tag.toLowerCase() })} className={`cursor-pointer rounded-full border px-3 py-1.5 font-sans transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${activeTag === tag.toLowerCase() ? 'border-focus bg-action-soft text-focus' : 'border-border bg-surface-raised hover:border-focus/50 hover:text-focus'}`}><bdi dir="auto">{tag}</bdi></button>
                    ))}
                    {hasActiveFilters && <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters}>{home.resetFilters}</Button>}
                </div>

                <div className="mt-10 flex items-end justify-between border-b border-border pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-action/40 bg-action-soft text-focus"><Terminal className="h-5 w-5" /></div>
                             <h2 className="text-xl font-bold text-text md:text-2xl">{toolsHeading}</h2>
                             <span className="rounded-full border border-action/40 bg-action-soft px-2.5 py-1 text-xs font-semibold text-focus">{filteredTools.length}</span>
                         </div>
                         <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{resultAnnouncement}</div>
                         <p className="mt-2 text-sm text-text-muted">{home.toolsDescription}</p>
                     </div>
                </div>

                {filteredTools.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center rounded-xl border border-border bg-surface-raised px-6 py-16 text-center">
                        <SearchX className="mb-4 h-10 w-10 text-text-subtle" />
                        <h3 className="text-lg font-bold text-text">{home.emptyTitle}</h3>
                        <p className="mt-2 text-sm text-text-muted">{home.emptyDescription}</p>
                        <Button type="button" className="mt-6 bg-action text-action-foreground hover:bg-action-hover" onClick={clearAllFilters}>{home.resetFilters}</Button>
                    </div>
                ) : (
                    <div className="mt-6 space-y-10">
                        {groupedFilteredTools.map(({ key, tools }) => <section key={key} aria-labelledby={`home-tool-group-${key}`}>
                            <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                                <h3 id={`home-tool-group-${key}`} className="text-sm font-semibold text-text">{localizeCategory(dict.categories, key)}</h3>
                                <span className="rounded-full bg-surface-inset px-2 py-0.5 font-sans text-[11px] text-text-subtle">{tools.length}</span>
                            </div>
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 gap-3'}>
                                {tools.map((tool) => <ToolCard key={tool.href} tool={tool} locale={locale} dict={dict} list={viewMode === 'list'} />)}
                            </div>
                        </section>)}
                    </div>
                )}

                <section className="relative mt-16 overflow-hidden rounded-2xl border border-border bg-surface-raised p-6 md:p-10">
                    <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-action/10 blur-3xl" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-2">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-success/40 bg-success-soft px-2.5 py-1 font-sans text-xs text-success"><span className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-success" /> {home.privacyEngineLabel}</div>
                            <h2 className="text-2xl font-bold tracking-tight text-text md:text-3xl">{home.privacyHeading}</h2>
                            <p className="mt-4 leading-8 text-text-muted">{home.privacyDescription}</p>
                            <p className="mt-3 text-xs leading-6 text-text-subtle">{home.privacyNote}</p>
                            <div className="mt-6 grid grid-cols-2 gap-3 font-sans text-xs">
                                 <div className="rounded-xl border border-border bg-surface-inset p-4"><span className="mb-1 block text-text-muted">{home.firstRun}</span><strong className="text-lg text-success">{home.firstRunValue}</strong></div>
                                <div className="rounded-xl border border-border bg-surface-inset p-4"><span className="mb-1 block text-text-muted">{home.transmission}</span><strong className="text-lg text-text">{home.localResult}</strong></div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border-strong bg-canvas font-mono text-xs shadow-2xl" dir="ltr">
                            <div className="flex items-center justify-between border-b border-border-strong bg-surface-inset px-4 py-3"><span className="text-text-muted">{home.privacyCodeFile}</span><span className="rounded border border-success/40 bg-success-soft px-2 py-0.5 text-success">{home.privacyClientLabel}</span></div>
                            <pre className="overflow-x-auto p-5 leading-7 text-text-muted"><code><span className="text-text-subtle">// {home.privacyCodeComment}</span>{'\n'}<span className="text-action-hover">const</span> result = <span className="text-focus">await</span> tool.transform(input);{'\n'}<span className="text-action-hover">return</span> result; <span className="text-text-subtle">// {home.privacyCodeResult}</span></code></pre>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="border-t border-border bg-surface-inset">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 text-text"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-surface-raised text-focus"><Terminal className="h-4 w-4" /></span><strong>ZebraCode</strong><span className="rounded border border-border-strong bg-surface-raised px-1.5 py-0.5 font-sans text-[10px] text-text-muted">/dev</span></div>
                        <p className="mt-4 max-w-md text-sm leading-7 text-text-muted">{home.footerDescription}</p>
                        <div className="mt-5 flex gap-2"><a href="https://github.com/vahid9069/zebracode" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-lg border border-border-strong bg-surface-raised p-2 text-text-muted transition hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inset"><Github className="h-4 w-4" /></a><span aria-hidden="true" className="rounded-lg border border-border-strong bg-surface-raised p-2 text-text-muted"><LockKeyhole className="h-4 w-4" /></span></div>
                    </div>
                    <div><h3 className="font-semibold text-text">{home.footerTools}</h3><p className="mt-3 text-sm leading-7 text-text-muted">{home.footerToolsDescription}</p></div>
                    <div><h3 className="font-semibold text-text">{home.footerStats}</h3><div className="mt-3 space-y-2 text-sm text-text-muted"><p className="flex items-center gap-2"><Star className="h-4 w-4 text-warning" /> {home.footerFree}</p><p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-success" /> {home.footerPrivate}</p></div></div>
                </div>
                 <div className="border-t border-border px-4 py-5 text-center text-xs text-text-subtle">{home.footerCopyright.replace('{year}', currentYear)}</div>
            </footer>
        </div>
    );
}

function Assurance({ icon: Icon, color, text }: { icon: React.ComponentType<{ className?: string }>; color: string; text: string }) {
    return <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm text-text-muted"><span className={color}><Icon className="h-5 w-5" /></span><span>{text}</span></div>;
}

function ModeButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
    return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex min-w-max flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inset ${active ? 'bg-action text-action-foreground shadow-md' : 'text-text-muted hover:bg-surface-raised hover:text-text'}`}>{icon}<span>{label}</span><span className={`rounded-full px-2 py-0.5 font-sans text-[11px] ${active ? 'bg-white/20' : 'bg-surface-raised text-text-subtle'}`}>{count}</span></button>;
}

function ToolCard({ tool, locale, dict, list }: { tool: ToolMeta; locale: 'fa' | 'en'; dict: Dictionary; list: boolean }) {
    const localizedTool = localizeTool(tool, dict.tools);
    const Icon = tool.icon;
    return <Card className={`group border-border bg-surface-raised text-text shadow-sm transition-all duration-200 hover:border-focus/60 hover:shadow-lg ${list ? 'rounded-xl' : ''}`}>
        <Link href={getHomeToolHref(tool, locale)} className={`block rounded-xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised ${list ? 'flex items-center gap-4' : ''}`}>
            <div className={`flex items-start justify-between ${list ? 'shrink-0' : 'mb-4'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-action/40 bg-action-soft text-focus">{renderIcon(Icon, 'h-5 w-5')}</div>
                {!list && <span className="rounded border border-border bg-surface-inset px-2 py-0.5 font-sans text-[10px] text-text-muted">{localizeCategory(dict.categories, tool.subCategory || tool.category)}</span>}
            </div>
            <div className={list ? 'min-w-0 flex-1' : ''}>
                <h3 className="font-semibold text-text transition-colors group-hover:text-focus">{localizedTool.title}</h3>
                <p className={`mt-1 text-sm leading-6 text-text-muted ${list ? 'truncate' : 'line-clamp-2'}`}>{localizedTool.shortDescription}</p>
                {!list && <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted"><span>{localizeCategory(dict.categories, tool.category)}</span><span className="flex items-center gap-1 font-semibold text-focus">{dict.home.openTool}<ArrowUpLeft className="h-3.5 w-3.5" /></span></div>}
            </div>
            {list && <ArrowUpLeft className="h-4 w-4 shrink-0 text-text-subtle transition group-hover:text-focus" />}
        </Link>
    </Card>;
}
