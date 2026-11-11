'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Clock, Sun, Moon, Search } from 'lucide-react';

interface CityClock {
  id: string;
  name: string;
  country: string;
  timeZone: string;
}

const CITIES: CityClock[] = [
  { id: 'tehran', name: 'تهران', country: 'ایران (مبنا)', timeZone: 'Asia/Tehran' },
  { id: 'istanbul', name: 'استانبول', country: 'ترکیه', timeZone: 'Europe/Istanbul' },
  { id: 'dubai', name: 'دبی', country: 'امارات متحده عربی', timeZone: 'Asia/Dubai' },
  { id: 'london', name: 'لندن', country: 'انگلستان', timeZone: 'Europe/London' },
  { id: 'frankfurt', name: 'فرانکفورت', country: 'آلمان', timeZone: 'Europe/Berlin' },
  { id: 'toronto', name: 'تورنتو', country: 'کانادا', timeZone: 'America/Toronto' },
  { id: 'new_york', name: 'نیویورک', country: 'ایالات متحده آمریکا', timeZone: 'America/New_York' },
  { id: 'los_angeles', name: 'لس آنجلس', country: 'ایالات متحده آمریکا', timeZone: 'America/Los_Angeles' },
  { id: 'tokyo', name: 'توکیو', country: 'ژاپن', timeZone: 'Asia/Tokyo' },
  { id: 'sydney', name: 'سیدنی', country: 'استرالیا', timeZone: 'Australia/Sydney' },
];

export function WorldClock() {
  const [now, setNow] = useState<Date>(new Date());
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInfo = (timeZone: string) => {
    const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const timeStr = timeFormatter.format(now);
    const dateStr = dateFormatter.format(now);
    const hourNum = parseInt(hourFormatter.format(now), 10);
    const isDay = hourNum >= 6 && hourNum < 18;

    return { timeStr, dateStr, hourNum, isDay };
  };

  // محاسبه اختلاف زمانی با تهران
  const getDiffWithTehran = (timeZone: string) => {
    if (timeZone === 'Asia/Tehran') return 'زمان مبنا';
    try {
      const tehranDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone }));
      const diffMs = targetDate.getTime() - tehranDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const sign = diffHours >= 0 ? '+' : '';
      const absH = Math.floor(Math.abs(diffHours));
      const absM = Math.round((Math.abs(diffHours) - absH) * 60);

      let text = '';
      if (absM > 0) {
        text = `${absH} ساعت و ${absM} دقیقه`;
      } else {
        text = `${absH} ساعت`;
      }

      if (diffHours > 0) return `${text} جلوتر از تهران (+${diffHours}h)`;
      if (diffHours < 0) return `${text} عقب‌تر از تهران (${diffHours}h)`;
      return 'هم‌زمان با تهران';
    } catch {
      return '';
    }
  };

  const filtered = CITIES.filter(
    (c) => c.name.includes(search) || c.country.includes(search) || c.timeZone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ساعت شاخص تهران */}
      {(() => {
        const tehran = getTimeInfo('Asia/Tehran');
        return (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-100 text-xs sm:text-sm font-semibold">
                <Globe className="w-4 h-4" />
                ساعت رسمی جمهوری اسلامی ایران
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">تهران، ایران</h2>
              <p className="text-blue-100 text-xs sm:text-sm pt-1">{tehran.dateStr}</p>
            </div>
            <div className="text-center sm:text-left font-mono font-black text-4xl sm:text-6xl tracking-widest bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm" dir="ltr">
              {tehran.timeStr}
            </div>
          </div>
        );
      })()}

      {/* جستجو بین پایتخت‌ها */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی شهر یا کشور..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          به‌روزرسانی خودکار ثانیه‌ای
        </div>
      </div>

      {/* شبکه ساعت‌های شهرهای جهان */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((city) => {
          const info = getTimeInfo(city.timeZone);
          const diff = getDiffWithTehran(city.timeZone);

          return (
            <div
              key={city.id}
              className={`p-5 rounded-2xl border transition-all ${
                city.id === 'tehran'
                  ? 'border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{city.name}</h3>
                  <span className="text-xs text-slate-400">{city.country}</span>
                </div>
                <div
                  className={`p-2 rounded-xl flex items-center justify-center ${
                    info.isDay
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  }`}
                  title={info.isDay ? 'روز' : 'شب'}
                >
                  {info.isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                  {info.timeStr}
                </span>
                <span className="text-xs text-slate-400">{info.dateStr}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{diff}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
