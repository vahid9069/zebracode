'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getLocalizedCategories, getLocalizedTools, Tool, Category } from '@/lib/tools';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Search, X, Sparkles, ArrowLeft, ArrowRight, SearchX, Clock, ArrowUpLeft, ArrowUpRight } from 'lucide-react';

interface KitHomePageClientProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function KitHomePageClient({ locale = 'fa', dict }: KitHomePageClientProps) {
  const isEn = locale === 'en';
  const prefix = isEn ? '/en' : '';
  const RECENT_SEARCHES_KEY = `zebracode_kit_recent_searches_${locale}`;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const localizedCategories = useMemo(() => getLocalizedCategories(dict), [dict]);
  const localizedTools = useMemo(() => getLocalizedTools(dict), [dict]);

  // بارگذاری جستجوهای اخیر از localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [RECENT_SEARCHES_KEY]);

  // میانبر کیبورد Ctrl+K یا / برای فوکوس روی سرچ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // گروه‌بندی ابزارها
  const groupedSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return localizedCategories.map((category) => {
      if (selectedCategory !== 'all' && selectedCategory !== category.id) {
        return null;
      }

      const tools = localizedTools.filter((tool) => {
        if (tool.category !== category.id) return false;
        if (!q) return true;

        return (
          tool.title.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.slug.toLowerCase().includes(q)
        );
      });

      if (tools.length === 0) return null;

      return {
        category,
        tools,
      };
    }).filter(Boolean) as { category: Category; tools: Tool[] }[];
  }, [searchQuery, selectedCategory, localizedCategories, localizedTools]);

  const totalResultsCount = useMemo(() => {
    return groupedSections.reduce((acc, sec) => acc + sec.tools.length, 0);
  }, [groupedSections]);

  return (
    <div className="space-y-12">
      {/* هدر و معرفی */}
      <section className="text-center pt-6 pb-2 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          {isEn ? 'ZebraCode Daily & Public Kit' : 'جعبه‌ابزار عمومی و روزمره زبراکد'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {isEn ? 'Fast, Private & Free Online Utilities' : 'ابزارهای آنلاین، سریع و بدون نیاز به اینترنتِ پرسرعت'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {dict?.common?.siteDescription || (isEn
            ? 'Financial calculators, image tools, calendar converters, and everyday utilities—running 100% locally in your browser.'
            : 'محاسبات مالی، تبدیل تاریخ و سن، ویرایش متون و امور کاربردی با حفظ ۱۰۰٪ امنیت و حریم خصوصی در مرورگر شما.')}
        </p>

        {/* باکس جستجو با میانبر کیبورد */}
        <div className="max-w-2xl mx-auto pt-4">
          <div className="relative flex items-center">
            <Search className={`absolute ${isEn ? 'left-4' : 'right-4'} w-5 h-5 text-slate-400 pointer-events-none`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  saveRecentSearch(searchQuery);
                }
              }}
              placeholder={dict?.common?.searchPlaceholder || (isEn
                ? 'Search tools (e.g. image compressor, age, password, QR, loan)...'
                : 'جستجو بین ابزارها (مثلاً: سن، وام، نیم‌فاصله، QR، کد ملی، تاس)...')}
              className={`w-full h-13 ${isEn ? 'pl-12 pr-24' : 'pr-12 pl-24'} rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-sm transition-all`}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isEn ? 'right-4' : 'left-4'} p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200`}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className={`absolute ${isEn ? 'right-4' : 'left-4'} hidden sm:flex items-center gap-1`}>
                <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  Ctrl
                </kbd>
                <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  K
                </kbd>
              </div>
            )}
          </div>

          {/* کلمات پرجستجو یا اخیر */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 mx-1">
                <Clock className="w-3.5 h-3.5" /> {isEn ? 'Recent searches:' : 'جستجوهای اخیر:'}
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors"
                >
                  {term}
                </button>
              ))}
              <button
                onClick={clearRecentSearches}
                className="text-[11px] text-slate-400 hover:text-red-500 mx-1 transition-colors"
              >
                {isEn ? '(Clear)' : '(پاک‌سازی)'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* فیلتر تب‌های دسته‌بندی */}
      <section className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-5">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
          }`}
        >
          {isEn ? `All Categories (${localizedTools.length})` : `همه دسته‌ها (${localizedTools.length})`}
        </button>

        {localizedCategories.map((cat) => {
          const count = localizedTools.filter((t) => t.category === cat.id).length;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
              }`}
            >
              <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
              <span>{cat.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </section>

      {/* نمایش ابزارها */}
      <section className="space-y-12">
        {totalResultsCount === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'No tools found matching your search' : 'ابزاری با این مشخصات پیدا نشد'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isEn ? 'Try searching for something else or switch categories.' : 'عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {isEn ? 'View All Tools' : 'مشاهده تمام ابزارها'}
            </button>
          </div>
        ) : (
          groupedSections.map(({ category, tools }) => (
            <div key={category.id} className="space-y-4">
              {/* هدر بخش دسته‌بندی */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <DynamicIcon name={category.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {category.title}
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({tools.length})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {category.description}
                    </p>
                  </div>
                </div>

                {selectedCategory === 'all' && (
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline hidden sm:flex items-center gap-1 font-medium"
                  >
                    <span>{isEn ? 'View Category' : 'مشاهده دسته'}</span>
                    {isEn ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* شبکه کارت‌های این دسته‌بندی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`${prefix}/${tool.slug}`}
                    onClick={() => {
                      if (searchQuery.trim()) {
                        saveRecentSearch(searchQuery);
                      }
                    }}
                    className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <DynamicIcon name={tool.icon} className="w-5 h-5" />
                        </div>
                        {tool.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <span>{isEn ? 'Open Tool' : 'ورود به ابزار'}</span>
                      {isEn ? (
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                      ) : (
                        <ArrowUpLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
