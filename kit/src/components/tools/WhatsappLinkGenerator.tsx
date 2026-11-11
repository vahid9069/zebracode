'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { MessageCircle, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

export function WhatsappLinkGenerator() {
  const [countryCode, setCountryCode] = useState('98');
  const [phoneNumber, setPhoneNumber] = useState('9121234567');
  const [message, setMessage] = useState('سلام، برای استعلام قیمت و مشاوره پیام می‌دهم.');
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
  const encodedMsg = encodeURIComponent(message.trim());
  const waLink = cleanPhone ? `https://wa.me/${countryCode}${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}` : '';

  const handleCopy = () => {
    if (!waLink) return;
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateQR = () => {
    if (!waLink) return;
    QRCode.toDataURL(waLink, { width: 250, margin: 2 })
      .then((url) => setQrUrl(url))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-500" />
          مشخصات شماره و پیام پیش‌فرض واتساپ:
        </h3>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              شماره تلفن همراه (بدون صفر اول):
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <span className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">
                +{countryCode}
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9121234567"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              متن پیش‌فرض پیام هنگام باز شدن چت (اختیاری):
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="سلام، از وب‌سایت شما پیام می‌دهم..."
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>
        </div>
      </div>

      {waLink && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-4">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
            لینک اختصاصی و مستقیم گفتگوی واتساپ شما:
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={waLink}
              className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-200"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'کپی شد' : 'کپی لینک'}</span>
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              >
                <ExternalLink className="w-4 h-4" />
                تست لینک
              </a>

              <button
                onClick={handleGenerateQR}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              >
                <QrCode className="w-4 h-4" />
                کد QR
              </button>
            </div>
          </div>

          {qrUrl && (
            <div className="pt-4 border-t border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-xs text-slate-500 block mb-2">بارکد QR جهت اسکن مستقیم با دوربین گوشی:</span>
              <img src={qrUrl} alt="WhatsApp QR" className="w-44 h-44 mx-auto rounded-xl p-2 bg-white border" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
