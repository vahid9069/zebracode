'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Clock, Sun, Moon, Search, Plus, Trash2, RotateCcw, X, Check } from 'lucide-react';

interface CityClock {
  id: string;
  name: string;
  country: string;
  timeZone: string;
}

// کتابخانه جامع شهرهای جهان
const AVAILABLE_CITIES: CityClock[] = [
  // ایران و خاورمیانه
  { id: 'tehran', name: 'تهران', country: 'ایران (مبنا)', timeZone: 'Asia/Tehran' },
  { id: 'mashhad', name: 'مشهد', country: 'ایران', timeZone: 'Asia/Tehran' },
  { id: 'istanbul', name: 'استانبول', country: 'ترکیه', timeZone: 'Europe/Istanbul' },
  { id: 'dubai', name: 'دبی', country: 'امارات متحده عربی', timeZone: 'Asia/Dubai' },
  { id: 'baku', name: 'باکو', country: 'جمهوری آذربایجان', timeZone: 'Asia/Baku' },
  { id: 'yerevan', name: 'ایروان', country: 'ارمنستان', timeZone: 'Asia/Yerevan' },
  { id: 'baghdad', name: 'بغداد', country: 'عراق', timeZone: 'Asia/Baghdad' },
  { id: 'doha', name: 'دوحه', country: 'قطر', timeZone: 'Asia/Qatar' },
  { id: 'riyadh', name: 'ریاض', country: 'عربستان سعودی', timeZone: 'Asia/Riyadh' },
  { id: 'muscat', name: 'مسقط', country: 'عمان', timeZone: 'Asia/Muscat' },
  { id: 'kuwait', name: 'کویت', country: 'کویت', timeZone: 'Asia/Kuwait' },

  // اروپا
  { id: 'london', name: 'لندن', country: 'انگلستان', timeZone: 'Europe/London' },
  { id: 'frankfurt', name: 'فرانکفورت', country: 'آلمان', timeZone: 'Europe/Berlin' },
  { id: 'berlin', name: 'برلین', country: 'آلمان', timeZone: 'Europe/Berlin' },
  { id: 'paris', name: 'پاریس', country: 'فرانسه', timeZone: 'Europe/Paris' },
  { id: 'rome', name: 'رم', country: 'ایتالیا', timeZone: 'Europe/Rome' },
  { id: 'amsterdam', name: 'آمستردام', country: 'هلند', timeZone: 'Europe/Amsterdam' },
  { id: 'stockholm', name: 'استکهلم', country: 'سوئد', timeZone: 'Europe/Stockholm' },
  { id: 'vienna', name: 'وین', country: 'اتریش', timeZone: 'Europe/Vienna' },
  { id: 'geneva', name: 'ژنو', country: 'سوئیس', timeZone: 'Europe/Zurich' },
  { id: 'madrid', name: 'مادرید', country: 'اسپانیا', timeZone: 'Europe/Madrid' },
  { id: 'moscow', name: 'مسکو', country: 'روسیه', timeZone: 'Europe/Moscow' },

  // قاره آمریکا
  { id: 'toronto', name: 'تورنتو', country: 'کانادا', timeZone: 'America/Toronto' },
  { id: 'vancouver', name: 'ونکوور', country: 'کانادا', timeZone: 'America/Vancouver' },
  { id: 'montreal', name: 'مونترال', country: 'کانادا', timeZone: 'America/Toronto' },
  { id: 'new_york', name: 'نیویورک', country: 'ایالات متحده آمریکا', timeZone: 'America/New_York' },
  { id: 'washington', name: 'واشنگتن', country: 'ایالات متحده آمریکا', timeZone: 'America/New_York' },
  { id: 'chicago', name: 'شیکاگو', country: 'ایالات متحده آمریکا', timeZone: 'America/Chicago' },
  { id: 'los_angeles', name: 'لس آنجلس', country: 'ایالات متحده آمریکا', timeZone: 'America/Los_Angeles' },
  { id: 'san_francisco', name: 'سان فرانسیسکو', country: 'ایالات متحده آمریکا', timeZone: 'America/Los_Angeles' },

  // شرق و جنوب آسیا و اقیانوسیه
  { id: 'tokyo', name: 'توکیو', country: 'ژاپن', timeZone: 'Asia/Tokyo' },
  { id: 'seoul', name: 'سئول', country: 'کره جنوبی', timeZone: 'Asia/Seoul' },
  { id: 'beijing', name: 'پکن', country: 'چین', timeZone: 'Asia/Shanghai' },
  { id: 'singapore', name: 'سنگاپور', country: 'سنگاپور', timeZone: 'Asia/Singapore' },
  { id: 'kuala_lumpur', name: 'کوالالامپور', country: 'مالزی', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'delhi', name: 'دهلی نو', country: 'هند', timeZone: 'Asia/Kolkata' },
  { id: 'sydney', name: 'سیدنی', country: 'استرالیا', timeZone: 'Australia/Sydney' },
  { id: 'melbourne', name: 'ملبورن', country: 'استرالیا', timeZone: 'Australia/Melbourne' },
  { id: 'auckland', name: 'اوکلند', country: 'نیوزیلند', timeZone: 'Pacific/Auckland' },
];

const DEFAULT_CITY_IDS = ['tehran', 'istanbul', 'dubai', 'london', 'frankfurt', 'toronto', 'new_york', 'tokyo'];
const STORAGE_KEY = 'zebracode_kit_user_cities';

export function WorldClock() {
  const [now, setNow] = useState<Date>(new Date());
  const [userCityIds, setUserCityIds] = useState<string[]>(DEFAULT_CITY_IDS);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');

  // بازیابی شهرهای ذخیره شده کاربر از حافظه مرورگر
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

  // ذخیره در localStorage با هر تغییر
  const saveCities = (ids: string[]) => {
    setUserCityIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  // اضافه کردن شهر جدید
  const handleAddCity = (id: string) => {
    if (!userCityIds.includes(id)) {
      saveCities([...userCityIds, id]);
    }
  };

  // حذف شهر از لیست
  const handleRemoveCity = (id: string) => {
    saveCities(userCityIds.filter((item) => item !== id));
  };

  // ریست به شهرهای پیش‌فرض
  const handleResetToDefault = () => {
    saveCities(DEFAULT_CITY_IDS);
  };

  // آپدیت ثانیه‌ای زمان زنده
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

  // شهرهای فعال کاربر
  const activeCities = userCityIds
    .map((id) => AVAILABLE_CITIES.find((c) => c.id === id))
    .filter(Boolean) as CityClock[];

  const filteredActiveCities = activeCities.filter(
    (c) =>
      c.name.includes(search) ||
      c.country.includes(search) ||
      c.timeZone.toLowerCase().includes(search.toLowerCase())
  );

  // شهرهای قابل اضافه شدن در مدال
  const availableToAdd = AVAILABLE_CITIES.filter(
    (c) =>
      !userCityIds.includes(c.id) &&
      (c.name.includes(modalSearch) ||
        c.country.includes(modalSearch) ||
        c.timeZone.toLowerCase().includes(modalSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ساعت شاخص تهران */}
      {(() => {
        const tehran = getTimeInfo('Asia/Tehran');
        return (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
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

      {/* نوار کنترل، جستجو و دکمه افزودن شهر */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو بین شهرهای فعال شما..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            افزودن شهر جدید ({AVAILABLE_CITIES.length - userCityIds.length} شهر دیگر)
          </button>

          <button
            onClick={handleResetToDefault}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="بازنشانی به شهرهای پیش‌فرض"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شبکه کارت‌های ساعت شهرهای فعال */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActiveCities.map((city) => {
          const info = getTimeInfo(city.timeZone);
          const diff = getDiffWithTehran(city.timeZone);

          return (
            <div
              key={city.id}
              className={`group relative p-5 rounded-2xl border transition-all ${
                city.id === 'tehran'
                  ? 'border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* دکمه حذف شهر */}
              <button
                onClick={() => handleRemoveCity(city.id)}
                className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title={`حذف ${city.name} از لیست شما`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start justify-between pl-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{city.name}</h3>
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

      {filteredActiveCities.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <p className="text-sm text-slate-500">شهری با این نام در لیست فعال شما یافت نشد.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            جستجو و افزودن از بین تمام شهرهای جهان
          </button>
        </div>
      )}

      {/* مدال انتخاب و افزودن شهر جدید */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* هدر مدال */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">افزودن شهر به ساعت جهانی</h3>
                <p className="text-xs text-slate-400 mt-0.5">شهر مورد نظر خود را انتخاب کنید تا به داشبورد شما اضافه شود.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* کادر سرچ داخل مدال */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی شهر یا کشور (مثلاً: پاریس، ونکوور، باکو)..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* لیست اسکرول‌خور شهرهای قابل افزودن */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
              {availableToAdd.length > 0 ? (
                availableToAdd.map((city) => (
                  <div
                    key={city.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{city.name}</h4>
                      <span className="text-xs text-slate-400">{city.country} • {city.timeZone}</span>
                    </div>

                    <button
                      onClick={() => handleAddCity(city.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      افزودن
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  {modalSearch ? 'شهری با این عنوان یافت نشد.' : 'تمامی شهرهای موجود در کتابخانه به لیست شما افزوده شده‌اند!'}
                </div>
              )}
            </div>

            {/* فوتر مدال */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
