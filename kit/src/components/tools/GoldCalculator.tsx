'use client';

import React, { useState } from 'react';
import {
  Coins,
  CircleDollarSign,
  Calculator,
  HelpCircle,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface GoldCalculatorProps {
  locale?: string;
  dict?: any;
}

export function GoldCalculator({ locale = 'fa', dict }: GoldCalculatorProps) {
  const isEn = locale === 'en';
  const [tab, setTab] = useState<'jewelry' | 'coin'>('jewelry');

  // Jewelry calculation states
  const [weight, setWeight] = useState<number>(3.5); // grams
  const [rawPrice, setRawPrice] = useState<number>(4500000); // 18k price per gram in Tomans
  const [wagePercent, setWagePercent] = useState<number>(12); // manufacturing fee %
  const [profitPercent, setProfitPercent] = useState<number>(7); // seller profit (union standard 7%)
  const [taxPercent, setTaxPercent] = useState<number>(9); // 9% VAT on profit and wage only

  // Coin bubble calculation states
  const [coinType, setCoinType] = useState<'emami' | 'bahar' | 'half' | 'quarter' | 'gerami'>('emami');
  const [marketCoinPrice, setMarketCoinPrice] = useState<number>(50000000); // Toman

  const COIN_SPECS = {
    emami: {
      name: isEn ? 'Emami Full Bahar Coin' : 'تمام سکه بهار آزادی (امامی)',
      weight: 8.133,
      purity: 0.9,
    },
    bahar: {
      name: isEn ? 'Old Design Full Bahar Coin' : 'تمام سکه طرح قدیم',
      weight: 8.133,
      purity: 0.9,
    },
    half: {
      name: isEn ? 'Half Bahar Coin' : 'نیم سکه بهار آزادی',
      weight: 4.066,
      purity: 0.9,
    },
    quarter: {
      name: isEn ? 'Quarter Bahar Coin' : 'ربع سکه بهار آزادی',
      weight: 2.033,
      purity: 0.9,
    },
    gerami: {
      name: isEn ? 'Gerami Coin (1 Gram)' : 'سکه گرمی',
      weight: 1.01,
      purity: 0.9,
    },
  };

  // Modern legal formula: VAT 9% only on (wage + profit)
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

  // Coin intrinsic value and bubble
  const calculateCoin = () => {
    const spec = COIN_SPECS[coinType];
    const p = Number(rawPrice) || 0; // 18k price (750 purity)
    // Convert 18k price to 900 purity (coin standard)
    const pricePerGram900 = (p / 750) * 900;
    const intrinsicValue = spec.weight * pricePerGram900;
    const bubbleAmount = marketCoinPrice - intrinsicValue;
    const bubblePercent = intrinsicValue > 0 ? (bubbleAmount / intrinsicValue) * 100 : 0;

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
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab('jewelry')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'jewelry'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{isEn ? 'Gold Jewelry Invoice Calculator' : 'محاسبه قیمت طلا و فاکتور خرید'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('coin')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'coin'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CircleDollarSign className="w-4 h-4" />
          <span>{isEn ? 'Gold Coin Bubble Calculator' : 'محاسبه حباب و ارزش ذاتی سکه'}</span>
        </button>
      </div>

      {tab === 'jewelry' ? (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-500" />
              <span>{isEn ? 'Jewelry Specs & Invoice Items' : 'مشخصات فاکتور و اقلام طلا:'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Weight (Grams):' : 'وزن طلا (گرم):'}
                </label>
                <input
                  type="number"
                  step={0.01}
                  min={0.1}
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0.01, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? '18K Gold Price per Gram (Toman):' : 'قیمت هر گرم طلا ۱۸ عیار (تومان):'}
                </label>
                <NumericInput
                  value={rawPrice}
                  onChange={(val) => setRawPrice(val)}
                  unit={isEn ? 'Toman' : 'تومان'}
                />
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  {isEn ? `${rawPrice.toLocaleString()} Toman` : `${rawPrice.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Manufacturing Wage (%):' : 'درصد اجرت ساخت (%):'}
                </label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={wagePercent}
                  onChange={(e) => setWagePercent(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isEn ? 'Usually between 5% and 25%' : 'معمولاً بین ۵٪ تا ۲۵٪'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Seller Profit (%):' : 'سود فروشنده (%):'}
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={profitPercent}
                  onChange={(e) => setProfitPercent(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isEn ? 'Union Standard: 7%' : 'مصوب اتحادیه طلا: ۷ درصد'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Value-Added Tax (VAT %):' : 'مالیات بر ارزش افزوده (%):'}
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isEn ? '9% only applied on Wage + Profit' : '۹٪ طبق قانون فقط روی اجرت و سود'}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>{isEn ? 'Invoice Line Items' : 'ریز اقلام فاکتور خرید'}</span>
              </h4>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">{isEn ? 'Raw Gold Price:' : 'قیمت طلای خام:'}</span>
                <span className="font-bold font-mono">
                  {isEn ? `${jewelryResult.rawTotal.toLocaleString()} Toman` : `${jewelryResult.rawTotal.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">
                  {isEn ? `Manufacturing Wage (${wagePercent}%):` : `مبلغ اجرت ساخت (${wagePercent}٪):`}
                </span>
                <span className="font-bold font-mono">
                  {isEn ? `${jewelryResult.wageTotal.toLocaleString()} Toman` : `${jewelryResult.wageTotal.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">
                  {isEn ? `Seller Profit (${profitPercent}%):` : `سود طلافروش (${profitPercent}٪):`}
                </span>
                <span className="font-bold font-mono">
                  {isEn ? `${jewelryResult.profitTotal.toLocaleString()} Toman` : `${jewelryResult.profitTotal.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2">
                <span className="text-slate-600 dark:text-slate-400">
                  {isEn ? `VAT (${taxPercent}% on Wage & Profit):` : `مالیات ارزش افزوده (${taxPercent}٪):`}
                </span>
                <span className="font-bold font-mono text-amber-600">
                  {isEn ? `${jewelryResult.taxTotal.toLocaleString()} Toman` : `${jewelryResult.taxTotal.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex flex-col justify-between shadow-lg shadow-amber-500/20">
              <div>
                <span className="text-xs text-amber-100 font-bold uppercase tracking-wider">
                  {isEn ? 'Total Payable Amount' : 'مبلغ نهایی پرداختی خریدار'}
                </span>
                <div className="mt-3 text-3xl sm:text-4xl font-black font-mono">
                  {isEn ? jewelryResult.finalTotal.toLocaleString() : jewelryResult.finalTotal.toLocaleString('fa-IR')}
                  <span className="text-base font-normal mr-2">{isEn ? ' Toman' : ' تومان'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-400/40 text-xs text-amber-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'Compliant with Central Gold & Jewelry Union official invoice standards'
                    : 'محاسبه بر اساس آخرین قانون مالیات بر ارزش افزوده و ضوابط اتحادیه طلا'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Coin Bubble Calculation */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Coin Specification & Current Market Price:' : 'مشخصات و قیمت بازار سکه:'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Coin Type:' : 'نوع سکه:'}
                </label>
                <select
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value as any)}
                  className="w-full px-4 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="emami">{isEn ? 'Emami Full Coin (New)' : 'تمام سکه بهار آزادی (امامی)'}</option>
                  <option value="bahar">{isEn ? 'Old Design Full Coin' : 'تمام سکه طرح قدیم'}</option>
                  <option value="half">{isEn ? 'Half Bahar Coin' : 'نیم سکه بهار آزادی'}</option>
                  <option value="quarter">{isEn ? 'Quarter Bahar Coin' : 'ربع سکه بهار آزادی'}</option>
                  <option value="gerami">{isEn ? 'Gerami Coin' : 'سکه گرمی'}</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isEn
                    ? `Weight: ${COIN_SPECS[coinType].weight}g with 900 purity (21.6K)`
                    : `وزن: ${COIN_SPECS[coinType].weight} گرم با عیار ۹۰۰ (۲۱.۶ عیار)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Current Market Price (Toman):' : 'قیمت معاملاتی بازار (تومان):'}
                </label>
                <NumericInput
                  value={marketCoinPrice}
                  onChange={(val) => setMarketCoinPrice(val)}
                  unit={isEn ? 'Toman' : 'تومان'}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block mb-1">
                {isEn ? 'Intrinsic Gold Value' : 'ارزش ذاتی طلا (بدون حباب)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? coinResult.intrinsicValue.toLocaleString() : coinResult.intrinsicValue.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isEn ? 'Actual gold value based on weight & purity' : 'ارزش واقعی طلای خام به کار رفته'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center shadow-sm">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-bold block mb-1">
                {isEn ? 'Coin Bubble Amount' : 'مبلغ حباب سکه'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {isEn ? coinResult.bubbleAmount.toLocaleString() : coinResult.bubbleAmount.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isEn ? 'Market price minus intrinsic value' : 'اختلاف قیمت بازار با ارزش ذاتی'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center shadow-sm">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block mb-1">
                {isEn ? 'Bubble Percentage' : 'درصد حباب سکه'}
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {coinResult.bubblePercent}٪
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isEn ? 'Bubble share relative to intrinsic value' : 'سهم حباب از ارزش ذاتی'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
