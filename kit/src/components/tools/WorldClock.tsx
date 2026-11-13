'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  Sun,
  Moon,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Check,
  MapPin,
  Sparkles
} from 'lucide-react';

interface CityClock {
  id: string;
  nameFa: string;
  nameEn: string;
  countryFa: string;
  countryEn: string;
  timeZone: string;
}

const AVAILABLE_CITIES: CityClock[] = [
  // Middle East & Iran
  { id: 'tehran', nameFa: 'تهران', nameEn: 'Tehran', countryFa: 'ایران (مبنا)', countryEn: 'Iran (Base)', timeZone: 'Asia/Tehran' },
  { id: 'mashhad', nameFa: 'مشهد', nameEn: 'Mashhad', countryFa: 'ایران', countryEn: 'Iran', timeZone: 'Asia/Tehran' },
  { id: 'istanbul', nameFa: 'استانبول', nameEn: 'Istanbul', countryFa: 'ترکیه', countryEn: 'Turkey', timeZone: 'Europe/Istanbul' },
  { id: 'dubai', nameFa: 'دبی', nameEn: 'Dubai', countryFa: 'امارات متحده عربی', countryEn: 'UAE', timeZone: 'Asia/Dubai' },
  { id: 'baku', nameFa: 'باکو', nameEn: 'Baku', countryFa: 'جمهوری آذربایجان', countryEn: 'Azerbaijan', timeZone: 'Asia/Baku' },
  { id: 'yerevan', nameFa: 'ایروان', nameEn: 'Yerevan', countryFa: 'ارمنستان', countryEn: 'Armenia', timeZone: 'Asia/Yerevan' },
  { id: 'baghdad', nameFa: 'بغداد', nameEn: 'Baghdad', countryFa: 'عراق', countryEn: 'Iraq', timeZone: 'Asia/Baghdad' },
  { id: 'doha', nameFa: 'دوحه', nameEn: 'Doha', countryFa: 'قطر', countryEn: 'Qatar', timeZone: 'Asia/Qatar' },
  { id: 'riyadh', nameFa: 'ریاض', nameEn: 'Riyadh', countryFa: 'عربستان سعودی', countryEn: 'Saudi Arabia', timeZone: 'Asia/Riyadh' },
  { id: 'muscat', nameFa: 'مسقط', nameEn: 'Muscat', countryFa: 'عمان', countryEn: 'Oman', timeZone: 'Asia/Muscat' },
  { id: 'kuwait', nameFa: 'کویت', nameEn: 'Kuwait City', countryFa: 'کویت', countryEn: 'Kuwait', timeZone: 'Asia/Kuwait' },

  // Europe
  { id: 'london', nameFa: 'لندن', nameEn: 'London', countryFa: 'انگلستان (UTC)', countryEn: 'UK (UTC)', timeZone: 'Europe/London' },
  { id: 'frankfurt', nameFa: 'فرانکفورت', nameEn: 'Frankfurt', countryFa: 'آلمان (CET)', countryEn: 'Germany (CET)', timeZone: 'Europe/Berlin' },
  { id: 'berlin', nameFa: 'برلین', nameEn: 'Berlin', countryFa: 'آلمان', countryEn: 'Germany', timeZone: 'Europe/Berlin' },
  { id: 'paris', nameFa: 'پاریس', nameEn: 'Paris', countryFa: 'فرانسه', countryEn: 'France', timeZone: 'Europe/Paris' },
  { id: 'rome', nameFa: 'رم', nameEn: 'Rome', countryFa: 'ایتالیا', countryEn: 'Italy', timeZone: 'Europe/Rome' },
  { id: 'amsterdam', nameFa: 'آمستردام', nameEn: 'Amsterdam', countryFa: 'هلند', countryEn: 'Netherlands', timeZone: 'Europe/Amsterdam' },
  { id: 'stockholm', nameFa: 'استکهلم', nameEn: 'Stockholm', countryFa: 'سوئد', countryEn: 'Sweden', timeZone: 'Europe/Stockholm' },
  { id: 'vienna', nameFa: 'وین', nameEn: 'Vienna', countryFa: 'اتریش', countryEn: 'Austria', timeZone: 'Europe/Vienna' },
  { id: 'geneva', nameFa: 'ژنو', nameEn: 'Geneva', countryFa: 'سوئیس', countryEn: 'Switzerland', timeZone: 'Europe/Zurich' },
  { id: 'madrid', nameFa: 'مادرید', nameEn: 'Madrid', countryFa: 'اسپانیا', countryEn: 'Spain', timeZone: 'Europe/Madrid' },
  { id: 'moscow', nameFa: 'مسکو', nameEn: 'Moscow', countryFa: 'روسیه', countryEn: 'Russia', timeZone: 'Europe/Moscow' },

  // Americas
  { id: 'toronto', nameFa: 'تورنتو', nameEn: 'Toronto', countryFa: 'کانادا (EST)', countryEn: 'Canada (EST)', timeZone: 'America/Toronto' },
  { id: 'vancouver', nameFa: 'ونکوور', nameEn: 'Vancouver', countryFa: 'کانادا (PST)', countryEn: 'Canada (PST)', timeZone: 'America/Vancouver' },
  { id: 'montreal', nameFa: 'مونترال', nameEn: 'Montreal', countryFa: 'کانادا', countryEn: 'Canada', timeZone: 'America/Toronto' },
  { id: 'new_york', nameFa: 'نیویورک', nameEn: 'New York', countryFa: 'ایالات متحده (EST)', countryEn: 'USA (EST)', timeZone: 'America/New_York' },
  { id: 'washington', nameFa: 'واشنگتن', nameEn: 'Washington DC', countryFa: 'ایالات متحده آمریکا', countryEn: 'USA', timeZone: 'America/New_York' },
  { id: 'chicago', nameFa: 'شیکاگو', nameEn: 'Chicago', countryFa: 'ایالات متحده (CST)', countryEn: 'USA (CST)', timeZone: 'America/Chicago' },
  { id: 'los_angeles', nameFa: 'لس آنجلس', nameEn: 'Los Angeles', countryFa: 'ایالات متحده (PST)', countryEn: 'USA (PST)', timeZone: 'America/Los_Angeles' },
  { id: 'san_francisco', nameFa: 'سان فرانسیسکو', nameEn: 'San Francisco', countryFa: 'ایالات متحده آمریکا', countryEn: 'USA', timeZone: 'America/Los_Angeles' },

  // Asia Pacific
  { id: 'tokyo', nameFa: 'توکیو', nameEn: 'Tokyo', countryFa: 'ژاپن', countryEn: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: 'seoul', nameFa: 'سئول', nameEn: 'Seoul', countryFa: 'کره جنوبی', countryEn: 'South Korea', timeZone: 'Asia/Seoul' },
  { id: 'beijing', nameFa: 'پکن', nameEn: 'Beijing', countryFa: 'چین', countryEn: 'China', timeZone: 'Asia/Shanghai' },
  { id: 'singapore', nameFa: 'سنگاپور', nameEn: 'Singapore', countryFa: 'سنگاپور', countryEn: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'kuala_lumpur', nameFa: 'کوالالامپور', nameEn: 'Kuala Lumpur', countryFa: 'مالزی', countryEn: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'delhi', nameFa: 'دهلی نو', nameEn: 'New Delhi', countryFa: 'هند', countryEn: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'sydney', nameFa: 'سیدنی', nameEn: 'Sydney', countryFa: 'استرالیا', countryEn: 'Australia', timeZone: 'Australia/Sydney' },
  { id: 'melbourne', nameFa: 'ملبورن', nameEn: 'Melbourne', countryFa: 'استرالیا', countryEn: 'Australia', timeZone: 'Australia/Melbourne' },
  { id: 'auckland', nameFa: 'اوکلند', nameEn: 'Auckland', countryFa: 'نیوزیلند', countryEn: 'New Zealand', timeZone: 'Pacific/Auckland' },
];

const DEFAULT_CITY_IDS = ['tehran', 'istanbul', 'dubai', 'london', 'frankfurt', 'toronto', 'new_york', 'tokyo'];
const STORAGE_KEY = 'zebracode_kit_user_cities';

interface WorldClockProps {
  locale?: string;
  dict?: any;
}

export function WorldClock({ locale = 'fa', dict }: WorldClockProps) {
  const isEn = locale === 'en';
  const [now, setNow] = useState<Date>(new Date());
  const [userCityIds, setUserCityIds] = useState<string[]>(DEFAULT_CITY_IDS);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserCityIds(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCities = (ids: string[]) => {
    setUserCityIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const handleAddCity = (id: string) => {
    if (!userCityIds.includes(id)) {
      saveCities([...userCityIds, id]);
    }
  };

  const handleRemoveCity = (id: string) => {
    saveCities(userCityIds.filter((item) => item !== id));
  };

  const handleResetToDefault = () => {
    saveCities(DEFAULT_CITY_IDS);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInfo = (timeZone: string) => {
    const timeFormatter = new Intl.DateTimeFormat(isEn ? 'en-US' : 'fa-IR', {
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

    const dateFormatter = new Intl.DateTimeFormat(isEn ? 'en-US' : 'fa-IR', {
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

  const getDiffWithTehran = (timeZone: string) => {
    if (timeZone === 'Asia/Tehran') return isEn ? 'Base Time (Tehran)' : 'زمان مبنا (تهران)';
    try {
      const tehranDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone }));
      const diffMs = targetDate.getTime() - tehranDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const absH = Math.floor(Math.abs(diffHours));
      const absM = Math.round((Math.abs(diffHours) - absH) * 60);

      let text = '';
      if (absM > 0) {
        text = isEn ? `${absH}h ${absM}m` : `${absH} ساعت و ${absM} دقیقه`;
      } else {
        text = isEn ? `${absH}h` : `${absH} ساعت`;
      }

      if (diffHours > 0) return isEn ? `${text} ahead of Tehran (+${diffHours}h)` : `${text} جلوتر از تهران (+${diffHours}h)`;
      if (diffHours < 0) return isEn ? `${text} behind Tehran (${diffHours}h)` : `${text} عقب‌تر از تهران (${diffHours}h)`;
      return isEn ? 'Same time as Tehran' : 'هم‌زمان با تهران';
    } catch {
      return '';
    }
  };

  const activeCities = userCityIds
    .map((id) => AVAILABLE_CITIES.find((c) => c.id === id))
    .filter(Boolean) as CityClock[];

  const filteredActiveCities = activeCities.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nameFa.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.countryFa.toLowerCase().includes(q) ||
      c.countryEn.toLowerCase().includes(q) ||
      c.timeZone.toLowerCase().includes(q)
    );
  });

  const availableToAdd = AVAILABLE_CITIES.filter((c) => {
    if (userCityIds.includes(c.id)) return false;
    const q = modalSearch.toLowerCase();
    return (
      c.nameFa.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.countryFa.toLowerCase().includes(q) ||
      c.countryEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEn ? 'Search active cities...' : 'جستجو در شهرهای فعال...'}
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Add City' : 'افزودن شهر'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={isEn ? 'Reset to defaults' : 'ریست به شهرهای پیش‌فرض'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clocks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredActiveCities.map((city) => {
          const { timeStr, dateStr, isDay } = getTimeInfo(city.timeZone);
          const diffStr = getDiffWithTehran(city.timeZone);

          return (
            <div
              key={city.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{isEn ? city.nameEn : city.nameFa}</span>
                  </h4>
                  <span className="text-xs text-slate-400 block mt-0.5">{isEn ? city.countryEn : city.countryFa}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-xl ${
                      isDay ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    {isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>

                  {city.id !== 'tehran' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(city.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      title={isEn ? 'Remove' : 'حذف'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Time Display */}
              <div className="py-2 text-center">
                <div className="text-3xl sm:text-4xl font-mono font-black text-slate-900 dark:text-white tracking-widest" dir="ltr">
                  {timeStr}
                </div>
                <div className="text-xs text-slate-500 mt-2 font-medium">{dateStr}</div>
              </div>

              {/* Time difference badge */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center font-medium">
                {diffStr}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>{isEn ? 'Add City to World Clock' : 'افزودن شهر به ساعت جهانی'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={isEn ? 'Type city or country name...' : 'نام شهر یا کشور را جستجو کنید...'}
                className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {availableToAdd.length > 0 ? (
                availableToAdd.map((city) => (
                  <div
                    key={city.id}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? city.nameEn : city.nameFa}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{isEn ? city.countryEn : city.countryFa}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddCity(city.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all"
                    >
                      {isEn ? 'Add' : 'افزودن'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isEn ? 'No remaining cities found' : 'شهری با این عنوان یافت نشد یا قبلاً اضافه شده است'}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                {isEn ? 'Close' : 'بستن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
