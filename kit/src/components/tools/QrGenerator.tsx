'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Link2, Wifi, Phone, AlignLeft, Check } from 'lucide-react';

export function QrGenerator() {
  const [type, setType] = useState<'url' | 'text' | 'wifi' | 'phone'>('url');
  const [url, setUrl] = useState('https://zebracode.ir');
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('09123456789');

  // Wi-Fi fields
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState<number>(300);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // تولید متن استاندارد QR
  const getQrValue = () => {
    switch (type) {
      case 'url':
        return url.trim() || 'https://';
      case 'text':
        return text.trim() || 'متن پیش‌فرض';
      case 'phone':
        return `tel:${phone.trim()}`;
      case 'wifi':
        return `WIFI:S:${ssid};T:${wifiEncryption};P:${wifiPassword};;`;
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
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [type, url, text, phone, ssid, wifiPassword, wifiEncryption, fgColor, bgColor, size]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'zebracode-qrcode.png';
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
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'zebracode-qrcode.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* تب‌های نوع محتوای QR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setType('url')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            type === 'url'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Link2 className="w-4 h-4" />
          لینک و آدرس وب
        </button>
        <button
          onClick={() => setType('text')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            type === 'text'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
          متن دلخواه
        </button>
        <button
          onClick={() => setType('wifi')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            type === 'wifi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Wifi className="w-4 h-4" />
          اتصال وای‌فای (Wi-Fi)
        </button>
        <button
          onClick={() => setType('phone')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            type === 'phone'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Phone className="w-4 h-4" />
          شماره تماس
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* پنل فرم ورودی */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">محتوای بارکد QR</h3>

            {type === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  آدرس اینترنتی (URL):
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-sans"
                />
              </div>
            )}

            {type === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  متن دلخواه:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="متن خود را وارد کنید..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            )}

            {type === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    نام شبکه (SSID):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="MyHomeWifi"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    رمز عبور وای‌فای:
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
            )}

            {type === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  شماره تماس:
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-sans"
                />
              </div>
            )}
          </div>

          {/* شخصی‌سازی رنگ و ابعاد */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">تنظیمات ظاهری</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">رنگ بارکد (طرح):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono">{fgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">رنگ پس‌زمینه:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* پنل پیش‌نمایش و دانلود */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block mb-5">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Preview" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              دانلود تصویر PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              دانلود فرمت وکتور SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
