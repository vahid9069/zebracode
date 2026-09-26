'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
    Menu, Search, ChevronDown, ChevronLeft,
    Sun, Moon, Boxes, History, Terminal,
    Maximize, PanelRightClose, PanelRightOpen, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import CommandMenu from '@/components/layout/CommandMenu';
import { AllToolsList } from '@/lib/registry';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
import {BASE_URL} from "@/lib/env";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { Dictionary, Locale } from "@/i18n/getDictionary";
import { localizeCategory, localizeTool } from "@/i18n/localize";

interface GroupedSubCategory {
    title: string;
    items: ToolMeta[];
}

interface GroupedCategory {
    title: string;
    items: GroupedSubCategory[];
}

const getFormatBadge = (language: string) => {
    const badges: Record<string, string> = {
        graphql: 'GQL',
        javascript: 'JS',
        json: 'JSON',
        rust: 'RUST',
        sql: 'SQL',
        text: 'TEXT',
        typescript: 'TS',
        yaml: 'YAML',
    };

    return badges[language.toLowerCase()] || language.toUpperCase();
};

const getRecentToolBadge = (tool: ToolMeta) =>
    tool.type.toLowerCase().includes('bigquery') ? 'BQ' : getFormatBadge(tool.outputLanguage);

const getRecentBadgeStyle = (badge: string) => {
    if (badge === 'BQ' || badge === 'JSON') return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    if (badge === 'TS' || badge === 'JS') return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
    if (badge === 'SQL') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
};

const getGroupedTools = (tools: ToolMeta[]): GroupedCategory[] => {
    const groups: Record<string, Record<string, ToolMeta[]>> = {};

    tools.forEach(tool => {
        const cat = (tool.category || 'other').toUpperCase();
        const sub = (tool.subCategory || 'general').toUpperCase();

        if (!groups[cat]) groups[cat] = {};
        if (!groups[cat][sub]) groups[cat][sub] = [];
        groups[cat][sub].push(tool);
    });

    return Object.entries(groups).map(([category, subGroups]) => ({
        title: category,
        items: Object.entries(subGroups).map(([sub, tools]) => ({
            title: sub,
            items: tools,
        })),
    }));
};

interface SidebarToolGroup {
    category: string;
    title: string;
    items: ToolMeta[];
}

const RECENT_TOOLS_STORAGE_KEY = 'zebracode-recent-tools';

export default function AppLayout({ children, locale, dict }: { children: React.ReactNode, locale: Locale, dict: Dictionary }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [openSubCategories, setOpenSubCategories] = useState<Record<string, boolean>>({ 'CONVERTERS::JSON': true });
    const [sidebarQuery, setSidebarQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);
    const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
    const pathname = usePathname();
    const { setTheme, resolvedTheme } = useTheme();
    const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

    const showSidebar = !['/', '/about/'].includes(pathname);

    const getValidPath = (itemPath: string) => {
        let cleanPath = (itemPath || '').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

        const langPrefix = locale === 'en' ? '/en' : '';
        const baseUrl = (BASE_URL || '').replace(/\/+$/, '');

        return `${baseUrl}${langPrefix}${cleanPath}`;
    };

    const isToolPathActive = (itemPath: string) => {
        const normalizePath = (path: string) => {
            const pathnameOnly = new URL(path, 'http://zebracode.local').pathname.replace(/\/{2,}/g, '/');
            const normalized = pathnameOnly.replace(/\/+$/, '');
            return normalized || '/';
        };

        const routePath = `${locale === 'en' ? '/en' : ''}${itemPath.startsWith('/') ? itemPath : `/${itemPath}`}`;
        return normalizePath(pathname) === normalizePath(routePath);
    };

    const toolsArray = useMemo(() => Object.values(AllToolsList), []);
    const groupedToolsList = useMemo(() => getGroupedTools(toolsArray), [toolsArray]);
    const sidebarToolGroups = useMemo<SidebarToolGroup[]>(
        () => groupedToolsList.flatMap(category =>
            category.items.map(subCategory => ({
                category: category.title,
                title: subCategory.title,
                items: subCategory.items,
            }))
        ).sort((first, second) => first.title === 'JSON' ? -1 : second.title === 'JSON' ? 1 : 0),
        [groupedToolsList]
    );
    const filteredTools = useMemo(() => {
        const query = sidebarQuery.trim().toLowerCase();
        if (!query) return toolsArray;
        return toolsArray.filter(tool => {
            const localized = localizeTool(tool, dict.tools);
            const categoryName = localizeCategory(dict.categories, tool.subCategory);
            return `${localized.title} ${localized.shortDescription} ${categoryName} ${tool.outputLanguage}`.toLowerCase().includes(query);
        });
    }, [dict.tools, sidebarQuery, toolsArray]);
    const recentTools = useMemo(
        () => recentToolIds
            .map(id => toolsArray.find(tool => tool.type === id))
            .filter((tool): tool is ToolMeta => Boolean(tool)),
        [recentToolIds, toolsArray]
    );

    useEffect(() => {
        const knownToolIds = new Set(toolsArray.map(tool => tool.type));
        const storedValue = window.localStorage.getItem(RECENT_TOOLS_STORAGE_KEY);
        let storedIds: string[] = [];

        if (storedValue) {
            try {
                const parsed: unknown = JSON.parse(storedValue);
                if (Array.isArray(parsed)) {
                    storedIds = parsed.filter((id): id is string => typeof id === 'string' && knownToolIds.has(id));
                }
            } catch (error) {
                if (!(error instanceof SyntaxError)) throw error;
            }
        }

        const activeTool = toolsArray.find(tool => isToolPathActive(tool.href));
        const nextIds = [...new Set(activeTool ? [activeTool.type, ...storedIds] : storedIds)].slice(0, 3);

        setRecentToolIds(nextIds);
        window.localStorage.setItem(RECENT_TOOLS_STORAGE_KEY, JSON.stringify(nextIds));
    }, [pathname, toolsArray, locale]);

    useEffect(() => {
        const initialSubCategories: Record<string, boolean> = {};

        groupedToolsList.forEach(category => {
            category.items.forEach(subGroup => {
                const hasActive = subGroup.items.some(item => isToolPathActive(item.href));
                if (hasActive) {
                    initialSubCategories[`${category.title}::${subGroup.title}`] = true;
                }
            });
        });

        setOpenSubCategories(prev => ({ ...prev, ...initialSubCategories }));
    }, [pathname, groupedToolsList]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.altKey && event.key.toLowerCase() === 'b') {
                event.preventDefault();
                setIsSidebarMini(value => !value);
            }
            if (event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                setIsSidebarCollapsed(value => !value);
            }
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    const toggleSubCategory = (catTitle: string, subTitle: string) => {
        const key = `${catTitle}::${subTitle}`;
        setOpenSubCategories(prev => {
            const newState = { ...prev };
            if (newState[key]) {
                newState[key] = false;
            } else {
                Object.keys(newState).forEach(k => {
                    if (k.startsWith(`${catTitle}::`)) {
                        newState[k] = false;
                    }
                });
                newState[key] = true;
            }
            return newState;
        });
    };

    const toggleLangPath = locale === 'en' 
        ? pathname.replace(/^\/en/, '') || '/' 
        : `/en${pathname === '/' ? '' : pathname}`;

    return (
        <I18nProvider locale={locale} dict={dict}>
        <div className="theme-shell h-screen flex flex-col bg-[#0b0f19] overflow-hidden font-sans">
            <CommandMenu
                isOpen={isCommandOpen}
                setIsOpen={setIsCommandOpen}
                locale={locale}
                dict={dict}
                shortcutEnabled={!['/', '/en'].includes(pathname)}
            />

            {/* هدر اصلی */}
            <header className="flex items-center justify-between h-16 px-4 lg:px-8 border-b border-[#273043] bg-[#0d1117]/95 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-4">
                    {showSidebar && (
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#161b26] hover:text-white lg:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                    <Link href={locale === 'en' ? '/en' : '/'} className="group flex items-center gap-2 text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#273043] bg-[#161b26] text-[#b4c5ff]">
                            <Terminal className="h-4 w-4" />
                        </span>
                        <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-[#b4c5ff]">ZebraCode</span>
                        <span className="rounded border border-[#273043] bg-[#161b26] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#94a3b8]">/dev</span>
                    </Link>
                    <nav className="hidden items-center gap-1 lg:flex lg:ml-6">
                        <Link href={locale === 'en' ? '/en' : '/'} className="rounded-lg bg-[#292931] px-4 py-2 text-sm font-bold text-[#b4c5ff] transition-colors">
                            {dict.layout.home}
                        </Link>
                        <Link href={locale === 'en' ? '/en/about' : '/about'} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#94a3b8] transition-colors hover:bg-[#161b26] hover:text-white">
                            {dict.layout.about}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {showSidebar && isSidebarCollapsed && (
                        <button onClick={() => setIsSidebarCollapsed(false)} className="hidden lg:flex rounded-lg p-2 text-[#94a3b8] hover:bg-[#161b26] hover:text-white" title="Alt+B">
                            <PanelRightOpen className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => setIsCommandOpen(true)} className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#161b26] hover:text-white lg:hidden">
                        <Search className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 border-l border-[#273043] pl-3 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
            
                        {/* دکمه تغییر زبان */}
                        <Link 
                            href={toggleLangPath}
                            onClick={() => {
                                // ذخیره زبان در مرورگر کاربر هنگام کلیک
                                localStorage.setItem('zebracode-lang', locale === 'en' ? 'fa' : 'en');
                            }}
                            className="flex items-center justify-center rounded-lg border border-[#273043] bg-[#161b26] px-2.5 py-1.5 text-xs font-bold text-[#94a3b8] transition-colors hover:text-white"
                            title={dict.layout.switchLanguage}
                        >
                            {dict.layout.langCode}
                        </Link>

                        {/* دکمه تغییر تم (کد قبلی شما) */}
                        <button onClick={toggleTheme} className="rounded-lg border border-[#273043] bg-[#161b26] p-2 text-[#94a3b8] transition-colors hover:text-white">
                            <Sun className="hidden h-4 w-4 dark:block" />
                            <Moon className="h-4 w-4 dark:hidden" />
                        </button>
                    </div>
                </div>
            </header>

            {/* بدنه اصلی: سایدبار + محتوا */}
            <div className="flex-1 flex overflow-hidden">
                {showSidebar && (
                    <aside
                        dir="rtl"
                        className={`${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${isSidebarCollapsed ? 'lg:hidden' : 'lg:translate-x-0'} lg:relative fixed inset-y-0 right-0 z-30 shrink-0 ${isSidebarMini ? 'w-16' : 'w-80'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-[width,transform] duration-300`}
                    >
                        {isSidebarMini ? (
                            <div dir="rtl" className="h-full flex shrink-0 flex-col items-center gap-3 py-3 bg-slate-50/70 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800" aria-label={locale === 'fa' ? 'نوار ابزار' : 'Tool rail'}>
                                <button onClick={() => setIsSidebarMini(false)} title={locale === 'fa' ? 'بازکردن نوار کناری (Alt+B)' : 'Expand sidebar (Alt+B)'} aria-label={locale === 'fa' ? 'بازکردن نوار کناری' : 'Expand sidebar'} className="w-9 h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center shadow-sm transition-all">
                                    <PanelRightOpen className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsCommandOpen(true)} title={locale === 'fa' ? 'جست‌وجوی ابزارها (Ctrl+K)' : 'Search tools (Ctrl+K)'} aria-label={locale === 'fa' ? 'جست‌وجوی ابزارها' : 'Search tools'} className="w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center">
                                    <Search className="w-5 h-5" />
                                </button>
                                <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />
                                <Tooltip.Provider delayDuration={250}>
                                    {recentTools.slice(0, 3).map(item => {
                                        const href = getValidPath(item.href);
                                        const title = localizeTool(item, dict.tools).title;
                                        const active = isToolPathActive(item.href);
                                        const badge = getRecentToolBadge(item);
                                        return <Tooltip.Root key={item.type}>
                                            <Tooltip.Trigger asChild>
                                                <Link href={href} aria-label={title} aria-current={active ? 'page' : undefined} className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[9px] font-bold transition-colors ${getRecentBadgeStyle(badge)} ${active ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950' : 'hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600'}`}>
                                                    <span dir="ltr">{badge}</span>
                                                    {active && <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                                                </Link>
                                            </Tooltip.Trigger>
                                            <Tooltip.Portal>
                                                <Tooltip.Content side="left" sideOffset={8} dir="rtl" className="z-50 rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                                                    {title}
                                                    <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
                                                </Tooltip.Content>
                                            </Tooltip.Portal>
                                        </Tooltip.Root>;
                                    })}
                                </Tooltip.Provider>
                                <div className="flex-1" />
                                <button onClick={() => setIsSidebarCollapsed(true)} title={locale === 'fa' ? 'حالت تمرکز (Alt+F)' : 'Focus mode (Alt+F)'} aria-label="Focus mode" className="w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                        <div dir="rtl" className="h-full flex flex-col text-right bg-slate-50/70 dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-none">
                            <div className="p-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Boxes className="w-4 h-4" /></div>
                                    <span className="font-bold text-sm truncate">{locale === 'fa' ? 'جعبه‌ابزار توسعه' : 'Developer tools'}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{locale === 'fa' ? '+۳۴' : '+34'}</span>
                                </div>
                                <button onClick={() => setIsSidebarMini(true)} title={locale === 'fa' ? 'بستن سایدبار' : 'Collapse sidebar'} aria-label={locale === 'fa' ? 'بستن سایدبار' : 'Collapse sidebar'} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"><PanelRightClose className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
                            </div>

                            <div className="p-3 pt-2.5">
                                <div className="relative">
                                    <input type="text" value={sidebarQuery} onChange={event => setSidebarQuery(event.target.value)} placeholder={locale === 'fa' ? 'جستجوی سریع میان ابزارها...' : 'Search tools...'} className="w-full text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg pr-8 pl-8 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all shadow-sm" />
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    {sidebarQuery && <button onClick={() => setSidebarQuery('')} aria-label={locale === 'fa' ? 'پاک‌کردن جستجو' : 'Clear search'} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                                </div>
                            </div>

                            <nav className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                                {!sidebarQuery && <section>
                                    <div className="flex items-center justify-between px-2 mb-1.5 text-slate-400 text-[11px] font-medium">
                                        <div className="flex items-center gap-1.5"><History className="w-3 h-3 text-amber-500" /><span>{locale === 'fa' ? 'اخیراً مشاهده‌شده' : 'Recently viewed'}</span></div>
                                        <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1 rounded font-mono">{new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en').format(recentTools.length)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {recentTools.map(item => {
                                            const href = getValidPath(item.href);
                                            const active = isToolPathActive(item.href);
                                            return <Link key={href} href={href} title={localizeTool(item, dict.tools).title} aria-current={active ? 'page' : undefined} onClick={() => setIsSidebarOpen(false)} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border-r-2 border-blue-600 dark:border-blue-500 rounded-r-none rounded-l-md shadow-sm' : 'font-normal text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <span dir="ltr" className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{getFormatBadge(item.outputLanguage)}</span>
                                                    <span className="truncate">{localizeTool(item, dict.tools).title}</span>
                                                </span>
                                                {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse ml-1 shrink-0" />}
                                            </Link>;
                                        })}
                                        {recentTools.length === 0 && <p className="px-2.5 py-2 text-[11px] text-slate-400">{locale === 'fa' ? 'هنوز ابزاری مشاهده نشده است.' : 'No tools viewed yet.'}</p>}
                                    </div>
                                </section>}

                                <div className="h-px bg-slate-200/60 dark:bg-slate-800/80 mx-1" />

                                <div className="space-y-1">
                                    {sidebarToolGroups.map(group => {
                                        const items = sidebarQuery
                                            ? group.items.filter(item => filteredTools.includes(item))
                                            : group.items;
                                        if (items.length === 0) return null;
                                        const key = `${group.category}::${group.title}`;
                                        const isOpen = sidebarQuery ? true : !!openSubCategories[key];
                                        const title = group.title === 'JSON'
                                            ? (locale === 'fa' ? 'مبدل‌های JSON' : 'JSON converters')
                                            : localizeCategory(dict.categories, group.title);
                                        return <section key={key}>
                                            <button type="button" onClick={() => toggleSubCategory(group.category, group.title)} aria-expanded={isOpen} className="w-full flex items-center justify-between px-2 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 rounded-lg transition-colors font-medium">
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <span dir="ltr" className="text-slate-400 text-[10px] font-bold">{group.title === 'JSON' ? 'JSON' : renderIcon(items[0].icon, 'w-3.5 h-3.5')}</span>
                                                    <span className="truncate">{title}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-400 shrink-0">
                                                    <span className="text-[10px] font-mono bg-slate-200/60 dark:bg-slate-800 px-1 rounded">{new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en').format(items.length)}</span>
                                                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                                                </span>
                                            </button>
                                            {isOpen && <div className="mt-1 space-y-0.5 pr-2.5 mr-2 border-r border-slate-200 dark:border-slate-800">
                                                {items.map(item => {
                                                    const href = getValidPath(item.href);
                                                    const active = isToolPathActive(item.href);
                                                    const localizedTitle = localizeTool(item, dict.tools).title;
                                                    return <Link key={href} href={href} title={localizedTitle} aria-current={active ? 'page' : undefined} onClick={() => setIsSidebarOpen(false)} className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] cursor-pointer transition-colors ${active ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border-r-2 border-blue-600 dark:border-blue-500 -mr-[1px] rounded-r-none rounded-l-md shadow-sm' : 'font-normal text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <span dir="ltr" className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold border ${active ? 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white border-blue-200 dark:border-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-700'}`}>{getFormatBadge(item.outputLanguage)}</span>
                                                            <span className="truncate">{localizedTitle}</span>
                                                        </span>
                                                        {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />}
                                                    </Link>;
                                                })}
                                            </div>}
                                        </section>;
                                    })}
                                </div>
                            </nav>

                            <div className="py-2.5 px-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                    <span>{locale === 'fa' ? 'V8 لوکال v2.4.0' : 'Local V8 v2.4.0'}</span>
                                </div>
                                <button onClick={() => setIsSidebarCollapsed(true)} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <Maximize className="w-2.5 h-2.5" /><span>{locale === 'fa' ? 'Alt+F تمرکز' : 'Alt+F Focus'}</span>
                                </button>
                            </div>
                        </div>
                        )}
                    </aside>
                )}

                {/* محتوای اصلی */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
        </I18nProvider>
    );
}