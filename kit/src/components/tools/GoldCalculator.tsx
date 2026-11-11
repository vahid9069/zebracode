'use client';

import React, { useState } from 'react';
import { Coins, CircleDollarSign, Calculator, HelpCircle } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

export function GoldCalculator() {
  const [tab, setTab] = useState<'jewelry' | 'coin'>('jewelry');

  // متغیرهای محاسبه طلا
  const [weight, setWeight] = useState<number>(3.5); // گرم
  const [rawPrice, setRawPrice] = useState<number>(4500000); // قیمت هر گرم طلای ۱۸ عیار به تومان
  const [wagePercent, setWagePercent] = useState<number>(12); // درصد اجرت ساخت
  const [profitPercent, setProfitPercent] = useState<number>(7); // درصد سود فروشنده (مصوب اتحادیه ۷٪)
  const [taxPercent, setTaxPercent] = useState<number>(9); // مالیات ۹٪ بر ارزش افزوده روی سود و اجرت

  // متغیرهای محاسبه حباب سکه
  const [coinType, setCoinType] = useState<'emami' | 'bahar' | 'half' | 'quarter'>('emami');
  const [marketCoinPrice, setMarketCoinPrice] = useState<number>(50000000); // قیمت بازار به تومان

  // مشخصات سکه‌ها بر اساس وزن و عیار (عیار سکه ۹۰۰ یا ۲۱.۶ است = ضربدر ۰.۹ / ۰.۷۵۰ برای تبدیل به ۱۸ عیار)
  const COIN_SPECS = {
    emami: { name: 'تمام سکه بهار آزادی (امامی)', weight: 8.133, purity: 0.9 },
    bahar: { name: 'تمام سکه طرح قدیم', weight: 8.133, purity: 0.9 },
    half: { name: 'نیم سکه بهار آزادی', weight: 4.066, purity: 0.9 },
    quarter: { name: 'ربع سکه بهار آزادی', weight: 2.033, purity: 0.9 },
  };

  // فرمول محاسبه قیمت طلا (طبق قانون جدید مالیات مصوب مجلس: مالیات فقط روی اجرت + سود اعمال می‌شود)
  const calculateJewelry = () => {
    const w = Number(weight) || 0;
    const p = Number(rawPrice) || 0;
    const wage = Number(wagePercent) || 0;
    const profit = Number(profitPercent) || 0;
    const tax = Number(taxPercent) || 0;

    const rawTotal = w * p;
    const wageTotal = rawTotal * (wage / 100);
    const profitTotal = (rawTotal + wageTotal) * (profit / 100);
    const taxTotal = (wageTotal + profitTotal) * (tax / 100);
    const finalTotal = rawTotal + wageTotal + profitTotal + taxTotal;

    return {
      rawTotal: Math.round(rawTotal),
      wageTotal: Math.round(wageTotal),
      profitTotal: Math.round(profitTotal),
      taxTotal: Math.round(taxTotal),
      finalTotal: Math.round(finalTotal),
    };
  };

  // محاسبه ارزش ذاتی و حباب سکه
  const calculateCoin = () => {
    const spec = COIN_SPECS[coinType];
    const p = Number(rawPrice) || 0; // قیمت هر گرم طلا ۱۸ عیار
    // تبدیل هر گرم ۱۸ عیار به عیار سکه (۹۰۰):
    const pricePerGram900 = (p / 750) * 900;
    const intrinsicValue = spec.weight * pricePerGram900; // ارزش طلای خام سکه
    const bubbleAmount = marketCoinPrice - intrinsicValue;
    const bubblePercent = (bubbleAmount / intrinsicValue) * 100;

    return {
      intrinsicValue: Math.round(intrinsicValue),
      bubbleAmount: Math.round(bubbleAmount),
      bubblePercent: bubblePercent.toFixed(1),
    };
  };

  const jewelryResult = calculateJewelry();
  const coinResult = calculateCoin();

  return (
    <div className="space-y-6">
      {/* تب‌ها */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('jewelry')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'jewelry'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Coins className="w-4 h-4" />
          محاسبه قیمت طلا و زیورآلات
        </button>
        <button
          onClick={() => setTab('coin')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'coin'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CircleDollarSign className="w-4 h-4" />
          محاسبه حباب سکه طلا
        </button>
      </div>

      {tab === 'jewelry' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              مشخصات طلا و فاکتور خرید:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  وزن طلا (گرم):
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  قیمت هر گرم طلا ۱۸ عیار (تومان):
                </label>
                <NumericInput
                  value={rawPrice}
                  onChange={(val) => setRawPrice(val)}
                  unit="تومان"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {rawPrice.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  درصد اجرت ساخت (%):
                </label>
                <input
                  type="number"
                  step={1}
                  value={wagePercent}
                  onChange={(e) => setWagePercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">معمولاً بین ۵٪ تا ۲۵٪</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  سود طلافروش (%):
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={profitPercent}
                  onChange={(e) => setProfitPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">مصوب اتحادیه: ۷ درصد</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  مالیات ارزش افزوده (%):
                </label>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">قانوناً ۹٪ فقط روی اجرت و سود</span>
              </div>
            </div>
          </div>

          {/* ریز محاسبات فاکتور طلا */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">تفکیک اقلام فاکتور خرید</h4>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">قیمت طلای خام:</span>
                <span className="font-bold">{jewelryResult.rawTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">مبلغ اجرت ساخت ({wagePercent}٪):</span>
                <span className="font-bold">{jewelryResult.wageTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">سود فروشنده ({profitPercent}٪):</span>
                <span className="font-bold">{jewelryResult.profitTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span className="text-slate-600 dark:text-slate-400">مالیات ارزش افزوده ({taxPercent}٪):</span>
                <span className="font-bold text-amber-600">{jewelryResult.taxTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex flex-col justify-between shadow-lg shadow-amber-500/20">
              <div>
                <span className="text-xs text-amber-100 font-medium">مبلغ نهایی پرداختی خریدار</span>
                <div className="mt-2 text-3xl font-black">
                  {jewelryResult.finalTotal.toLocaleString('fa-IR')} <span className="text-base font-normal">تومان</span>
                </div>
              </div>
              <div className="pt-4 border-t border-amber-400/40 text-xs text-amber-100 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>محاسبه مطابق با آخرین دستورالعمل رسمی اتحادیه طلا و جواهر کشور</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              مشخصات و قیمت بازار سکه:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  نوع سکه:
                </label>
                <select
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="emami">تمام سکه بهار آزادی (امامی)</option>
                  <option value="bahar">تمام سکه طرح قدیم</option>
                  <option value="half">نیم سکه بهار آزادی</option>
                  <option value="quarter">ربع سکه بهار آزادی</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  وزن: {COIN_SPECS[coinType].weight} گرم با عیار ۹۰۰
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  قیمت معاملاتی بازار (تومان):
                </label>
                <NumericInput
                  value={marketCoinPrice}
                  onChange={(val) => setMarketCoinPrice(val)}
                  unit="تومان"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">ارزش ذاتی طلا (بدون حباب)</span>
              <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                {coinResult.intrinsicValue.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">ارزش واقعی طلای به کار رفته</p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">مبلغ حباب سکه</span>
              <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                {coinResult.bubbleAmount.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">اختلاف قیمت بازار با ارزش ذاتی</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">درصد حباب</span>
              <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
                {coinResult.bubblePercent}٪
              </div>
              <p className="text-xs text-slate-500 mt-1">سهم حباب از ارزش ذاتی</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
