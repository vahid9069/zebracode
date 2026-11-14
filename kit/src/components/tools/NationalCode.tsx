'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NationalCodeProps {
  locale?: string;
  dict?: any;
}

// Major Iranian city code prefixes
const CITY_CODES: Record<string, { fa: string; en: string }> = {
  '001': { fa: 'تهران مرکزی', en: 'Central Tehran' },
  '002': { fa: 'تهران شمال', en: 'North Tehran' },
  '003': { fa: 'تهران جنوب', en: 'South Tehran' },
  '004': { fa: 'تهران شرق', en: 'East Tehran' },
  '005': { fa: 'تهران غرب', en: 'West Tehran' },
  '006': { fa: 'تهران', en: 'Tehran' },
  '007': { fa: 'تهران', en: 'Tehran' },
  '008': { fa: 'تهران', en: 'Tehran' },
  '045': { fa: 'شمیرانات', en: 'Shemiranat' },
  '049': { fa: 'شهر ری', en: 'Rey' },
  '093': { fa: 'مشهد', en: 'Mashhad' },
  '094': { fa: 'مشهد', en: 'Mashhad' },
  '092': { fa: 'مشهد', en: 'Mashhad' },
  '128': { fa: 'اصفهان', en: 'Isfahan' },
  '129': { fa: 'اصفهان', en: 'Isfahan' },
  '137': { fa: 'تبریز', en: 'Tabriz' },
  '138': { fa: 'تبریز', en: 'Tabriz' },
  '229': { fa: 'شیراز', en: 'Shiraz' },
  '230': { fa: 'شیراز', en: 'Shiraz' },
  '259': { fa: 'اهواز / رشت', en: 'Ahvaz / Rasht' },
  '260': { fa: 'اهواز', en: 'Ahvaz' },
  '038': { fa: 'کرج', en: 'Karaj' },
  '037': { fa: 'کرج', en: 'Karaj' },
  '387': { fa: 'همدان', en: 'Hamedan' },
  '325': { fa: 'کرمانشاه', en: 'Kermanshah' },
  '297': { fa: 'کرمان', en: 'Kerman' },
  '373': { fa: 'یزد', en: 'Yazd' },
  '087': { fa: 'اراک', en: 'Arak' },
  '079': { fa: 'قم', en: 'Qom' },
  '209': { fa: 'ساری', en: 'Sari' },
  '339': { fa: 'ارومیه', en: 'Urmia' },
  '146': { fa: 'اردبیل', en: 'Ardabil' },
};

// Iranian Shetab Bank BIN prefixes
const BANK_BINS: Record<string, { fa: string; en: string }> = {
  '603799': { fa: 'بانک ملی ایران', en: 'Bank Melli Iran' },
  '610433': { fa: 'بانک ملت', en: 'Bank Mellat' },
  '603769': { fa: 'بانک صادرات ایران', en: 'Bank Saderat Iran' },
  '627353': { fa: 'بانک تجارت', en: 'Tejarat Bank' },
  '589210': { fa: 'بانک سپه', en: 'Bank Sepah' },
  '622106': { fa: 'بانک پارسیان', en: 'Parsian Bank' },
  '621986': { fa: 'بانک سامان', en: 'Saman Bank' },
  '502229': { fa: 'بانک پاسارگاد', en: 'Pasargad Bank' },
  '628023': { fa: 'بانک مسکن', en: 'Bank Maskan' },
  '603770': { fa: 'بانک کشاورزی', en: 'Keshavarzi Bank' },
  '627412': { fa: 'بانک اقتصاد نوین', en: 'EN Bank' },
  '504706': { fa: 'بانک شهر', en: 'Shahr Bank' },
  '606373': { fa: 'بانک قرض‌الحسنه مهر ایران', en: 'Qarz Al-Hasaneh Mehr Iran' },
  '636214': { fa: 'بانک آینده', en: 'Ayandeh Bank' },
  '505416': { fa: 'بانک گردشگری', en: 'Gardeshgari Bank' },
  '639346': { fa: 'بانک سینا', en: 'Sina Bank' },
  '502908': { fa: 'بانک توسعه تعاون', en: 'Tose-e Taavon Bank' },
  '627760': { fa: 'پست بانک ایران', en: 'Post Bank of Iran' },
  '505785': { fa: 'بانک ایران زمین', en: 'Iran Zamin Bank' },
  '639607': { fa: 'بانک سرمایه', en: 'Sarmayeh Bank' },
  '585983': { fa: 'بانک تجارت (سابق)', en: 'Tejarat Bank' },
};

export function NationalCode({ locale = 'fa', dict }: NationalCodeProps) {
  const isEn = locale === 'en';
  const [tab, setTab] = useState<'nationalCode' | 'bankCard'>('nationalCode');

  // National Code
  const [nationalCode, setNationalCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Bank Card
  const [cardNumber, setCardNumber] = useState<string>('');

  // Validate Iranian 10-digit National ID (Modulo 11 Checksum)
  const validateNationalCode = (code: string) => {
    const clean = code.trim().replace(/\D/g, '');
    if (!clean) return null;
    if (clean.length < 8 || clean.length > 10) {
      return { isValid: false, message: isEn ? 'National ID must be 10 digits.' : 'کد ملی باید ۱۰ رقم باشد.' };
    }

    const padded = clean.padStart(10, '0');

    // Reject all identical digits (e.g. 1111111111)
    if (/^(\d)\1{9}$/.test(padded)) {
      return {
        isValid: false,
        message: isEn ? 'National ID cannot consist of all identical digits.' : 'ارقام کد ملی نمی‌تواند همگی یکسان باشد.',
      };
    }

    const check = parseInt(padded[9], 10);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(padded[i], 10) * (10 - i);
    }
    const remainder = sum % 11;
    const isValid = (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);

    const prefix = padded.slice(0, 3);
    const city = CITY_CODES[prefix] ? (isEn ? CITY_CODES[prefix].en : CITY_CODES[prefix].fa) : null;

    return {
      isValid,
      message: isValid
        ? isEn ? 'Valid Iranian National ID' : 'کد ملی صحیح و معتبر است.'
        : isEn ? 'Invalid Checksum. Please double-check digits.' : 'رقم کنترل همخوانی ندارد. کد ملی نامعتبر است.',
      padded,
      city,
    };
  };

  // Generate a valid mock National ID
  const generateValidNationalCode = () => {
    const prefixes = ['001', '002', '128', '137', '229', '093', '038'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let body = prefix;
    for (let i = 0; i < 6; i++) {
      body += Math.floor(Math.random() * 10).toString();
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(body[i], 10) * (10 - i);
    }
    const remainder = sum % 11;
    const check = remainder < 2 ? remainder : 11 - remainder;
    const generated = `${body}${check}`;
    setNationalCode(generated);
  };

  // Validate Iranian 16-digit Bank Card (Luhn Algorithm)
  const validateBankCard = (card: string) => {
    const clean = card.replace(/\D/g, '');
    if (!clean) return null;
    if (clean.length !== 16) {
      return { isValid: false, message: isEn ? 'Card number must be exactly 16 digits.' : 'شماره کارت بانکی باید ۱۶ رقم باشد.' };
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
    const bank = BANK_BINS[bin] ? (isEn ? BANK_BINS[bin].en : BANK_BINS[bin].fa) : null;

    return {
      isValid,
      message: isValid
        ? isEn ? 'Valid Shetab Card Number' : 'شماره کارت بانکی معتبر است.'
        : isEn ? 'Invalid card checksum.' : 'چک‌سام معتبر نیست؛ شماره کارت نامعتبر است.',
      bank,
    };
  };

  const codeResult = validateNationalCode(nationalCode);
  const cardResult = validateBankCard(cardNumber);

  const handleCopyCode = () => {
    if (!nationalCode) return;
    navigator.clipboard.writeText(nationalCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab('nationalCode')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'nationalCode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isEn ? 'National ID Validator & Generator' : 'اعتبارسنجی و تولید کد ملی'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('bankCard')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'bankCard'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isEn ? 'Bank Card (Shetab) Validator' : 'اعتبارسنجی شماره کارت شتاب'}</span>
        </button>
      </div>

      {tab === 'nationalCode' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Enter 10-Digit National ID:' : 'کد ملی ۱۰ رقمی را وارد کنید:'}
              </label>

              <button
                type="button"
                onClick={generateValidNationalCode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEn ? 'Generate Valid Test ID' : 'تولید کد ملی تصادفی معتبر (تست)'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, ''))}
                placeholder={isEn ? 'e.g. 0012345678' : 'مثال: ۰۰۱۲۳۴۵۶۷۸'}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!nationalCode}
                className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-40 transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>

          {/* Validation Status Card */}
          {codeResult && (
            <div
              className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                codeResult.isValid
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {codeResult.isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                )}
                <span className={`text-base font-bold ${codeResult.isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {codeResult.message}
                </span>
              </div>

              {codeResult.isValid && codeResult.city && (
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>
                    {isEn
                      ? `Issuing Location / Civil Registry Office: ${codeResult.city}`
                      : `محل صدور / اداره ثبت احوال صادرکننده: ${codeResult.city}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Bank Card Validation Tab */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {isEn ? 'Enter 16-Digit Shetab Card Number:' : 'شماره ۱۶ رقمی کارت بانکی شتاب را وارد کنید:'}
            </label>

            <div className="max-w-xl">
              <input
                type="text"
                dir="ltr"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                  // Format in chunks of 4 digits
                  const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                  setCardNumber(formatted);
                }}
                placeholder="6037 9912 3456 7890"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg sm:text-xl font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {cardResult && (
            <div
              className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                cardResult.isValid
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {cardResult.isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                )}
                <span className={`text-base font-bold ${cardResult.isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {cardResult.message}
                </span>
              </div>

              {cardResult.isValid && cardResult.bank && (
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    {isEn ? `Issuing Bank: ${cardResult.bank}` : `بانک صادرکننده کارت: ${cardResult.bank}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
