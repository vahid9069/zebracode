'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Scale,
  Ruler,
  Thermometer,
  HardDrive,
  Copy,
  Check,
  Maximize2,
  Gauge,
  Sparkles
} from 'lucide-react';

interface UnitConverterProps {
  locale?: string;
  dict?: any;
}

type UnitType = 'length' | 'weight' | 'temp' | 'data' | 'area' | 'speed';

interface UnitDef {
  nameFa: string;
  nameEn: string;
  factor: number; // relative to base unit
}

const UNITS: Record<UnitType, Record<string, UnitDef>> = {
  length: {
    meter: { nameFa: 'متر (m)', nameEn: 'Meter (m)', factor: 1 },
    cm: { nameFa: 'سانتی‌متر (cm)', nameEn: 'Centimeter (cm)', factor: 0.01 },
    mm: { nameFa: 'میلی‌متر (mm)', nameEn: 'Millimeter (mm)', factor: 0.001 },
    km: { nameFa: 'کیلومتر (km)', nameEn: 'Kilometer (km)', factor: 1000 },
    inch: { nameFa: 'اینچ (in)', nameEn: 'Inch (in)', factor: 0.0254 },
    foot: { nameFa: 'فوت (ft)', nameEn: 'Foot (ft)', factor: 0.3048 },
    yard: { nameFa: 'یارد (yd)', nameEn: 'Yard (yd)', factor: 0.9144 },
    mile: { nameFa: 'مایل (mi)', nameEn: 'Mile (mi)', factor: 1609.344 },
  },
  weight: {
    kg: { nameFa: 'کیلوگرم (kg)', nameEn: 'Kilogram (kg)', factor: 1 },
    gram: { nameFa: 'گرم (g)', nameEn: 'Gram (g)', factor: 0.001 },
    mesghal: { nameFa: 'مثقال ایرانی (۴.۶۰۸ گرم)', nameEn: 'Mesghal (4.608g)', factor: 0.004608 },
    soot: { nameFa: 'سوت زرگری (۰.۰۰۱ گرم)', nameEn: 'Soot (1mg)', factor: 0.000001 },
    pound: { nameFa: 'پوند (lb)', nameEn: 'Pound (lb)', factor: 0.45359237 },
    ounce: { nameFa: 'اونس (oz)', nameEn: 'Ounce (oz)', factor: 0.0283495 },
    ton: { nameFa: 'تن متریک (Tonne)', nameEn: 'Metric Ton (t)', factor: 1000 },
  },
  temp: {
    celsius: { nameFa: 'سلسیوس / سانتی‌گراد (°C)', nameEn: 'Celsius (°C)', factor: 1 },
    fahrenheit: { nameFa: 'فارنهایت (°F)', nameEn: 'Fahrenheit (°F)', factor: 1 },
    kelvin: { nameFa: 'کلوین (K)', nameEn: 'Kelvin (K)', factor: 1 },
  },
  data: {
    mb: { nameFa: 'مگابایت (MB)', nameEn: 'Megabyte (MB)', factor: 1 },
    gb: { nameFa: 'گیگابایت (GB)', nameEn: 'Gigabyte (GB)', factor: 1024 },
    tb: { nameFa: 'ترابایت (TB)', nameEn: 'Terabyte (TB)', factor: 1024 * 1024 },
    kb: { nameFa: 'کیلوبایت (KB)', nameEn: 'Kilobyte (KB)', factor: 1 / 1024 },
    byte: { nameFa: 'بایت (Byte)', nameEn: 'Byte (B)', factor: 1 / (1024 * 1024) },
    mbit: { nameFa: 'مگابیت شبکه (Mbps)', nameEn: 'Megabit (Mbit)', factor: 1 / 8 },
  },
  area: {
    sqm: { nameFa: 'متر مربع (m²)', nameEn: 'Square Meter (m²)', factor: 1 },
    hectare: { nameFa: 'هکتار (۱۰,۰۰۰ متر)', nameEn: 'Hectare (ha)', factor: 10000 },
    sqkm: { nameFa: 'کیلومتر مربع (km²)', nameEn: 'Square Kilometer (km²)', factor: 1000000 },
    acre: { nameFa: 'جریب / ایکر (Acre)', nameEn: 'Acre (ac)', factor: 4046.86 },
    sqft: { nameFa: 'فوت مربع (ft²)', nameEn: 'Square Foot (ft²)', factor: 0.092903 },
  },
  speed: {
    kmh: { nameFa: 'کیلومتر بر ساعت (km/h)', nameEn: 'Kilometers per hour (km/h)', factor: 1 },
    ms: { nameFa: 'متر بر ثانیه (m/s)', nameEn: 'Meters per second (m/s)', factor: 3.6 },
    mph: { nameFa: 'مایل بر ساعت (mph)', nameEn: 'Miles per hour (mph)', factor: 1.60934 },
    knot: { nameFa: 'گره دریایی (Knot)', nameEn: 'Knot (kn)', factor: 1.852 },
  },
};

export function UnitConverter({ locale = 'fa', dict }: UnitConverterProps) {
  const isEn = locale === 'en';
  const [category, setCategory] = useState<UnitType>('weight');
  const [amount, setAmount] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('kg');
  const [toUnit, setToUnit] = useState<string>('gram');
  const [copied, setCopied] = useState<boolean>(false);

  const convert = () => {
    const val = Number(amount) || 0;
    if (category === 'temp') {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(result.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'weight' as UnitType, labelFa: 'وزن و جرم', labelEn: 'Weight & Mass', icon: Scale },
    { id: 'length' as UnitType, labelFa: 'طول و مسافت', labelEn: 'Length & Distance', icon: Ruler },
    { id: 'temp' as UnitType, labelFa: 'دما و حرارت', labelEn: 'Temperature', icon: Thermometer },
    { id: 'data' as UnitType, labelFa: 'داده و حافظه', labelEn: 'Digital Data', icon: HardDrive },
    { id: 'area' as UnitType, labelFa: 'مساحت و زمین', labelEn: 'Area', icon: Maximize2 },
    { id: 'speed' as UnitType, labelFa: 'سرعت و شتاب', labelEn: 'Speed', icon: Gauge },
  ];

  const currentUnits = UNITS[category];

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isEn ? cat.labelEn : cat.labelFa}</span>
            </button>
          );
        })}
      </div>

      {/* Main Converter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Amount and From Unit */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-500">{isEn ? 'From:' : 'مقدار و واحد مبدأ:'}</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-1/2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-1/2 px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {Object.entries(currentUnits).map(([key, u]) => (
                  <option key={key} value={key}>
                    {isEn ? u.nameEn : u.nameFa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pt-4 md:pt-6">
            <button
              type="button"
              onClick={swapUnits}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-xs"
              title={isEn ? 'Swap units' : 'جابجایی واحدها'}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Result and To Unit */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-500">{isEn ? 'To:' : 'واحد مقصد و تبدیل‌شده:'}</label>
            <div className="flex gap-2">
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {Object.entries(currentUnits).map(([key, u]) => (
                  <option key={key} value={key}>
                    {isEn ? u.nameEn : u.nameFa}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Big Conversion Display */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800 border border-blue-200/60 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isEn ? 'Calculated Equivalent' : 'نتیجه تبدیل دقیق'}
            </span>
            <div className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              {isEn ? result.toLocaleString(undefined, { maximumFractionDigits: 8 }) : result.toLocaleString('fa-IR', { maximumFractionDigits: 8 })}
              <span className="text-sm font-normal text-slate-600 dark:text-slate-300 mr-2">
                {isEn ? currentUnits[toUnit]?.nameEn : currentUnits[toUnit]?.nameFa}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی مقدار')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
