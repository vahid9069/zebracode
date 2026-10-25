'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import CodeMirrorEditorComponent, { type CodeEditorLanguage } from '@/components/CodeMirrorEditorComponent';
import type englishCopy from '@/dictionaries/en/developer-ui.json';
import { getCodeEditorStats } from '@/lib/developer-tools/editor-presentation';

interface DeveloperCodeEditorPanelProps {
    id: string;
    title: string;
    language: CodeEditorLanguage;
    format: string;
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    stale?: boolean;
    busy?: boolean;
    placeholder?: string;
    describedBy?: string;
    actions?: React.ReactNode;
    locale: 'fa' | 'en';
    ui: typeof englishCopy;
}

const ignoreChange = () => {};

/** Local-only editor chrome shared by all developer utility workspaces. */
export default function DeveloperCodeEditorPanel({
    id, title, language, format, value, onChange, readOnly = false, stale = false,
    busy = false, placeholder, describedBy, actions, locale, ui,
}: DeveloperCodeEditorPanelProps) {
    const { resolvedTheme } = useTheme();
    const changeHandler = useRef(onChange);
    useEffect(() => { changeHandler.current = onChange; }, [onChange]);
    const handleChange = useCallback((nextValue: string) => changeHandler.current?.(nextValue), []);
    const counts = useMemo(() => getCodeEditorStats(value), [value]);
    const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
    const titleId = `${id}-title`;

    return <section aria-labelledby={titleId} aria-busy={busy} className="flex h-full min-h-[360px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm lg:min-h-[460px]">
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-inset px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true">
                    <i className="h-2 w-2 rounded-full bg-red-400" />
                    <i className="h-2 w-2 rounded-full bg-amber-400" />
                    <i className="h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span dir="ltr" aria-label={`${ui.editorLanguage}: ${format}`} className="shrink-0 rounded bg-action-soft px-2 py-1 text-[10px] font-bold uppercase text-action dark:text-focus">{format}</span>
                <h2 id={titleId} className="min-w-0 break-words text-xs font-semibold text-text">{title}</h2>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
        </header>
        <div dir="ltr" className={`relative min-h-[280px] min-w-0 flex-1 bg-surface lg:min-h-[380px] ${stale ? 'opacity-60' : ''}`}>
            <div className="absolute inset-0 min-w-0 [&>div]:rounded-none [&>div]:border-0">
                <CodeMirrorEditorComponent
                    id={id}
                    ariaLabelledby={titleId}
                    ariaDescribedby={describedBy}
                    placeholder={placeholder}
                    theme={resolvedTheme}
                    language={language}
                    value={value}
                    onChange={readOnly ? ignoreChange : handleChange}
                    readOnly={readOnly}
                    direction="ltr"
                    showToolbar={false}
                    allowFileDrop={false}
                    toolbarConfig={{}}
                    rightToolbarButtons={[]}
                />
            </div>
        </div>
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-surface-inset px-3 py-2 text-[10px] text-text-muted">
            <span>{ui.lines}: {numbers.format(counts.lines)}</span>
            <span>{ui.characters}: {numbers.format(counts.characters)}</span>
            <span>{ui.bytes}: {numbers.format(counts.bytes)}</span>
            <span dir="ltr">{ui.utf8}</span>
        </footer>
    </section>;
}
