'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CreditCard, RefreshCw, Copy, Check } from 'lucide-react';

// پیش‌شماره‌های معروف شهرها برای کد ملی
const CITY_CODES: Record<string, string> = {
  '001': 'تهران مرکزی',
  '002': 'تهران شمال',
  '003': 'تهران جنوب',
  '004': 'تهران شرق',
  '005': 'تهران غرب',
  '006': 'تهران',
  '007': 'تهران',
  '008': 'تهران',
  '045': 'شمیرانات',
  '049': 'ری',
  '093': 'مشهد',
  '094': 'مشهد',
  '092': 'مشهد',
  '128': 'اصفهان',
  '129': 'اصفهان',
  '137': 'تبریز',
  '138': 'تبریز',
  '229': 'شیراز',
  '230': 'شیراز',
  '259': 'اهواز',
  '260': 'اهواز',
  '038': 'کرج',
  '037': 'کرج',
  '387': 'همدان',
  '325': 'کرمانشاه',
  '297': 'کرمان',
  '373': 'یزد',
  '087': 'اراک',
  '079': 'قم',
  '209': 'ساری',
  '259': 'رشت',
  '339': 'ارومیه',
  '146': 'اردبیل',
};

// پیش‌شماره‌های شتاب بانک‌ها
const BANK_BINS: Record<string, string> = {
  '603799': 'بانک ملی ایران',
  '610433': 'بانک ملت',
  '603769': 'بانک صادرات ایران',
  '627353': 'بانک تجارت',
  '589210': 'بانک سپه',
  '622106': 'بانک پارسیان',
  '621986': 'بانک سامان',
  '502229': 'بانک پاسارگاد',
  '628023': 'بانک مسکن',
  '603770': 'بانک کشاورزی',
  '627412': 'بانک اقتصاد نوین',
  '504706': 'بانک شهر',
  '606373': 'بانک قرض‌الحسنه مهر ایران',
  '636214': 'بانک آینده',
  '505416': 'بانک گردشگری',
  '639346': 'بانک سینا',
  '502908': 'بانک توسعه تعاون',
  '627760': 'پست بانک ایران',
  '505785': 'بانک ایران زمین',
  '639607': 'بانک سرمایه',
  '585983': 'بانک تجارت',
};

export function NationalCode() {
  const [tab, setTab] = useState<'nationalCode' | 'bankCard'>('nationalCode');

  // کد ملی
  const [nationalCode, setNationalCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // شماره کارت بانکی
  const [cardNumber, setCardNumber] = useState('');

  // اعتبارسنجی کد ملی
  const validateNationalCode = (code: string) => {
    const clean = code.trim().replace(/\D/g, '');
    if (!clean) return null;
    if (clean.length < 8 || clean.length > 10) return { isValid: false, message: 'کد ملی باید ۱۰ رقم باشد.' };

    const padded = clean.padStart(10, '0');

    // چک کردن ارقام تکراری مانند 1111111111
    if (/^(\d)\1{9}$/.test(padded)) {
      return { isValid: false, message: 'ارقام کد ملی نمی‌تواند همگی یکسان باشد.' };
    }

    const check = parseInt(padded[9], 10);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(padded[i], 10) * (10 - i);
    }
    const remainder = sum % 11;

    const isValid = (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);

    const prefix = padded.slice(0, 3);
    const city = CITY_CODES[prefix] || 'نامشخص یا سایر شهرستان‌ها';

    return {
      isValid,
      message: isValid ? 'کد ملی معتبر و دارای ساختار صحیح است.' : 'رقم کنترلی اشتباه است؛ کد ملی نامعتبر می‌باشد.',
      city: isValid ? city : undefined,
      padded,
    };
  };

  // تولید کد ملی تستی و معتبر
  const generateRandomNationalCode = () => {
    let raw = '';
    for (let i = 0; i < 9; i++) {
      raw += Math.floor(Math.random() * 10);
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(raw[i], 10) * (10 - i);
    }
    const remainder = sum % 11;
    const check = remainder < 2 ? remainder : 11 - remainder;
    const generated = raw + check;
    setNationalCode(generated);
  };

  // اعتبارسنجی کارت بانکی (الگوریتم لان / Luhn)
  const validateCardNumber = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (!clean) return null;
    if (clean.length !== 16) {
      return { isValid: false, message: 'شماره کارت بانکی باید ۱۶ رقم باشد.', bank: null };
    }

    let sum = 0;
    for (let i = 0; i < 16; i++) {
      let digit = parseInt(clean[i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    const isValid = sum % 10 === 0;
    const bin = clean.slice(0, 6);
    const bank = BANK_BINS[bin] || 'بانک نامشخص (عضو شتاب)';

    return {
      isValid,
      message: isValid ? 'شماره کارت معتبر و دارای رقم کنترلی صحیح است.' : 'شماره کارت نامعتبر است (خطای الگوریتم Luhn).',
      bank: isValid ? bank : null,
    };
  };

  const ncResult = validateNationalCode(nationalCode);
  const cardResult = validateCardNumber(cardNumber);

  return (
    <div className="space-y-6">
      {/* تب‌ها */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('nationalCode')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'nationalCode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          اعتبارسنجی کد ملی
        </button>
        <button
          onClick={() => setTab('bankCard')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'bankCard'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          اعتبارسنجی کارت بانکی (شتاب)
        </button>
      </div>

      {tab === 'nationalCode' ? (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              کد ملی ۱۰ رقمی را وارد کنید:
            </label>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value)}
                placeholder="0012345678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={generateRandomNationalCode}
                title="تولید کد ملی تستی معتبر"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shrink-0 flex items-center gap-1 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تولید تستی
              </button>
            </div>
          </div>

          {ncResult && (
            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${
              ncResult.isValid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
            }`}>
              {ncResult.isValid ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <h4 className="text-sm font-bold">{ncResult.isValid ? 'کد ملی معتبر است' : 'کد ملی نامعتبر است'}</h4>
                <p>{ncResult.message}</p>
                {ncResult.city && (
                  <p className="font-semibold pt-1">
                    محل صدور تخمینی بر اساس پیش‌شماره: <span className="underline">{ncResult.city}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              شماره ۱۶ رقمی کارت بانکی را وارد کنید:
            </label>
            <div className="max-w-md">
              <input
                type="text"
                dir="ltr"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                  const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1-');
                  setCardNumber(formatted);
                }}
                placeholder="6037-9918-1234-5678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center text-lg font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {cardResult && (
            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${
              cardResult.isValid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
            }`}>
              {cardResult.isValid ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <h4 className="text-sm font-bold">{cardResult.isValid ? 'شماره کارت معتبر است' : 'شماره کارت نامعتبر است'}</h4>
                <p>{cardResult.message}</p>
                {cardResult.bank && (
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 pt-1 text-sm">
                    بانک صادرکننده: {cardResult.bank}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
