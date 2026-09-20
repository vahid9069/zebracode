// src/components/pages/HomePageClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Terminal, LayoutGrid, List, X, ArrowRight } from 'lucide-react';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
import { BASE_URL } from "@/lib/env";
import type { Dictionary } from '@/i18n/getDictionary';
import { localizeCategory, localizeTool } from '@/i18n/localize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// ---------- تایپ‌های جدید ----------
interface GroupedSubCategory {
    title: string;
    items: ToolMeta[];
}

interface GroupedCategory {
    title: string;
    items: GroupedSubCategory[];
}

// پراپ‌های دیکشنری برای صفحه اصلی
export interface HomePageClientProps {
    dict: Dictionary;
    locale: 'fa' | 'en';
}

// ---------- تابع گروه‌بندی ----------
const getGroupedTools = (tools: ToolMeta[]): GroupedCategory[] => {
    const groups: Record<string, Record<string, ToolMeta[]>> = {};

    tools.forEach(tool => {
        const cat = tool.category || 'other';
        const sub = tool.subCategory || 'general';

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

export default function HomePageClient({ dict, locale }: HomePageClientProps) {
    const home = dict.home;
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // تمام ابزارها
    const allTools = useMemo(() => Object.values(AllToolsList), []);

    // استخراج زیرمجموعه‌های یکتا
    const categories = useMemo(() => {
        const cats = new Set<string>();
        allTools.forEach(tool => {
            if (tool.subCategory) cats.add(tool.subCategory);
        });
        return Array.from(cats).sort();
    }, [allTools]);

    // ابزارهای فیلترشده بر اساس جستجو و دسته‌بندی
    const filteredTools = useMemo(() => {
        return allTools.filter(tool => {
            const matchCategory = activeCategory === 'all' || tool.subCategory === activeCategory;
            const matchSearch =
                !searchTerm ||
                tool.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [allTools, activeCategory, searchTerm]);

    // گروه‌بندی ابزارهای فیلترشده
    const groupedTools = useMemo(() => getGroupedTools(filteredTools), [filteredTools]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] font-sans transition-colors duration-300">
            {/* هیرو */}
            <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 flex items-center justify-center gap-3">
                        <Terminal size={36} className="text-primary"/>
                        <span>
                            {home.heroTitle}
                        </span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {home.heroDescription}
                    </p>
                </div>
            </section>

            {/* نوار جستجو و فیلترها */}
            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                <Card className="bg-card/95 p-4 shadow-lg backdrop-blur">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input
                                type="text"
                                placeholder={home.searchPlaceholder}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-12 ps-10 pe-10"
                            />
                            {searchTerm && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute end-1 top-1/2 -translate-y-1/2"
                                >
                                    <X size={18} />
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
                                <LayoutGrid size={20} />
                            </Button>
                            <Button type="button" variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
                                <List size={20} />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Button type="button" size="sm" variant={activeCategory === 'all' ? 'default' : 'outline'} onClick={() => setActiveCategory('all')}>
                            {home.allCategories}
                        </Button>
                        {categories.map(cat => (
                            <Button type="button" size="sm" variant={activeCategory === cat ? 'default' : 'outline'} key={cat} onClick={() => setActiveCategory(cat)}>
                                {localizeCategory(dict.categories, cat)}
                            </Button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* نمایش گروه‌بندی‌ها */}
            <main className="max-w-6xl mx-auto px-4 pb-20 mt-8">
                {groupedTools.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        {dict.noToolsFound} &quot;{searchTerm}&quot;
                    </div>
                ) : (
                    groupedTools.map(category => (
                        <div key={category.title} className="mb-10">
                            {/* عنوان دستهٔ اصلی */}
                            <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b">
                                {category.title}
                            </h2>

                            {/* زیرگروه‌ها */}
                            {category.items.map(subGroup => (
                                <div key={subGroup.title} className="mb-8">
                                    <h3 className="text-lg font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                        {subGroup.title}
                                    </h3>

                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {subGroup.items.map(tool => (
                                                <ToolCard key={tool.href} tool={tool} locale={locale} dict={dict} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {subGroup.items.map(tool => (
                                                <ToolListItem key={tool.href} tool={tool} locale={locale} dict={dict} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}

// ---------- کارت گرید ----------
function ToolCard({ tool, locale, dict }: { tool: ToolMeta, locale: 'fa' | 'en', dict: any }) {
    const Icon = tool.icon;
    const localizedHref = locale === 'en' ? `/en${tool.href}` : tool.href;
    const localizedTool = localizeTool(tool, dict.tools);

    return (
        <Card
        >
        <Link
            href={`${BASE_URL || ''}${localizedHref}`}
            className="group relative p-5 hover:bg-accent/40 transition-colors flex flex-col"
        >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {renderIcon(Icon, "w-5 h-5")}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{localizedTool.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{localizedTool.shortDescription}</p>
            <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {dict.common.browseTools}
                <ArrowRight size={14} className="ms-1 transform rtl:-scale-x-100" />
            </div>
        </Link>
        </Card>
    );
}

// ---------- آیتم لیست ----------
function ToolListItem({ tool, locale, dict }: { tool: ToolMeta, locale: 'fa' | 'en', dict: any }) {
    const Icon = tool.icon;
    const localizedHref = locale === 'en' ? `/en${tool.href}` : tool.href;
    const localizedTool = localizeTool(tool, dict.tools);

    return (
        <Link
            href={localizedHref}
            className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1c2128] transition-colors group"
        >
            <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {renderIcon(Icon, "w-4 h-4")}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{localizedTool.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{localizedTool.shortDescription}</p>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors transform rtl:-scale-x-100" />
        </Link>
    );
}