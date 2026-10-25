'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        let preference: string | null = null;
        try { preference = localStorage.getItem('zebracode-blog-theme'); } catch { /* Storage may be unavailable. */ }
        const isDark = preference === 'dark' || (!preference && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        setDark(isDark);
    }, []);

    function toggle() {
        const next = !dark;
        setDark(next);
        document.documentElement.dataset.theme = next ? 'dark' : 'light';
        try { localStorage.setItem('zebracode-blog-theme', next ? 'dark' : 'light'); } catch { /* The current tab still keeps its theme. */ }
    }

    return <button type="button" className="zc-theme-toggle" onClick={toggle} aria-label="حالت تیره" aria-pressed={dark} title={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}>
        {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>;
}
