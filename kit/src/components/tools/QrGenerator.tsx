'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Link2,
  Wifi,
  Phone,
  AlignLeft,
  Check,
  Palette,
  Sparkles,
  Share2,
  Mail,
  Sliders,
  Copy
} from 'lucide-react';

interface QrGeneratorProps {
  locale?: string;
  dict?: any;
}

type QrType = 'url' | 'text' | 'wifi' | 'phone' | 'email';

export function QrGenerator({ locale = 'fa', dict }: QrGeneratorProps) {
  const isEn = locale === 'en';
  const [type, setType] = useState<QrType>('url');

  // Fields
  const [url, setUrl] = useState('https://zebracode.ir');
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('09123456789');
  const [email, setEmail] = useState('info@example.com');
  const [emailSubject, setEmailSubject] = useState('');

  // Wi-Fi fields
  const [ssid, setSsid] = useState('My-WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState<number>(300);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Standard QR payload generation
  const getQrValue = () => {
    switch (type) {
      case 'url':
        return url.trim() || 'https://';
      case 'text':
        return text.trim() || 'ZebraCode QR';
      case 'phone':
        return `tel:${phone.trim()}`;
      case 'email':
        return `mailto:${email.trim()}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}`;
      case 'wifi':
        return `WIFI:S:${ssid};T:${wifiEncryption};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      default:
        return url;
    }
  };

  useEffect(() => {
    const val = getQrValue();
    QRCode.toDataURL(val, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorCorrection,
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => {});
  }, [type, url, text, phone, email, emailSubject, ssid, wifiPassword, wifiEncryption, wifiHidden, fgColor, bgColor, size, errorCorrection]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-${type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSVG = async () => {
    const val = getQrValue();
    try {
      const svgString = await QRCode.toString(val, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qrcode-${type}-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback copy URL
      navigator.clipboard.writeText(getQrValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Types Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {[
          { id: 'url' as QrType, icon: Link2, labelFa: 'آدرس وبسایت (URL)', labelEn: 'Website URL' },
          { id: 'wifi' as QrType, icon: Wifi, labelFa: 'اتصال به وای‌فای (Wi-Fi)', labelEn: 'Wi-Fi Network' },
          { id: 'text' as QrType, icon: AlignLeft, labelFa: 'متن دلخواه', labelEn: 'Plain Text' },
          { id: 'phone' as QrType, icon: Phone, labelFa: 'تماس تلفنی', labelEn: 'Phone Call' },
          { id: 'email' as QrType, icon: Mail, labelFa: 'ارسال ایمیل', labelEn: 'Send Email' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = type === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setType(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isEn ? tab.labelEn : tab.labelFa}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Settings & Inputs (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Content Inputs Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Content Information' : 'اطلاعات و محتوای بارکد'}
            </h4>

            {type === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Website Address (URL):' : 'آدرس اینترنتی وب‌سایت:'}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://zebracode.ir"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {type === 'wifi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isEn ? 'Wi-Fi Network Name (SSID):' : 'نام شبکه وای‌فای (SSID):'}
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="Home-WiFi"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      {isEn ? 'Password:' : 'رمز عبور شبکه:'}
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="P@ssw0rd123"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      {isEn ? 'Security Type:' : 'نوع رمزنگاری:'}
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">{isEn ? 'None (Open)' : 'بدون رمز (شبکه باز)'}</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>{isEn ? 'Hidden Network (SSID is hidden)' : 'شبکه مخفی است (Hidden SSID)'}</span>
                </label>
              </div>
            )}

            {type === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Text Content:' : 'متن دلخواه:'}
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isEn ? 'Enter your text or note here...' : 'متن، یادداشت یا پیام مورد نظر خود را اینجا بنویسید...'}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
                />
              </div>
            )}

            {type === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isEn ? 'Phone Number:' : 'شماره تماس تلفنی:'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+989123456789"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none"
                />
              </div>
            )}

            {type === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isEn ? 'Email Address:' : 'آدرس ایمیل گیرنده:'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isEn ? 'Email Subject (Optional):' : 'موضوع ایمیل (اختیاری):'}
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={isEn ? 'Meeting Inquiry' : 'درخواست همکاری'}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color & Quality Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-blue-500" />
              <span>{isEn ? 'Color & Quality Settings' : 'شخصی‌سازی رنگ و کیفیت'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {isEn ? 'Foreground Color' : 'رنگ بارکد'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {fgColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {isEn ? 'Background Color' : 'رنگ پس‌زمینه'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {bgColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {isEn ? 'Resolution (px)' : 'اندازه پیکسل'}
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value={200}>200 × 200</option>
                  <option value={300}>300 × 300</option>
                  <option value={500}>500 × 500 (HD)</option>
                  <option value={800}>800 × 800 (Ultra)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {isEn ? 'Error Correction' : 'تصحیح خطا (ECC)'}
                </label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="L">L (7%)</option>
                  <option value="M">M (15% Standard)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30% Highest)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col items-center justify-center text-center sticky top-24">
          <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Generated QR Code"
                className="w-64 h-64 object-contain rounded-2xl shadow-sm"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">
                {isEn ? 'Generating...' : 'درحال تولید...'}
              </div>
            )}
          </div>

          {/* Action Download Buttons */}
          <div className="w-full space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isEn ? 'Download PNG Image' : 'دانلود تصویر PNG'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadSVG}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? 'Vector SVG' : 'وکتور SVG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy Image' : 'کپی تصویر')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
