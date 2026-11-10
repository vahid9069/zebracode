'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Clipboard, Code2, Download, Play, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/tools/shared/fields';
import DeveloperCodeEditorPanel from '@/components/tools/shared/DeveloperCodeEditorPanel';
import { writeToClipboard } from '@/components/tools/shared/feedback';
import { DeveloperToolError } from '@/lib/developer-tools/types';
import { getDeveloperFieldFormat, getDeveloperFieldLanguage, getDeveloperOutputFormat, getDeveloperOutputLanguage } from '@/lib/developer-tools/editor-presentation';
import type { DeveloperToolCopy, DeveloperToolDefinition } from '@/lib/developer-tools/types';
import type englishCopy from '@/dictionaries/en/developer-ui.json';

export type DeveloperWorkbenchCopy = typeof englishCopy;

export interface DeveloperUtilityWorkbenchProps {
    tool: DeveloperToolDefinition;
    copy: DeveloperToolCopy;
    locale: 'fa' | 'en';
    ui: DeveloperWorkbenchCopy;
}

function emptyValues(tool: DeveloperToolDefinition): Record<string, string> {
    return Object.fromEntries(tool.fields.map(field => [field.id, '']));
}

// A different tool or locale gets a fresh workspace before its first render.
export default function DeveloperUtilityWorkbench(props: DeveloperUtilityWorkbenchProps) {
    return <Workspace key={`${props.tool.slug}:${props.locale}`} {...props} />;
}

function Workspace({ tool, copy, locale, ui }: DeveloperUtilityWorkbenchProps) {
    const instanceId = useId();
    const prefix = `${tool.slug}-${instanceId}`;
    const [values, setValues] = useState<Record<string, string>>(() => emptyValues(tool));
    const [output, setOutput] = useState('');
    const [hasResult, setHasResult] = useState(false);
    const [stale, setStale] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [feedback, setFeedback] = useState('');
    const mounted = useRef(false);
    const revision = useRef(0);
    const activeRun = useRef(false);
    const controller = useRef<AbortController | null>(null);
    const copyAttempt = useRef(0);
    const downloads = useRef(new Map<string, number>());
    const editorFields = tool.fields.filter(field => field.type === 'textarea');
    const settingsFields = tool.fields.filter(field => field.type !== 'textarea');

    function releaseDownloads() {
        downloads.current.forEach((timer, url) => {
            window.clearTimeout(timer);
            URL.revokeObjectURL(url);
        });
        downloads.current.clear();
    }

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            revision.current += 1;
            controller.current?.abort();
            releaseDownloads();
        };
    }, []);

    function invalidate() {
        revision.current += 1;
        controller.current?.abort();
        copyAttempt.current += 1;
        activeRun.current = false;
        setRunning(false);
        setError('');
        setActionError('');
        setFeedback('');
    }

    function editField(id: string, value: string) {
        invalidate();
        setValues(current => ({ ...current, [id]: value }));
        setStale(hasResult);
    }

    function reset(sample: boolean) {
        invalidate();
        releaseDownloads();
        setValues(Object.fromEntries(tool.fields.map(field => [field.id, sample ? tool.sample[field.id] ?? '' : ''])));
        setOutput('');
        setHasResult(false);
        setStale(false);
        setFeedback(sample ? ui.sampleLoaded : ui.cleared);
    }

    async function run() {
        if (activeRun.current) return;
        const token = ++revision.current;
        const operation = new AbortController();
        controller.current = operation;
        activeRun.current = true;
        copyAttempt.current += 1;
        setRunning(true);
        setError('');
        setActionError('');
        setFeedback('');
        setOutput('');
        setHasResult(false);
        setStale(false);
        try {
            const result = await tool.run({ ...values }, operation.signal);
            if (!mounted.current || revision.current !== token) return;
            setOutput(result);
            setHasResult(true);
            setFeedback(result ? ui.ready : ui.emptyResult);
        } catch (cause) {
            if (!mounted.current || revision.current !== token) return;
            const code = cause instanceof DeveloperToolError ? cause.code : 'unexpected';
            const generalErrors: Record<string, string> = ui.errors;
            // Only show localized, known error codes; never echo input or exception messages.
            setError(copy.errors?.[code] || generalErrors[code] || ui.errors.unexpected);
        } finally {
            if (mounted.current && revision.current === token) {
                activeRun.current = false;
                setRunning(false);
            }
        }
    }

    const canExport = hasResult && !stale && !running && output.length > 0;

    async function copyOutput() {
        if (!canExport) return;
        const token = revision.current;
        const attempt = ++copyAttempt.current;
        setActionError('');
        setFeedback('');
        const ok = await writeToClipboard(output);
        if (!mounted.current || revision.current !== token || copyAttempt.current !== attempt) return;
        if (ok) setFeedback(ui.copied);
        else setActionError(ui.errors.copyFailed);
    }

    function downloadOutput() {
        if (!canExport) return;
        setActionError('');
        setFeedback('');
        let url: string | undefined;
        const anchor = document.createElement('a');
        try {
            url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
            anchor.href = url;
            const extension = tool.outputExtension?.replace(/^\./, '').replace(/[^a-zA-Z0-9.-]/g, '') || 'txt';
            anchor.download = `${tool.slug.replace(/[^a-zA-Z0-9-]/g, '-')}.${extension}`;
            anchor.hidden = true;
            document.body.appendChild(anchor);
            anchor.click();
            // Give the browser time to consume the Blob; also revoke on reset/unmount.
            const objectUrl = url;
            downloads.current.set(objectUrl, window.setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
                downloads.current.delete(objectUrl);
            }, 1000));
            setFeedback(ui.downloadStarted);
        } catch {
            if (url) URL.revokeObjectURL(url);
            setActionError(ui.errors.downloadFailed);
        } finally {
            anchor.remove();
        }
    }

    return <div dir={locale === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-canvas px-4 py-6 text-text sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <nav aria-label={ui.breadcrumb} className="min-w-0 text-xs text-text-muted">
                    <ol className="flex flex-wrap items-center gap-2">
                        <li><Link href={locale === 'en' ? '/en' : '/'} className="rounded-sm hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:hover:text-focus">{ui.home}</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page" className="break-words font-medium text-text">{copy.title}</li>
                    </ol>
                </nav>
                <Badge text={ui.local} tone="emerald" />
            </div>

            <Card className="flex flex-col gap-4 bg-surface-raised p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
                <header className="min-w-0 max-w-3xl space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
                    <p className="text-sm leading-7 text-text-muted">{copy.description}</p>
                </header>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => reset(true)}><Code2 aria-hidden="true" className="h-4 w-4" />{ui.sample}</Button>
                    <Button type="button" variant="outline" onClick={() => reset(false)} className="text-danger hover:bg-danger-soft hover:text-danger"><Trash2 aria-hidden="true" className="h-4 w-4" />{ui.clear}</Button>
                </div>
            </Card>

            <form noValidate onSubmit={event => { event.preventDefault(); void run(); }} onKeyDown={event => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.requestSubmit();
                }
            }} aria-describedby={copy.note ? `${prefix}-scope` : undefined} className="min-w-0 space-y-4">
                <Card className="min-w-0 space-y-4 bg-surface-raised p-4 sm:p-5">
                    {settingsFields.length > 0 && <fieldset className="min-w-0">
                        <legend className="mb-3 text-xs font-semibold text-text-muted">{ui.settings}</legend>
                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {settingsFields.map(field => {
                                const id = `${prefix}-${field.id}`;
                                const value = values[field.id] ?? '';
                                return <div key={field.id} className="min-w-0 space-y-2">
                                    <label htmlFor={id} className="block text-sm font-medium">{copy.fields[field.id]}</label>
                                    {field.type === 'select' ? <select id={id} name={id} value={value} onChange={event => editField(field.id, event.target.value)} className="h-10 w-full min-w-0 cursor-pointer rounded-md border border-border-strong bg-surface-inset px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                                        <option value="" disabled>{ui.chooseOption}</option>
                                        {field.options?.map(option => <option key={option} value={option}>{copy.options?.[`${field.id}.${option}`] ?? copy.options?.[option] ?? ui.chooseOption}</option>)}
                                    </select>
                                        : <Input id={id} name={id} type={field.type} dir="ltr" value={value} min={field.min} max={field.max} step={field.type === 'number' ? 'any' : undefined} onChange={event => editField(field.id, event.target.value)} spellCheck={false} autoComplete={field.type === 'password' ? 'new-password' : 'off'} autoCapitalize="off" className="text-left font-mono" />}
                                </div>;
                            })}
                        </div>
                    </fieldset>}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" disabled={running} aria-keyshortcuts="Control+Enter Meta+Enter"><Play aria-hidden="true" className="h-4 w-4" />{running ? ui.running : ui.run}</Button>
                        <p className="text-xs text-text-muted">{ui.shortcut}</p>
                    </div>
                </Card>
                {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm leading-6 text-danger">{error}</p>}

                <div className={`grid min-w-0 grid-cols-1 items-stretch gap-4 ${editorFields.length ? 'lg:grid-cols-2' : ''}`}>
                    {editorFields.length > 0 && <div role="group" aria-label={ui.input} className="grid min-w-0 grid-cols-1 gap-4">
                        {editorFields.map(field => <DeveloperCodeEditorPanel
                            key={field.id}
                            id={`${prefix}-${field.id}`}
                            title={copy.fields[field.id]}
                            language={getDeveloperFieldLanguage(tool.slug, field.id, values)}
                            format={getDeveloperFieldFormat(tool.slug, field.id, values)}
                            value={values[field.id] ?? ''}
                            onChange={value => editField(field.id, value)}
                            locale={locale}
                            ui={ui}
                        />)}
                    </div>}
                    <DeveloperCodeEditorPanel
                        id={`${prefix}-output`}
                        title={ui.output}
                        language={getDeveloperOutputLanguage(tool.slug, values)}
                        format={getDeveloperOutputFormat(tool.slug, values)}
                        value={output}
                        readOnly
                        stale={stale}
                        busy={running}
                        placeholder={ui.empty}
                        describedBy={`${prefix}-result-status`}
                        locale={locale}
                        ui={ui}
                        actions={<>
                            <Button type="button" variant="outline" size="sm" disabled={!canExport} onClick={() => void copyOutput()}><Clipboard aria-hidden="true" className="h-4 w-4" />{ui.copy}</Button>
                            <Button type="button" variant="outline" size="sm" disabled={!canExport} onClick={downloadOutput}><Download aria-hidden="true" className="h-4 w-4" />{ui.download}</Button>
                        </>}
                    />
                </div>
                <p id={`${prefix}-result-status`} role="status" aria-live="polite" className={`min-h-5 text-sm leading-6 ${stale ? 'font-medium text-warning' : 'text-text-muted'}`}>
                    {stale ? ui.stale : running ? ui.running : feedback}
                </p>
                {actionError && <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm leading-6 text-danger">{actionError}</p>}
            </form>

            {copy.note && <details className="rounded-lg border border-border bg-surface-inset p-4 text-sm leading-7 text-text-muted">
                <summary className="cursor-pointer rounded-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{ui.scope}</summary>
                <p id={`${prefix}-scope`} className="mt-2">{copy.note}</p>
            </details>}

            <p className="flex items-start gap-2 text-xs leading-6 text-text-muted"><ShieldCheck aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-success" />{ui.privacy}</p>
        </div>
    </div>;
}
