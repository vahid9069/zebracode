'use client';

import React, { useState, useRef, useEffect, DragEvent, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { Compartment } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import {
    Clipboard, ClipboardPaste, Save, FolderOpen,
    Link, Upload, X, XCircle, Code, Eraser,
} from 'lucide-react';

/* ---------- types ---------- */
type ToolbarButton = {
    key: string;
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    disabled: boolean;
};
type ToolbarConfig = {
    copy?: boolean; paste?: boolean; save?: boolean;
    open?: boolean; sample?: boolean; clear?: boolean;
};
interface Props {
    theme: string | undefined;
    language: 'json' | 'javascript' | 'html' | 'sql' | 'markdown' | 'text' | 'typescript';
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    sampleCodeOne?: string;
    sampleCodeTwo?: string;
    toolbarConfig: ToolbarConfig;
    rightToolbarButtons: ToolbarButton[];
    onCreateEditor?: (view: EditorView) => void;
    direction?: 'ltr' | 'rtl';
}

/* ---------- compartments ---------- */
const languageConf   = new Compartment();
const themeConf      = new Compartment();
const readOnlyConf   = new Compartment();
const directionConf  = new Compartment();

/* ---------- helpers ---------- */
const getLanguageExtension = (language: string) => {
    switch (language) {
        case 'json':       return json();
        case 'javascript': return javascript();
        case 'typescript': return javascript({ typescript: true });
        case 'html':       return html();
        case 'sql':        return sql();
        case 'markdown':   return markdown();
        default:           return [];
    }
};

/* ---------- theme WITHOUT direction ---------- */
const fullCustomTheme = (isDark: boolean) => {
    const jsonColors = {
        key: '#0550ae', string: '#0a3069', number: '#0550ae',
        bool: '#cf222e', null: '#cf222e', bracket: '#24292f',
        punctuation: '#24292f', separator: '#24292f',
    };
    const darkJsonColors = {
        key: '#79c0ff', string: '#a5d6ff', number: '#79c0ff',
        bool: '#ffa198', null: '#ffa198', bracket: '#c9d1d9',
        punctuation: '#c9d1d9', separator: '#c9d1d9',
    };
    const colors = isDark ? darkJsonColors : jsonColors;

    const syntaxHighlightingStyle = syntaxHighlighting(
        HighlightStyle.define([
            { tag: t.propertyName,   color: `var(--json-key, ${colors.key})` },
            { tag: t.string,         color: `var(--json-string, ${colors.string})` },
            { tag: t.number,         color: `var(--json-number, ${colors.number})` },
            { tag: t.bool,           color: `var(--json-boolean, ${colors.bool})` },
            { tag: t.null,           color: `var(--json-null, ${colors.null})` },
            { tag: t.squareBracket,  color: `var(--json-bracket, ${colors.bracket})` },
            { tag: t.brace,          color: `var(--json-bracket, ${colors.bracket})` },
            { tag: t.punctuation,    color: `var(--json-punctuation, ${colors.punctuation})` },
            { tag: t.separator,      color: `var(--json-separator, ${colors.separator})` },
        ])
    );

    const baseTheme = EditorView.theme({
        '&': {
            fontSize: '14px',
            height: '100%',
        },
        '.cm-scroller': {
            overflow: 'auto',
        },
    });

    return [isDark ? oneDark : [], syntaxHighlightingStyle, baseTheme];
};

/* ---------- direction theme builder ---------- */
function buildDirectionTheme(dir: 'ltr' | 'rtl') {
    return EditorView.theme({
        '&': {
            direction: dir,
        },
        '.cm-content': {
            direction: dir,
        },
        '.cm-line': {
            direction: dir,
        },
        '.cm-editor': {
            flexDirection: dir === 'rtl' ? 'row-reverse' : 'row',
        },
        '.cm-gutters': {
            borderLeft: dir === 'rtl' ? 'none' : '1px solid #ddd',
            borderRight: dir === 'rtl' ? '1px solid #ddd' : 'none',
        },
    });
}

/* ---------- component ---------- */
const CodeMirrorEditorComponent: React.FC<Props> = ({
                                                        theme, language, value, onChange,
                                                        readOnly = false, sampleCodeOne, sampleCodeTwo,
                                                        toolbarConfig, rightToolbarButtons, onCreateEditor,
                                                        direction = 'ltr',
                                                    }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isExternalUpdate = useRef(false);

    const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [fileError, setFileError] = useState<string | null>(null);

    const isDark = theme === 'dark';
    const editorBgClass = isDark ? 'bg-gray-900' : 'bg-white';

    const displayNotification = useCallback((message: string, type: 'success' | 'error') => {
        setShowNotification({ message, type });
        setTimeout(() => setShowNotification(null), 3000);
    }, []);

    /* ---------- toolbar actions ---------- */
    const replaceDocumentContent = (newContent: string) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: newContent },
            // selection ایمن – انتهای سند
            selection: { anchor: newContent.length },
        });
    };

    const handleCopy   = async () => { try { await navigator.clipboard.writeText(value || ''); displayNotification('Copied!', 'success'); } catch { displayNotification('Copy failed', 'error'); } };
    const handlePaste  = async () => { if (!viewRef.current) return; try { const text = await navigator.clipboard.readText(); replaceDocumentContent(text); displayNotification('Pasted!', 'success'); } catch { displayNotification('Paste failed', 'error'); } };
    const handleSave   = () => { if (!value) { displayNotification('No content to save', 'error'); return; } const blob = new Blob([value], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `code-${Date.now()}.${language === 'json' ? 'json' : 'txt'}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); displayNotification('File saved', 'success'); };
    const handleSample1 = () => { if (sampleCodeOne) { replaceDocumentContent(sampleCodeOne); displayNotification('Sample loaded', 'success'); } };
    const handleSample2 = () => { if (sampleCodeTwo) { replaceDocumentContent(sampleCodeTwo); displayNotification('Sample 2 loaded', 'success'); } };
    const handleClear   = () => { replaceDocumentContent(''); displayNotification('Content cleared', 'success'); };

    /* ---------- file / url ---------- */
    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const content = event.target?.result as string; replaceDocumentContent(content); displayNotification('File loaded', 'success'); setShowOpenModal(false); }; reader.onerror = () => setFileError('File read error'); reader.readAsText(file); };
    const handleUrlLoad  = async () => { setFileError(null); try { const response = await fetch(urlInput); if (!response.ok) throw new Error('URL fetch failed'); const text = await response.text(); replaceDocumentContent(text); displayNotification('URL loaded', 'success'); setShowOpenModal(false); } catch { setFileError('URL fetch error'); } };

    /* ---------- update listener ---------- */
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            if (isExternalUpdate.current) { isExternalUpdate.current = false; return; }
            onChange(update.state.doc.toString());
        }
    });

    /* ---------- mount ---------- */
    useEffect(() => {
        if (!editorRef.current) return;
        const extensions = [
            basicSetup, updateListener,
            languageConf.of(getLanguageExtension(language)),
            themeConf.of(fullCustomTheme(isDark)),
            readOnlyConf.of(EditorState.readOnly.of(readOnly)),
            directionConf.of(buildDirectionTheme(direction)),
        ];
        const state = EditorState.create({ doc: value, extensions });
        const view  = new EditorView({ state, parent: editorRef.current });
        viewRef.current = view;
        onCreateEditor?.(view);
        return () => { view.destroy(); viewRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- update value ---------- */
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const currentDoc = view.state.doc.toString();
        if (currentDoc !== value) {
            isExternalUpdate.current = true;
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: value },
                // انتخاب ایمن – انتهای سند
                selection: { anchor: value.length },
                scrollIntoView: false,
            });
        }
    }, [value]);

    /* ---------- update language / theme / readOnly / direction ---------- */
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
            effects: [
                languageConf.reconfigure(getLanguageExtension(language)),
                themeConf.reconfigure(fullCustomTheme(isDark)),
                readOnlyConf.reconfigure(EditorState.readOnly.of(readOnly)),
                directionConf.reconfigure(buildDirectionTheme(direction)),
            ],
        });
    }, [language, isDark, readOnly, direction]);

    /* ---------- drag & drop ---------- */
    const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { replaceDocumentContent(event.target?.result as string); displayNotification('File loaded via drop', 'success'); }; reader.onerror = () => displayNotification('File read error', 'error'); reader.readAsText(file); } };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); };

    /* ---------- JSX ---------- */
    return (
        <div className={`h-full flex flex-col border rounded overflow-hidden ${editorBgClass}`}
             onDrop={handleDrop} onDragOver={handleDragOver}>
            {/* toolbar */}
            <div className="flex justify-between p-1 bg-gray-200 border-b border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                <div className="flex gap-1">
                    {!readOnly && toolbarConfig.clear  && <button onClick={handleClear} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Clear"><Eraser size={18} /></button>}
                    {toolbarConfig.copy                     && <button onClick={handleCopy} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Copy"><Clipboard size={18} /></button>}
                    {!readOnly && toolbarConfig.paste  && <button onClick={handlePaste} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Paste"><ClipboardPaste size={18} /></button>}
                    {toolbarConfig.save                    && <button onClick={handleSave} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Save"><Save size={18} /></button>}
                    {!readOnly && toolbarConfig.open   && <button onClick={() => setShowOpenModal(true)} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Open"><FolderOpen size={18} /></button>}
                    {!readOnly && toolbarConfig.sample && sampleCodeOne && <button onClick={handleSample1} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Sample 1"><Code size={18} /></button>}
                    {!readOnly && toolbarConfig.sample && sampleCodeTwo && <button onClick={handleSample2} className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700" title="Sample 2"><Code size={18} /></button>}
                </div>
                <div className="flex gap-1">
                    {rightToolbarButtons.map(btn => (
                        <button key={btn.key} onClick={btn.onClick} disabled={btn.disabled}
                                className="p-2 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-150 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                                title={btn.title}>{btn.icon}</button>
                    ))}
                </div>
            </div>

            {/* editor */}
            <div className="flex-1 overflow-hidden">
                <div ref={editorRef} className="h-full w-full" />
            </div>

            {/* notification */}
            {showNotification && (
                <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-xl text-white z-50 transition-opacity duration-300 ${showNotification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {showNotification.message}
                </div>
            )}

            {/* modal */}
            {showOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm">
                                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{dict.common.openFile}</h3>
                            <button onClick={() => { setShowOpenModal(false); setFileError(null); setUrlInput(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={24} /></button>
                        </div>
                        <label className="block mb-4">
                            <span className="text-gray-700 dark:text-gray-300">{dict.common.uploadFile}</span>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>{dict.common.selectFile}</span>
                                            <input type="file" className="sr-only" onChange={handleFileLoad} accept=".json,.txt,.sql,.md,.js,.html" />
                                        </label>
                                        <p className="pl-1">{dict.common.orDragAndDrop}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">JSON, TXT, SQL, MD, JS, HTML</p>
                                </div>
                            </div>
                        </label>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{dict.common.loadFromUrl}</label>
                            <div className="mt-1 flex shadow-sm">
                                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/file.json"
                                       className="flex-1 block w-full rounded-l-md border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <button onClick={handleUrlLoad} disabled={!urlInput}
                                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 rounded-r-md hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">
                                    <Link size={18} className="mr-2" />{dict.common.load}</button>
                            </div>
                        </div>
                        {fileError && <p className="text-red-500 text-sm mt-2 flex items-center"><XCircle size={16} className="mr-1" /> {fileError}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeMirrorEditorComponent;