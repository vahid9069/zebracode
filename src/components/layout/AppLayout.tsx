'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import {
    Menu, Search, ChevronDown, ChevronLeft, ChevronRight,
    Sun, Moon, Boxes, History, Terminal,
    Maximize, PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import CommandMenu from '@/components/layout/CommandMenu';
import { AllToolsList } from '@/lib/registry';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
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
    const pathname = usePathname();
    const isFa = locale === 'fa';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
    const brandRef = React.useRef<HTMLAnchorElement>(null);
    const commandReturnFocusRef = React.useRef<HTMLElement | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [openSubCategories, setOpenSubCategories] = useState<Record<string, boolean>>(() => {
        const normalizePath = (path: string) => {
            const pathnameOnly = new URL(path, 'http://zebracode.local').pathname.replace(/\/{2,}/g, '/');
            const normalized = pathnameOnly.replace(/\/+$/, '');
            return normalized || '/';
        };
        const currentNorm = normalizePath(pathname || '');
        const tools = Object.values(AllToolsList);
        for (const tool of tools) {
            const routePath = `${locale === 'en' ? '/en' : ''}${tool.href.startsWith('/') ? tool.href : `/${tool.href}`}`;
            if (currentNorm === normalizePath(routePath)) {
                const cat = (tool.category || 'other').toUpperCase();
                const sub = (tool.subCategory || 'general').toUpperCase();
                return { [`${cat}::${sub}`]: true };
            }
        }
        return {};
    });
    const [sidebarQuery, setSidebarQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);
    const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
    const { setTheme, resolvedTheme } = useTheme();
    const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncDesktopState = () => setIsDesktop(mediaQuery.matches);
        syncDesktopState();
        mediaQuery.addEventListener('change', syncDesktopState);
        return () => mediaQuery.removeEventListener('change', syncDesktopState);
    }, []);

    const cleanPath = (pathname || '').replace(/\/+$/, '') || '/';
    const isLandingOrStatic = ['/', '/en', '/about', '/en/about'].includes(cleanPath);
    const showSidebar = !isLandingOrStatic;
    const sidebarIsVisible = isDesktop ? !isSidebarCollapsed : isSidebarOpen;
    const homePath = locale === 'en' ? '/en' : '/';
    const aboutPath = locale === 'en' ? '/en/about' : '/about';
    const isHomeActive = cleanPath === homePath;
    const isAboutActive = cleanPath === aboutPath;

    const getValidPath = (itemPath: string) => {
        const cleanItemPath = (itemPath || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
        const langPrefix = locale === 'en' ? '/en' : '';
        return `${langPrefix}/${cleanItemPath}/`;
    };

    const isToolPathActive = React.useCallback((itemPath: string) => {
        const normalizePath = (path: string) => {
            const pathnameOnly = new URL(path, 'http://zebracode.local').pathname.replace(/\/{2,}/g, '/');
            const normalized = pathnameOnly.replace(/\/+$/, '');
            return normalized || '/';
        };

        const routePath = `${locale === 'en' ? '/en' : ''}${itemPath.startsWith('/') ? itemPath : `/${itemPath}`}`;
        return normalizePath(pathname) === normalizePath(routePath);
    }, [locale, pathname]);

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
            const textToSearch = [
                localized.title,
                localized.shortDescription,
                categoryName,
                tool.outputLanguage,
                tool.inputLanguage
            ].filter(Boolean).join(' ').toLowerCase();
            return textToSearch.includes(query);
        });
    }, [dict.categories, dict.tools, sidebarQuery, toolsArray]);

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
        let activeKey: string | null = null;

        for (const category of groupedToolsList) {
            for (const subGroup of category.items) {
                if (subGroup.items.some(item => isToolPathActive(item.href))) {
                    activeKey = `${category.title}::${subGroup.title}`;
                    break;
                }
            }
            if (activeKey) break;
        }

        if (activeKey) {
            setOpenSubCategories({ [activeKey]: true });
        } else {
            setOpenSubCategories({});
        }
    }, [pathname, groupedToolsList, isToolPathActive]);

    useEffect(() => {
        setIsSidebarOpen(false);
        setIsMobileNavigationOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (isDesktop) setIsMobileNavigationOpen(false);
    }, [isDesktop]);

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
        ? (cleanPath.replace(/^\/en/, '') || '/') + (cleanPath === '/en' ? '' : '/')
        : `/en${cleanPath === '/' ? '/' : cleanPath + '/'}`;

    // Both navigation surfaces use the same routes, labels, and active state.
    const primaryLinks = [
        { href: locale === 'en' ? '/en/' : '/', label: dict.layout.home, active: isHomeActive },
        { href: locale === 'en' ? '/en/about/' : '/about/', label: dict.layout.about, active: isAboutActive },
    ].map(item => (
        <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            onClick={() => setIsMobileNavigationOpen(false)}
            className={`flex min-h-11 items-center rounded-lg px-4 py-2 text-sm transition-colors ${
                item.active
                    ? 'bg-action-soft font-bold text-action dark:text-focus ring-1 ring-focus/30'
                    : 'font-semibold text-text-muted hover:bg-action-soft hover:text-text'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
        >
            {item.label}
        </Link>
    ));

    const renderPreferences = (compact: boolean) => (
        <>
            <Link
                href={toggleLangPath}
                onClick={() => {
                    setIsMobileNavigationOpen(false);
                    localStorage.setItem('zebracode-lang', locale === 'en' ? 'fa' : 'en');
                }}
                aria-label={dict.layout.switchLanguage}
                title={dict.layout.switchLanguage}
                className="flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-2.5 py-1.5 text-sm font-bold text-text-muted transition-colors hover:bg-action-soft hover:text-action dark:hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
                {compact ? dict.layout.langCode : dict.layout.switchLanguage}
            </Link>
            <button
                type="button"
                onClick={toggleTheme}
                aria-label={dict.layout.toggleTheme}
                title={dict.layout.toggleTheme}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface-raised p-2 text-sm text-text-muted transition-colors hover:bg-action-soft hover:text-action dark:hover:text-focus cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
                <Sun aria-hidden="true" className="hidden h-4 w-4 shrink-0 dark:block" />
                <Moon aria-hidden="true" className="h-4 w-4 shrink-0 dark:hidden" />
                {!compact && <span>{dict.layout.toggleTheme}</span>}
            </button>
        </>
    );

    return (
        <I18nProvider locale={locale} dict={dict}>
        <div className="h-screen flex flex-col bg-canvas text-text overflow-hidden font-sans">
            <CommandMenu
                isOpen={isCommandOpen}
                setIsOpen={setIsCommandOpen}
                locale={locale}
                dict={dict}
                shortcutEnabled={!['/', '/en'].includes(cleanPath) && !isMobileNavigationOpen}
                returnFocusRef={commandReturnFocusRef}
            />

            {/* هدر اصلی */}
            <header className="flex items-center justify-between gap-2 h-16 px-3 sm:px-4 lg:px-8 border-b border-border bg-surface/90 backdrop-blur-md z-20 shrink-0 dark:bg-surface/95">
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                    {isLandingOrStatic && (
                        <Dialog.Root open={isMobileNavigationOpen && !isDesktop} onOpenChange={setIsMobileNavigationOpen}>
                            <Dialog.Trigger asChild>
                                <button
                                    type="button"
                                    aria-label={dict.layout.primaryNavigation}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-action-soft hover:text-text lg:hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                >
                                    <Menu aria-hidden="true" className="h-6 w-6" />
                                </button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden" />
                                <Dialog.Content
                                    data-mobile-navigation="true"
                                    dir={isFa ? 'rtl' : 'ltr'}
                                    className="fixed inset-x-4 top-20 z-[101] mx-auto max-h-[calc(100dvh-6rem)] max-w-sm overflow-y-auto break-words rounded-xl border border-border-strong bg-surface p-4 text-text shadow-xl focus:outline-none lg:hidden"
                                    onCloseAutoFocus={event => {
                                        // The mobile trigger is hidden after crossing the desktop breakpoint.
                                        if (isDesktop) {
                                            event.preventDefault();
                                            brandRef.current?.focus();
                                        }
                                    }}
                                >
                                    <Dialog.Description id="mobile-navigation-description" className="sr-only">
                                        {dict.layout.primaryNavigation}
                                    </Dialog.Description>
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <Dialog.Title className="text-base font-bold">{dict.layout.primaryNavigation}</Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button
                                                type="button"
                                                aria-label={dict.layout.closeMenu}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-action-soft hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                            >
                                                <X aria-hidden="true" className="h-5 w-5" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                    <nav aria-label={dict.layout.primaryNavigation} className="grid gap-2">
                                        {primaryLinks}
                                    </nav>
                                    <div className="mt-4 grid gap-2 border-t border-border pt-4">
                                        {renderPreferences(false)}
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    )}
                    {showSidebar && (
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="rounded-lg p-2 text-text-muted hover:bg-action-soft hover:text-text lg:hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            aria-label={dict.layout.developerTools}
                            aria-expanded={isSidebarOpen}
                            aria-controls="tool-sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                    <Link ref={brandRef} href={locale === 'en' ? '/en/' : '/'} className="group flex min-w-0 items-center gap-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-raised text-action dark:text-focus">
                            <Terminal className="h-4 w-4" />
                        </span>
                        <span className="truncate text-lg font-bold tracking-tight transition-colors group-hover:text-action dark:group-hover:text-focus">ZebraCode</span>
                        <span className="hidden rounded border border-border-strong bg-surface-raised px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-widest text-text-muted sm:inline">/dev</span>
                    </Link>
                    <nav aria-label={dict.layout.primaryNavigation} className="hidden items-center gap-1 lg:flex lg:ms-6">
                        {primaryLinks}
                    </nav>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                    {showSidebar && (
                        <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed(val => !val)}
                            className="hidden lg:flex rounded-lg p-2 text-text-muted hover:bg-action-soft hover:text-text transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            title={isSidebarCollapsed ? dict.layout.focusModeShortcut : dict.layout.collapseSidebar}
                            aria-label={isSidebarCollapsed ? dict.layout.expandSidebar : dict.layout.collapseSidebar}
                        >
                            {isSidebarCollapsed ? (
                                isFa ? <PanelRightOpen className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />
                            ) : (
                                isFa ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />
                            )}
                        </button>
                    )}
                        <button
                            type="button"
                            onMouseDown={event => {
                                commandReturnFocusRef.current = event.currentTarget;
                            }}
                            onClick={() => {
                                setIsCommandOpen(true);
                            }}
                            aria-expanded={isCommandOpen}
                            aria-controls="command-menu"
                            className="rounded-lg p-2 text-text-muted hover:bg-action-soft hover:text-text lg:hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        aria-label={dict.layout.search}
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <div className={`${isLandingOrStatic ? 'hidden lg:flex' : 'flex'} items-center gap-2 border-s border-border-strong ps-2 sm:ps-3`}>
                        {renderPreferences(true)}
                    </div>
                </div>
            </header>

            {/* بدنه اصلی: سایدبار + محتوا */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Backdrop برای موبایل */}
                {showSidebar && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {showSidebar && (
                    <aside
                        id="tool-sidebar"
                        aria-label={dict.layout.developerTools}
                        aria-hidden={!sidebarIsVisible}
                        inert={!sidebarIsVisible ? true : undefined}
                        dir={isFa ? 'rtl' : 'ltr'}
                        className={`fixed inset-y-0 z-40 lg:z-10 lg:static flex flex-col shrink-0 ${
                            isFa ? 'right-0 border-l' : 'left-0 border-r'
                        } border-border bg-surface/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-[width,transform] duration-300 ${
                            isSidebarMini ? 'lg:w-16' : 'lg:w-80'
                        } w-80 max-w-[85vw] ${
                            isSidebarCollapsed ? 'lg:hidden' : 'lg:translate-x-0'
                        } ${
                            isSidebarOpen
                                ? 'translate-x-0'
                                : isFa
                                    ? 'translate-x-full'
                                    : '-translate-x-full'
                        }`}
                    >
                        {isSidebarMini ? (
                            <nav aria-label={dict.layout.toolRail} dir={isFa ? 'rtl' : 'ltr'} className="h-full flex shrink-0 flex-col items-center gap-3 py-3 bg-surface-inset">
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarMini(false)}
                                    title={dict.layout.expandSidebarShortcut}
                                    aria-label={dict.layout.expandSidebar}
                                    className="w-9 h-9 rounded-xl bg-action text-action-foreground hover:bg-action-hover flex items-center justify-center shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                >
                                    {isFa ? <PanelRightOpen className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={event => {
                                        commandReturnFocusRef.current = event.currentTarget;
                                    }}
                                    onClick={() => {
                                        setIsCommandOpen(true);
                                    }}
                                    aria-expanded={isCommandOpen}
                                    aria-controls="command-menu"
                                    title={dict.layout.searchToolsShortcut}
                                    aria-label={dict.layout.searchTools}
                                    className="w-9 h-9 rounded-lg text-text-muted hover:text-text hover:bg-action-soft flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                                <div className="w-6 h-px bg-border my-1" />
                                <Tooltip.Provider delayDuration={250}>
                                    {recentTools.slice(0, 3).map(item => {
                                        const href = getValidPath(item.href);
                                        const title = localizeTool(item, dict.tools).title;
                                        const active = isToolPathActive(item.href);
                                        const badge = getRecentToolBadge(item);
                                        return (
                                            <Tooltip.Root key={item.type}>
                                                <Tooltip.Trigger asChild>
                                                    <Link
                                                        href={href}
                                                        aria-label={title}
                                                        aria-current={active ? 'page' : undefined}
                                                        onClick={() => setIsSidebarOpen(false)}
                                                        className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-sans text-[9px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${getRecentBadgeStyle(badge)} ${active ? 'ring-2 ring-action bg-action-soft' : 'hover:ring-1 hover:ring-border-strong'}`}
                                                    >
                                                        <span dir="ltr">{badge}</span>
                                                        {active && (
                                                            <span className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-action animate-pulse ${isFa ? '-left-0.5' : '-right-0.5'}`} />
                                                        )}
                                                    </Link>
                                                </Tooltip.Trigger>
                                                <Tooltip.Portal>
                                                    <Tooltip.Content
                                                        side={isFa ? 'left' : 'right'}
                                                        sideOffset={8}
                                                        dir={isFa ? 'rtl' : 'ltr'}
                                                        className="z-50 rounded-md bg-text px-3 py-1.5 text-xs text-surface shadow-lg"
                                                    >
                                                        {title}
                                                        <Tooltip.Arrow className="fill-text" />
                                                    </Tooltip.Content>
                                                </Tooltip.Portal>
                                            </Tooltip.Root>
                                        );
                                    })}
                                </Tooltip.Provider>
                                <div className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarCollapsed(true)}
                                    title={dict.layout.focusModeShortcut}
                                    aria-label={dict.layout.focusMode}
                                    className="w-10 h-10 rounded-lg text-text-muted hover:bg-action-soft hover:text-text flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                >
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </nav>
                        ) : (
                            <div dir={isFa ? 'rtl' : 'ltr'} className={`h-full flex flex-col ${isFa ? 'text-right' : 'text-left'} bg-surface-inset text-text select-none`}>
                                {/* نوار بالای سایدبار */}
                                <div className="p-3 pb-2 flex items-center justify-between border-b border-border/70">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-action-soft text-action dark:text-focus flex items-center justify-center shrink-0">
                                            <Boxes className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm truncate">{dict.layout.developerTools}</span>
                                        <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-full bg-success-soft text-success border border-success/30 shrink-0">
                                            {dict.layout.toolsBadge}
                                        </span>
                                    </div>
                                    {/* دکمه مینی در دسکتاپ */}
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarMini(true)}
                                        title={dict.layout.collapseSidebar}
                                        aria-label={dict.layout.collapseSidebar}
                                        className="hidden lg:flex p-1 rounded-md text-text-muted hover:text-text hover:bg-action-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        {isFa ? <PanelRightClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                                    </button>
                                    {/* دکمه بستن در موبایل */}
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarOpen(false)}
                                        aria-label={dict.layout.closeMenu || (isFa ? 'بستن منو' : 'Close menu')}
                                        className="flex lg:hidden p-1 rounded-md text-text-muted hover:text-text hover:bg-action-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* ورودی جستجو */}
                                <div className="p-3 pt-2.5">
                                    <div className="relative">
                                        <label htmlFor="sidebar-tool-search" className="sr-only">{dict.layout.sidebarSearchLabel}</label>
                                        <input
                                            id="sidebar-tool-search"
                                            type="text"
                                            value={sidebarQuery}
                                            onChange={event => setSidebarQuery(event.target.value)}
                                            placeholder={dict.layout.searchToolsPlaceholder}
                                            className="w-full rounded-lg border border-border-strong bg-surface px-8 py-2 text-xs text-text placeholder:text-text-muted transition-all focus:border-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
                                        />
                                        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                                        {sidebarQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSidebarQuery('')}
                                                aria-label={dict.layout.clearSearch}
                                                className="absolute end-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* لیست دسته‌بندی‌ها و ابزارها */}
                                <nav aria-label={dict.layout.toolNavigation} className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-border-strong">
                                    {!sidebarQuery && (
                                        <section>
                                            <div className="flex items-center justify-between px-2 mb-1.5 text-text-muted text-[11px] font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <History className="w-3 h-3 text-warning" />
                                                    <span>{dict.layout.recentlyViewed}</span>
                                                </div>
                                                <span className="text-[10px] bg-surface-raised px-1 rounded font-sans">
                                                    {new Intl.NumberFormat(isFa ? 'fa-IR' : 'en').format(recentTools.length)}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {recentTools.map(item => {
                                                    const href = getValidPath(item.href);
                                                    const active = isToolPathActive(item.href);
                                                    return (
                                                        <Link
                                                            key={href}
                                                            href={href}
                                                            title={localizeTool(item, dict.tools).title}
                                                            aria-current={active ? 'page' : undefined}
                                                            onClick={() => setIsSidebarOpen(false)}
                                                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                                                                active
                                                                    ? `bg-action-soft text-action dark:text-focus font-bold ${
                                                                        isFa ? 'border-r-2 rounded-r-none rounded-l-md' : 'border-l-2 rounded-l-none rounded-r-md'
                                                                    } border-action shadow-sm`
                                                                    : 'font-normal text-text-muted hover:text-text hover:bg-action-soft'
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-2 min-w-0">
                                                                <span dir="ltr" className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-bold ${active ? 'bg-action text-action-foreground' : 'bg-surface-raised text-text-muted'}`}>
                                                                    {getFormatBadge(item.outputLanguage)}
                                                                </span>
                                                                <span className="truncate">{localizeTool(item, dict.tools).title}</span>
                                                            </span>
                                                            {active && <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse shrink-0 mx-1" />}
                                                        </Link>
                                                    );
                                                })}
                                                {recentTools.length === 0 && (
                                                    <p className="px-2.5 py-2 text-[11px] text-text-muted">{dict.layout.noRecentTools}</p>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {!sidebarQuery && <div className="h-px bg-border mx-1" />}

                                    {sidebarQuery && filteredTools.length === 0 && (
                                        <p className="px-2.5 py-4 text-center text-[11px] text-text-muted">
                                            {dict.layout.noResultsFound || (isFa ? 'هیچ ابزاری با این مشخصات یافت نشد.' : 'No tools found matching your search.')}
                                        </p>
                                    )}

                                    <div className="space-y-1">
                                        {sidebarToolGroups.map(group => {
                                            const items = sidebarQuery
                                                ? group.items.filter(item => filteredTools.includes(item))
                                                : group.items;
                                            if (items.length === 0) return null;
                                            const key = `${group.category}::${group.title}`;
                                            const isOpen = sidebarQuery ? true : !!openSubCategories[key];
                                            const title = group.title === 'JSON' && group.category === 'CONVERTERS'
                                                ? dict.layout.jsonConverters
                                                : group.category === 'CONVERTERS'
                                                    ? localizeCategory(dict.categories, group.title)
                                                    : `${localizeCategory(dict.categories, group.title)} · ${localizeCategory(dict.categories, group.category)}`;

                                            const ClosedChevron = isFa ? ChevronLeft : ChevronRight;

                                            return (
                                                <section key={key}>
                                                    <button
                                                     type="button"
                                                     onClick={() => toggleSubCategory(group.category, group.title)}
                                                     disabled={Boolean(sidebarQuery)}
                                                     aria-expanded={isOpen}
                                                     className="w-full flex items-center justify-between px-2 py-1.5 text-text hover:bg-action-soft rounded-lg transition-colors font-medium cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                                    >
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <span dir="ltr" className="text-text-muted text-[10px] font-bold">
                                                                {group.title === 'JSON' ? 'JSON' : renderIcon(items[0].icon, 'w-3.5 h-3.5')}
                                                            </span>
                                                            <span className="truncate">{title}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-text-muted shrink-0">
                                                            <span className="text-[10px] font-sans bg-surface-raised px-1 rounded">
                                                                {new Intl.NumberFormat(isFa ? 'fa-IR' : 'en').format(items.length)}
                                                            </span>
                                                            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ClosedChevron className="w-3.5 h-3.5" />}
                                                        </span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="ms-2 mt-1 space-y-0.5 border-s border-border ps-2.5">
                                                            {items.map(item => {
                                                                const href = getValidPath(item.href);
                                                                const active = isToolPathActive(item.href);
                                                                const localizedTitle = localizeTool(item, dict.tools).title;
                                                                return (
                                                                    <Link
                                                                        key={href}
                                                                        href={href}
                                                                        title={localizedTitle}
                                                                        aria-current={active ? 'page' : undefined}
                                                                        onClick={() => setIsSidebarOpen(false)}
                                                                        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${active
                                                                            ? 'bg-action-soft text-action dark:text-focus font-bold border-s-2 -ms-[1px] rounded-s-none rounded-e-md border-action shadow-sm'
                                                                            : 'font-normal text-text-muted hover:text-text hover:bg-action-soft'}`}
                                                                    >
                                                                        <span className="flex items-center gap-2 min-w-0">
                                                                            <span dir="ltr" className={`text-[9px] font-sans px-1 py-0.5 rounded font-bold border ${active ? 'bg-action-soft text-action dark:text-focus border-action/30' : 'bg-surface-raised text-text-muted border-border'}`}>
                                                                                {getFormatBadge(item.outputLanguage)}
                                                                            </span>
                                                                            <span className="truncate">{localizedTitle}</span>
                                                                        </span>
                                                                        {active && <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse shrink-0 mx-0.5" />}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </section>
                                            );
                                        })}
                                    </div>
                                </nav>

                                {/* فوتر سایدبار */}
                                <div className="py-2.5 px-3 border-t border-border bg-surface/50 text-[11px] text-text-muted flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-success font-sans text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                                        <span>{dict.layout.engineLabel}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarCollapsed(true)}
                                        className="flex items-center gap-1 text-[10px] bg-surface-raised px-1.5 py-0.5 rounded border border-border-strong hover:bg-action-soft hover:text-action dark:hover:text-focus transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        <Maximize className="w-2.5 h-2.5" />
                                        <span>{dict.layout.focusModeLabel}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                )}

                {/* محتوای اصلی */}
                <main className="flex-1 overflow-y-auto bg-surface">
                    {children}
                </main>
            </div>
        </div>
        </I18nProvider>
    );
}
