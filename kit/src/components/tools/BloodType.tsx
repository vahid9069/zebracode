'use client';

import React, { useState } from 'react';
import {
  HeartPulse,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Info,
  Droplet,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface BloodTypeProps {
  locale?: string;
  dict?: any;
}

type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

interface Compatibility {
  canGiveTo: BloodGroup[];
  canReceiveFrom: BloodGroup[];
  plasmaGiveTo: BloodGroup[];
  plasmaReceiveFrom: BloodGroup[];
  isUniversalDonor?: boolean;
  isUniversalRecipient?: boolean;
  frequencyFa: string;
  frequencyEn: string;
}

const COMPATIBILITY: Record<BloodGroup, Compatibility> = {
  'O-': {
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    plasmaGiveTo: ['O-'],
    plasmaReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalDonor: true,
    frequencyFa: 'حدود ۴٪ جمعیت (دهنده عمومی گلبول قرمز)',
    frequencyEn: '~4% of population (Universal Red Cell Donor)',
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+'],
    plasmaGiveTo: ['O-', 'O+'],
    plasmaReceiveFrom: ['O+', 'A+', 'B+', 'AB+'],
    frequencyFa: 'حدود ۳۸٪ جمعیت (شایع‌ترین گروه خونی)',
    frequencyEn: '~38% of population (Most common blood type)',
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-'],
    plasmaGiveTo: ['O-', 'A-'],
    plasmaReceiveFrom: ['A-', 'A+', 'AB-', 'AB+'],
    frequencyFa: 'حدود ۶٪ جمعیت',
    frequencyEn: '~6% of population',
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
    plasmaGiveTo: ['A-', 'A+'],
    plasmaReceiveFrom: ['A+', 'AB+'],
    frequencyFa: 'حدود ۳۴٪ جمعیت (دومین گروه خونی شایع)',
    frequencyEn: '~34% of population',
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'B-'],
    plasmaGiveTo: ['O-', 'B-'],
    plasmaReceiveFrom: ['B-', 'B+', 'AB-', 'AB+'],
    frequencyFa: 'حدود ۲٪ جمعیت (گروه خونی نادر)',
    frequencyEn: '~2% of population (Rare)',
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
    plasmaGiveTo: ['B-', 'B+'],
    plasmaReceiveFrom: ['B+', 'AB+'],
    frequencyFa: 'حدود ۹٪ جمعیت',
    frequencyEn: '~9% of population',
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    plasmaGiveTo: ['O-', 'A-', 'B-', 'AB-'],
    plasmaReceiveFrom: ['AB-', 'AB+'],
    frequencyFa: 'حدود ۱٪ جمعیت (نادرترین گروه خونی)',
    frequencyEn: '~1% of population (Rarest blood type)',
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaReceiveFrom: ['AB+'],
    isUniversalRecipient: true,
    frequencyFa: 'حدود ۳٪ جمعیت (گیرنده عمومی گلبول قرمز)',
    frequencyEn: '~3% of population (Universal Red Cell Recipient)',
  },
};

export function BloodType({ locale = 'fa', dict }: BloodTypeProps) {
  const isEn = locale === 'en';
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  const info = COMPATIBILITY[selectedGroup];

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {isEn ? 'Select your blood type (ABO & Rh):' : 'گروه خونی خود را انتخاب کنید (ABO و فاکتور Rh):'}
        </label>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl mx-auto">
          {BLOOD_GROUPS.map((grp) => {
            const isSelected = grp === selectedGroup;
            return (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`w-16 h-16 rounded-2xl font-black text-lg transition-all font-mono flex items-center justify-center active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105 ring-4 ring-rose-100 dark:ring-rose-950/60'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-400'
                }`}
              >
                {grp}
              </button>
            );
          })}
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-xs font-bold text-rose-600 dark:text-rose-400">
          {isEn ? info.frequencyEn : info.frequencyFa}
        </div>
      </div>

      {/* Compatibility Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Can Receive From */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {isEn ? 'Can Receive Red Blood Cells From:' : 'می‌تواند از این گروه‌ها خون دریافت کند:'}
              </h4>
              <span className="text-[11px] text-slate-400">{isEn ? 'Compatible Red Blood Cell Donors' : 'گروه‌های خونی سازگار جهت تزریق'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {BLOOD_GROUPS.map((grp) => {
              const compatible = info.canReceiveFrom.includes(grp);
              return (
                <div
                  key={grp}
                  className={`px-3.5 py-2 rounded-2xl font-mono font-bold text-xs flex items-center gap-2 border ${
                    compatible
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {compatible ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{grp}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Can Give To */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {isEn ? 'Can Donate Red Blood Cells To:' : 'می‌تواند به این گروه‌ها خون اهدا کند:'}
              </h4>
              <span className="text-[11px] text-slate-400">{isEn ? 'Compatible Recipients' : 'گیرندگان سازگار در صورت اهدای خون'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {BLOOD_GROUPS.map((grp) => {
              const compatible = info.canGiveTo.includes(grp);
              return (
                <div
                  key={grp}
                  className={`px-3.5 py-2 rounded-2xl font-mono font-bold text-xs flex items-center gap-2 border ${
                    compatible
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {compatible ? <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{grp}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plasma Info Callout */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {isEn ? 'Medical Rule of Thumb: Blood vs Plasma Compatibility' : 'نکته مهم پزشکی: تفاوت سازگاری گلبول قرمز و پلاسما'}
          </p>
          <p>
            {isEn
              ? 'Blood group O- is the Universal Donor for Red Blood Cells (used in urgent emergency transfusions), whereas group AB+ is the Universal Recipient. In plasma transfusions, the rule reverses: AB is the universal plasma donor, and O is the universal plasma recipient.'
              : 'گروه خونی O منفی (O-) دهنده عمومی گلبول قرمز است (در اورژانس‌های اضطراری بدون آزمایش سازگاری قابل تزریق است) و گروه AB مثبت (AB+) گیرنده عمومی خون است. در انتقال پلاسما این قاعده معکوس می‌شود: گروه AB دهنده عمومی پلاسما است و گروه O گیرنده عمومی پلاسما محسوب می‌شود.'}
          </p>
        </div>
      </div>
    </div>
  );
}
