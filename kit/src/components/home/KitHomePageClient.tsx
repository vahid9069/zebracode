'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES, TOOLS, Tool, Category } from '@/lib/tools';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Search, X, Sparkles, ArrowLeft, SearchX, Clock } from 'lucide-react';

const RECENT_SEARCHES_KEY = 'zebracode_kit_recent_searches';

export function KitHomePageClient() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
  }, []);

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

  // فیلتر هوشمند ابزارها
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        tool.title.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.slug.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const activeCategoryTitle = useMemo(() => {
    if (selectedCategory === 'all') return 'همه ابزارها';
    return CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'ابزارها';
  }, [selectedCategory]);

  return (
    <div className="space-y-10">
      {/* هدر و معرفی */}
      <section className="text-center pt-6 pb-2 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          جعبه‌ابزار عمومی و روزمره زبراکد
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          ابزارهای آنلاین، سریع و بدون نیاز به اینترنتِ پرسرعت
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          محاسبات مالی، تبدیل تاریخ و سن، ویرایش متون و امور کاربردی با حفظ ۱۰۰٪ امنیت و حریم خصوصی در مرورگر شما.
        </p>

        {/* باکس جستجو مشابه صفحه اصلی زبراکد */}
        <div className="max-w-2xl mx-auto pt-4">
          <div className="relative flex items-center">
            <Search className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
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
              placeholder="جستجو بین ابزارها (مثلاً: سن، وام، نیم‌فاصله، QR، کد ملی)..."
              className="w-full h-13 pr-12 pl-24 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-sm transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute left-4 hidden sm:flex items-center gap-1">
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
              <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-1">
                <Clock className="w-3.5 h-3.5" /> جستجوهای اخیر:
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
                className="text-[11px] text-slate-400 hover:text-red-500 mr-1 transition-colors"
              >
                (پاک‌سازی)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* فیلتر تب‌های دسته‌بندی */}
      <section className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
          }`}
        >
          همه ابزارها ({TOOLS.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = TOOLS.filter((t) => t.category === cat.id).length;
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

      {/* لیست نتایج یا ابزارها */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            نمایش <span className="font-bold text-slate-900 dark:text-white">{filteredTools.length}</span> ابزار در <span className="text-blue-600 dark:text-blue-400 font-semibold">{activeCategoryTitle}</span>
          </span>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              بازنشانی فیلترها
            </button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              ابزاری با این مشخصات پیدا نشد
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              مشاهده تمام ابزارها
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}/`}
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {tool.shortDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>ورود به ابزار</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
