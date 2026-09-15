'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu, Search, ChevronDown, ChevronRight,
    Sun, Moon, GripVertical, FolderOpen
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

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 256;

interface GroupedSubCategory {
    title: string;
    items: ToolMeta[];
}

interface GroupedCategory {
    title: string;
    items: GroupedSubCategory[];
}

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

export default function AppLayout({ children, locale, dict }: { children: React.ReactNode, locale: Locale, dict: Dictionary }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [openSubCategories, setOpenSubCategories] = useState<Record<string, boolean>>({});
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const pathname = usePathname();
    const { setTheme, resolvedTheme } = useTheme();
    const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    const showSidebar = !['/', '/about/'].includes(pathname);

    const toolsArray = useMemo(() => Object.values(AllToolsList), []);
    const groupedToolsList = useMemo(() => getGroupedTools(toolsArray), [toolsArray]);

    const getValidPath = (itemPath: string) => {
        let cleanPath = itemPath || '';
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        
        // اضافه کردن پیشوند /en اگر زبان انگلیسی است
        const langPrefix = locale === 'en' ? '/en' : '';
        
        return `${BASE_URL || ''}${langPrefix}${cleanPath}`;
    };

    useEffect(() => {
        const initialCategories: Record<string, boolean> = {};
        const initialSubCategories: Record<string, boolean> = {};

        groupedToolsList.forEach(category => {
            category.items.forEach(subGroup => {
                const hasActive = subGroup.items.some(item => pathname.includes(item.href));
                if (hasActive) {
                    initialCategories[category.title] = true;
                    initialSubCategories[`${category.title}::${subGroup.title}`] = true;
                }
            });
        });

        setOpenCategories(prev => ({ ...prev, ...initialCategories }));
        setOpenSubCategories(prev => ({ ...prev, ...initialSubCategories }));
    }, [pathname, groupedToolsList]);

    const toggleCategory = (catTitle: string) => {
        setOpenCategories(prev => ({
            ...prev,
            [catTitle]: !prev[catTitle]
        }));
    };

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

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX;
        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
            setSidebarWidth(newWidth);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [handleMouseMove]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const toggleLangPath = locale === 'en' 
        ? pathname.replace(/^\/en/, '') || '/' 
        : `/en${pathname === '/' ? '' : pathname}`;

    return (
        <I18nProvider locale={locale} dict={dict}>
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            <CommandMenu isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} locale={locale} dict={dict} />

            {/* هدر اصلی */}
            <header className="flex items-center justify-between h-16 px-4 lg:px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    {showSidebar && (
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md lg:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                    <Link href={locale === 'en' ? '/en' : '/'} className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        ZebraCode
                    </Link>
                    <nav className="hidden lg:flex items-center gap-6 ml-6">
                        <Link href={locale === 'en' ? '/en' : '/'} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {dict.layout.home}
                        </Link>
                        <Link href={locale === 'en' ? '/en/about' : '/about'} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {dict.layout.about}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setIsCommandOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md lg:hidden">
                        <Search className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 border-l rtl:border-r rtl:border-l-0 pl-3 rtl:pr-3 rtl:pl-0 border-gray-200 dark:border-gray-700">
            
                        {/* دکمه تغییر زبان */}
                        <Link 
                            href={toggleLangPath}
                            onClick={() => {
                                // ذخیره زبان در مرورگر کاربر هنگام کلیک
                                localStorage.setItem('zebracode-lang', locale === 'en' ? 'fa' : 'en');
                            }}
                            className="flex items-center justify-center px-2 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={dict.layout.switchLanguage}
                        >
                            {dict.layout.langCode}
                        </Link>

                        {/* دکمه تغییر تم (کد قبلی شما) */}
                        <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                            <Sun className="w-4 h-4 dark:hidden" />
                            <Moon className="w-4 h-4 hidden dark:block" />
                        </button>
                    </div>
                </div>
            </header>

            {/* بدنه اصلی: سایدبار + محتوا */}
            <div className="flex-1 flex overflow-hidden">
                {showSidebar && (
                    <aside
                        ref={sidebarRef}
                        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300`}
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        <div className="h-full flex flex-col pt-4">
                            {/* جستجو */}
                            <div className="px-3 mb-4">
                                <button
                                    onClick={() => setIsCommandOpen(true)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <span className="flex items-center"><Search className="w-4 h-4 me-2" /> {dict.layout.search}</span>
                                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded shadow-sm">Cmd+K</kbd>
                                </button>
                            </div>

                            {/* لیست ابزارها */}
                            <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 custom-scrollbar">
                                {groupedToolsList.map(category => {
                                    const isCatOpen = !!openCategories[category.title];

                                    return (
                                        <div key={category.title} className="flex flex-col">
                                            {/* دکمهٔ گروه اصلی */}
                                            <button
                                                onClick={() => toggleCategory(category.title)}
                                                className="flex items-center justify-between w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider group-hover:text-gray-900 dark:group-hover:text-gray-200">
              {localizeCategory(dict.categories, category.title)}
            </span>
                                                </div>
                                                <ChevronDown
                                                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                                                        isCatOpen ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>

                                            {/* زیرمجموعه‌ها با انیمیشن نرم */}
                                            <div
                                                className={`grid transition-all duration-300 ease-in-out ${
                                                    isCatOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                                }`}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className="mt-1 ml-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4 space-y-2">
                                                        {category.items.map(subGroup => {
                                                            const subKey = `${category.title}::${subGroup.title}`;
                                                            const isSubOpen = !!openSubCategories[subKey];

                                                            return (
                                                                <div key={subGroup.title}>
                                                                    {/* دکمهٔ زیرگروه */}
                                                                    <button
                                                                        onClick={() => toggleSubCategory(category.title, subGroup.title)}
                                                                        className="flex items-center justify-between w-full text-left px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                                    >
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {localizeCategory(dict.categories, subGroup.title)}
                      </span>
                                                                        <ChevronDown
                                                                            className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${
                                                                                isSubOpen ? 'rotate-180' : ''
                                                                            }`}
                                                                        />
                                                                    </button>

                                                                    {/* ابزارهای زیرگروه با انیمیشن */}
                                                                    <div
                                                                        className={`grid transition-all duration-300 ease-in-out ${
                                                                            isSubOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                                                        }`}
                                                                    >
                                                                        <div className="overflow-hidden">
                                                                            <div className="mt-1 space-y-1 ml-2 border-l border-gray-100 dark:border-gray-800 pl-3">
                                                                                {subGroup.items
                                                                                    .filter(tool => tool.type && tool.type.trim() !== '')
                                                                                    .map(item => {
                                                                                        const Icon = item.icon;
                                                                                        const validHref = getValidPath(item.href);
                                                                                        const isActive = pathname === validHref;

                                                                                        return (
                                                                                            <Link
                                                                                                key={validHref}
                                                                                                href={validHref}
                                                                                                onClick={() => setIsSidebarOpen(false)}
                                                                                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                                                                    isActive
                                                                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                                                                                }`}
                                                                                            >
                                                                                                {renderIcon(Icon, `w-4 h-4 mr-3 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400'}`)}
                                                                                                {localizeTool(item, dict.tools).title}
                                                                                            </Link>
                                                                                        );
                                                                                    })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* دستگیرهٔ درگ */}
                        <div
                            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors group"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="absolute top-1/2 -right-1 w-5 h-10 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow">
                                <GripVertical size={14} className="text-gray-500" />
                            </div>
                        </div>
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