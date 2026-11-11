'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, Scale, Ruler, Thermometer, Box, HardDrive } from 'lucide-react';

type UnitType = 'length' | 'weight' | 'temp' | 'data';

interface UnitDef {
  name: string;
  factor: number; // نسبت به واحد پایه
}

const UNITS: Record<UnitType, Record<string, UnitDef>> = {
  length: {
    meter: { name: 'متر (m)', factor: 1 },
    cm: { name: 'سانتی‌متر (cm)', factor: 0.01 },
    mm: { name: 'میلی‌متر (mm)', factor: 0.001 },
    km: { name: 'کیلومتر (km)', factor: 1000 },
    inch: { name: 'اینچ (Inch)', factor: 0.0254 },
    foot: { name: 'فوت (Foot)', factor: 0.3048 },
    yard: { name: 'یارد (Yard)', factor: 0.9144 },
    mile: { name: 'مایل (Mile)', factor: 1609.344 },
  },
  weight: {
    kg: { name: 'کیلوگرم (kg)', factor: 1 },
    gram: { name: 'گرم (g)', factor: 0.001 },
    mesghal: { name: 'مثقال ایرانی (۴.۶۰۸ گرم)', factor: 0.004608 },
    soot: { name: 'سوت (۰.۰۰۱ گرم)', factor: 0.000001 },
    pound: { name: 'پوند (lb)', factor: 0.45359237 },
    ounce: { name: 'اونس (oz)', factor: 0.0283495 },
    ton: { name: 'تن (Tonne)', factor: 1000 },
  },
  temp: {
    celsius: { name: 'سلسیوس / سانتی‌گراد (°C)', factor: 1 },
    fahrenheit: { name: 'فارنهایت (°F)', factor: 1 },
    kelvin: { name: 'کلوین (K)', factor: 1 },
  },
  data: {
    mb: { name: 'مگابایت (MB)', factor: 1 },
    gb: { name: 'گیگابایت (GB)', factor: 1024 },
    tb: { name: 'ترابایت (TB)', factor: 1024 * 1024 },
    kb: { name: 'کیلوبایت (KB)', factor: 1 / 1024 },
    byte: { name: 'بایت (Byte)', factor: 1 / (1024 * 1024) },
    mbit: { name: 'مگابیت اینترنت (Mbps)', factor: 1 / 8 },
  },
};

export function UnitConverter() {
  const [category, setCategory] = useState<UnitType>('weight');
  const [amount, setAmount] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('kg');
  const [toUnit, setToUnit] = useState<string>('gram');

  const convert = () => {
    const val = Number(amount) || 0;
    if (category === 'temp') {
      // تبدیل دما
      let celsius = val;
      if (fromUnit === 'fahrenheit') celsius = ((val - 32) * 5) / 9;
      else if (fromUnit === 'kelvin') celsius = val - 273.15;

      if (toUnit === 'celsius') return celsius;
      if (toUnit === 'fahrenheit') return (celsius * 9) / 5 + 32;
      if (toUnit === 'kelvin') return celsius + 273.15;
      return celsius;
    }

    const currentUnits = UNITS[category];
    const fromFactor = currentUnits[fromUnit]?.factor || 1;
    const toFactor = currentUnits[toUnit]?.factor || 1;

    const baseVal = val * fromFactor;
    return baseVal / toFactor;
  };

  const result = convert();

  const handleCategoryChange = (cat: UnitType) => {
    setCategory(cat);
    const keys = Object.keys(UNITS[cat]);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="space-y-6">
      {/* تب‌های نوع واحد */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => handleCategoryChange('weight')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            category === 'weight'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          وزن و جرم (مثقال، گرم، اونس)
        </button>
        <button
          onClick={() => handleCategoryChange('length')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            category === 'length'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ruler className="w-4 h-4" />
          طول و مسافت (اینچ، متر، فوت)
        </button>
        <button
          onClick={() => handleCategoryChange('temp')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            category === 'temp'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          دما (°C و °F)
        </button>
        <button
          onClick={() => handleCategoryChange('data')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            category === 'data'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          حافظه و سرعت اینترنت (MB, GB, Mbps)
        </button>
      </div>

      {/* فرم تبدیل واحد */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">مقدار و واحد مبدأ:</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold mb-2"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              {Object.entries(UNITS[category]).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center md:pt-4">
            <button
              onClick={swapUnits}
              title="جابجایی واحدها"
              className="p-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">واحد مقصد جهت تبدیل:</label>
            <div className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-sm font-black text-blue-600 dark:text-blue-400 mb-2 truncate">
              {Number(result.toFixed(6)).toLocaleString('fa-IR')}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              {Object.entries(UNITS[category]).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* کارت نتیجه نهایی */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 text-center">
        <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">نتیجه تبدیل دقیق:</span>
        <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
          {amount.toLocaleString('fa-IR')} {UNITS[category][fromUnit]?.name} = {Number(result.toFixed(6)).toLocaleString('fa-IR')} {UNITS[category][toUnit]?.name}
        </div>
      </div>
    </div>
  );
}
