'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Share2,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface WhatsappLinkGeneratorProps {
  locale?: string;
  dict?: any;
}

export function WhatsappLinkGenerator({ locale = 'fa', dict }: WhatsappLinkGeneratorProps) {
  const isEn = locale === 'en';
  const [countryCode, setCountryCode] = useState('98');
  const [phoneNumber, setPhoneNumber] = useState('9121234567');
  const [message, setMessage] = useState(
    isEn ? 'Hello! I am reaching out from your website.' : 'سلام، برای استعلام قیمت و مشاوره پیام می‌دهم.'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
  const encodedMsg = encodeURIComponent(message.trim());
  const waLink = cleanPhone ? `https://wa.me/${countryCode}${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}` : '';

  useEffect(() => {
    if (waLink) {
      QRCode.toDataURL(waLink, { width: 280, margin: 2 })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    } else {
      setQrUrl('');
    }
  }, [waLink]);

  const handleCopy = () => {
    if (!waLink) return;
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `whatsapp-qr-${cleanPhone}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'WhatsApp Phone & Pre-Filled Message' : 'مشخصات شماره و پیام پیش‌فرض چت واتساپ:'}
          </h3>
        </div>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Phone Number (Without Leading Zero):' : 'شماره تلفن همراه (بدون صفر اول):'}
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <span className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                +{countryCode}
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9121234567"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Pre-filled Welcome Message (Optional):' : 'متن پیش‌فرض پیام هنگام باز شدن چت (اختیاری):'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isEn ? 'Hello! I would like to inquire about...' : 'سلام، از وب‌سایت شما پیام می‌دهم...'}
              rows={3}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Generated Result Card */}
      {waLink && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Link output (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                {isEn ? 'Direct WhatsApp Chat URL:' : 'لینک اختصاصی و مستقیم چت بدون نیاز به ذخیره شماره:'}
              </span>
              <p className="text-xs text-slate-500">
                {isEn
                  ? 'Clicking this link opens a WhatsApp chat immediately on mobile or desktop.'
                  : 'مخاطبان با لمس این لینک بدون نیاز به سیو کردن شماره تلفن شما، مستقیماً وارد صفحه گفتگوی شما در واتساپ می‌شوند.'}
              </p>
            </div>

            <input
              type="text"
              readOnly
              dir="ltr"
              value={waLink}
              className="w-full px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy Link' : 'کپی لینک')}</span>
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isEn ? 'Open Chat in WhatsApp' : 'باز کردن در واتساپ'}</span>
              </a>
            </div>
          </div>

          {/* QR Code output (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-bold text-slate-500">
              {isEn ? 'Direct Scan QR Code' : 'اسکن مستقیم با دوربین گوشی'}
            </span>

            {qrUrl && (
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-inner">
                <img src={qrUrl} alt="WhatsApp QR Code" className="w-44 h-44 object-contain" />
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download QR' : 'دانلود بارکد QR'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
