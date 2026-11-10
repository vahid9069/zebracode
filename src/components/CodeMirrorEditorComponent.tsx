'use client';

import React, { useId, useState, useRef, useEffect, DragEvent, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { EditorView, basicSetup } from 'codemirror';
import { placeholder as editorPlaceholder } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import {
    Clipboard, ClipboardPaste, Save, FolderOpen,
    Link, Upload, X, XCircle, Code, Eraser,
} from 'lucide-react';
import { useOptionalI18n } from '@/i18n/I18nProvider';
import { IconButton } from '@/components/ui/icon-button';

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
export type CodeEditorLanguage = 'json' | 'javascript' | 'html' | 'sql' | 'markdown' | 'text' | 'typescript' | 'xml';

interface Props {
    theme: string | undefined;
    language: CodeEditorLanguage;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    sampleCodeOne?: string;
    sampleCodeTwo?: string;
    toolbarConfig: ToolbarConfig;
    rightToolbarButtons: ToolbarButton[];
    onCreateEditor?: (view: EditorView) => void;
    direction?: 'ltr' | 'rtl';
    id?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    placeholder?: string;
    showToolbar?: boolean;
    allowFileDrop?: boolean;
}

/* ---------- compartments ---------- */
const languageConf   = new Compartment();
const themeConf      = new Compartment();
const readOnlyConf   = new Compartment();
const directionConf  = new Compartment();
const attributesConf = new Compartment();
const placeholderConf = new Compartment();

/* ---------- helpers ---------- */
const getLanguageExtension = (language: string) => {
    switch (language) {
        case 'json':       return json();
        case 'javascript': return javascript();
        case 'typescript': return javascript({ typescript: true });
        case 'html':       return html();
        case 'sql':        return sql();
        case 'markdown':   return markdown();
        case 'xml':        return xml();
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
                                                        id, ariaLabelledby, ariaDescribedby, placeholder = '',
                                                        showToolbar = true, allowFileDrop = true,
                                                    }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isExternalUpdate = useRef(false);
    // The view lives across renders; its listener must not retain the initial workbench state.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [fileError, setFileError] = useState<string | null>(null);
    const dialogDescriptionId = useId();

    const isDark = theme === 'dark';
    const editorBgClass = 'bg-surface';
    const dict = useOptionalI18n()?.dict;
    const editor = dict?.common?.editor;

    const displayNotification = useCallback((message: string, type: 'success' | 'error') => {
        setShowNotification({ message, type });
        setTimeout(() => setShowNotification(null), 3000);
    }, []);

    /* ---------- toolbar actions ---------- */
    const replaceDocumentContent = (newContent: string) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const document = view.state.toText(newContent);
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: document },
            // selection ایمن – انتهای سند
            selection: { anchor: document.length },
        });
    };

    const handleCopy   = async () => { try { await navigator.clipboard.writeText(value || ''); displayNotification(editor?.copied || 'Copied!', 'success'); } catch { displayNotification(editor?.copyFailed || 'Copy failed', 'error'); } };
    const handlePaste  = async () => { if (!viewRef.current) return; try { const text = await navigator.clipboard.readText(); replaceDocumentContent(text); displayNotification(editor?.pasted || 'Pasted!', 'success'); } catch { displayNotification(editor?.pasteFailed || 'Paste failed', 'error'); } };
    const handleSave   = () => { if (!value) { displayNotification(editor?.noContent || 'No content to save', 'error'); return; } const blob = new Blob([value], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `code-${Date.now()}.${language === 'json' ? 'json' : 'txt'}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); displayNotification(editor?.saved || 'File saved', 'success'); };
    const handleSample1 = () => { if (sampleCodeOne) { replaceDocumentContent(sampleCodeOne); displayNotification(editor?.sampleLoaded || 'Sample loaded', 'success'); } };
    const handleSample2 = () => { if (sampleCodeTwo) { replaceDocumentContent(sampleCodeTwo); displayNotification(editor?.sample2Loaded || 'Sample 2 loaded', 'success'); } };
    const handleClear   = () => { replaceDocumentContent(''); displayNotification(editor?.cleared || 'Content cleared', 'success'); };

    /* ---------- file / url ---------- */
    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const content = event.target?.result as string; replaceDocumentContent(content); displayNotification(editor?.fileLoaded || 'File loaded', 'success'); setShowOpenModal(false); }; reader.onerror = () => setFileError(editor?.fileReadError || 'File read error'); reader.readAsText(file); };
    const handleUrlLoad  = async () => { setFileError(null); try { const response = await fetch(urlInput); if (!response.ok) throw new Error('URL fetch failed'); const text = await response.text(); replaceDocumentContent(text); displayNotification(editor?.urlLoaded || 'URL loaded', 'success'); setShowOpenModal(false); } catch { setFileError(editor?.urlFetchError || 'URL fetch error'); } };

    /* ---------- update listener ---------- */
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            if (isExternalUpdate.current) { isExternalUpdate.current = false; return; }
            onChangeRef.current(update.state.doc.toString());
        }
    });

    /* ---------- mount ---------- */
    useEffect(() => {
        if (!editorRef.current) return;
        const extensions = [
            basicSetup, updateListener,
            languageConf.of(getLanguageExtension(language)),
            themeConf.of(fullCustomTheme(isDark)),
            readOnlyConf.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
            directionConf.of(buildDirectionTheme(direction)),
            attributesConf.of(EditorView.contentAttributes.of({
                ...(id ? { id } : {}),
                ...(ariaLabelledby ? { 'aria-labelledby': ariaLabelledby } : {}),
                ...(ariaDescribedby ? { 'aria-describedby': ariaDescribedby } : {}),
                'aria-readonly': String(readOnly),
                'aria-multiline': 'true',
                role: 'textbox', tabindex: '0',
                spellcheck: 'false', autocapitalize: 'off',
            })),
            placeholderConf.of(editorPlaceholder(placeholder)),
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
            const document = view.state.toText(value);
            isExternalUpdate.current = true;
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: document },
                // انتخاب ایمن – انتهای سند
                selection: { anchor: document.length },
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
                readOnlyConf.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
                directionConf.reconfigure(buildDirectionTheme(direction)),
                attributesConf.reconfigure(EditorView.contentAttributes.of({
                    ...(id ? { id } : {}),
                    ...(ariaLabelledby ? { 'aria-labelledby': ariaLabelledby } : {}),
                    ...(ariaDescribedby ? { 'aria-describedby': ariaDescribedby } : {}),
                    'aria-readonly': String(readOnly),
                    'aria-multiline': 'true',
                    role: 'textbox', tabindex: '0',
                    spellcheck: 'false', autocapitalize: 'off',
                })),
                placeholderConf.reconfigure(editorPlaceholder(placeholder)),
            ],
        });
    }, [language, isDark, readOnly, direction, id, ariaLabelledby, ariaDescribedby, placeholder]);

    /* ---------- drag & drop ---------- */
    const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (readOnly || !allowFileDrop) return; const file = e.dataTransfer.files[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { replaceDocumentContent(event.target?.result as string); displayNotification(editor?.dropped || 'File loaded via drop', 'success'); }; reader.onerror = () => displayNotification(editor?.fileReadError || 'File read error', 'error'); reader.readAsText(file); } };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); };

    /* ---------- JSX ---------- */
    return (
        <Dialog.Root
            open={showOpenModal}
            onOpenChange={open => {
                setShowOpenModal(open);
                if (!open) {
                    setFileError(null);
                    setUrlInput('');
                }
            }}
        >
        <div data-editor-id={id} data-editor-language={language} data-editor-readonly={readOnly} className={`h-full flex flex-col border rounded overflow-hidden ${editorBgClass}`}
             onDrop={handleDrop} onDragOver={handleDragOver}>
            {/* toolbar */}
            {showToolbar && <div className="flex flex-wrap items-center justify-between gap-1 p-1 bg-surface-inset border-b border-border-strong text-text">
                <div className="flex flex-wrap gap-1">
                    {!readOnly && toolbarConfig.clear  && <IconButton type="button" size="sm" onClick={handleClear} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.clear || 'Clear'} aria-label={editor?.clear || 'Clear'}><Eraser size={18} /></IconButton>}
                    {toolbarConfig.copy                     && <IconButton type="button" size="sm" onClick={handleCopy} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.copy || 'Copy'} aria-label={editor?.copy || 'Copy'}><Clipboard size={18} /></IconButton>}
                    {!readOnly && toolbarConfig.paste  && <IconButton type="button" size="sm" onClick={handlePaste} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.paste || 'Paste'} aria-label={editor?.paste || 'Paste'}><ClipboardPaste size={18} /></IconButton>}
                    {toolbarConfig.save                    && <IconButton type="button" size="sm" onClick={handleSave} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.save || 'Save'} aria-label={editor?.save || 'Save'}><Save size={18} /></IconButton>}
                    {!readOnly && toolbarConfig.open   && <Dialog.Trigger asChild><IconButton type="button" size="sm" className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.open || 'Open'} aria-label={editor?.open || 'Open'}><FolderOpen size={18} /></IconButton></Dialog.Trigger>}
                    {!readOnly && toolbarConfig.sample && sampleCodeOne && <IconButton type="button" size="sm" onClick={handleSample1} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.sample1 || 'Sample 1'} aria-label={editor?.sample1 || 'Sample 1'}><Code size={18} /></IconButton>}
                    {!readOnly && toolbarConfig.sample && sampleCodeTwo && <IconButton type="button" size="sm" onClick={handleSample2} className="text-text-muted hover:bg-surface-raised hover:text-text" title={editor?.sample2 || 'Sample 2'} aria-label={editor?.sample2 || 'Sample 2'}><Code size={18} /></IconButton>}
                </div>
                <div className="flex flex-wrap gap-1">
                    {rightToolbarButtons.map(btn => (
                        <IconButton key={btn.key} type="button" size="sm" onClick={btn.onClick} disabled={btn.disabled}
                                className="text-text-muted hover:bg-surface-raised hover:text-text"
                                title={btn.title} aria-label={btn.title}>{btn.icon}</IconButton>
                    ))}
                </div>
            </div>}

            {/* editor */}
            <div className="cm-editor-shell flex-1 overflow-hidden">
                <div ref={editorRef} className="h-full w-full" />
            </div>

            {/* notification */}
            {showNotification && (
                <div role={showNotification.type === 'error' ? 'alert' : 'status'} aria-live={showNotification.type === 'error' ? 'assertive' : 'polite'} aria-atomic="true" className={`fixed bottom-4 right-4 z-50 rounded-lg p-3 shadow-xl text-action-foreground transition-opacity duration-300 ${showNotification.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
                    {showNotification.message}
                </div>
            )}

             <Dialog.Portal>
                 <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                 <Dialog.Content
                      className="fixed inset-0 z-50 m-auto h-fit w-[calc(100%-2rem)] max-w-sm rounded-lg bg-surface-raised p-6 text-text shadow-2xl"
                     aria-describedby={dialogDescriptionId}
                 >
                     <div className="mb-4 flex items-center justify-between">
                          <Dialog.Title className="text-xl font-semibold text-text">
                             {dict?.common?.openFile || 'Open file'}
                         </Dialog.Title>
                         <Dialog.Close asChild>
                             <button
                                 type="button"
                                 aria-label={dict?.layout?.closeMenu || 'Close dialog'}
                                  className="rounded p-1 text-text-muted hover:bg-surface-inset hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                             >
                                 <X size={24} />
                             </button>
                         </Dialog.Close>
                     </div>
                     <Dialog.Description id={dialogDescriptionId} className="sr-only">
                         {dict?.common?.loadFromUrl || (dict?.common?.editor ? 'Load content from a file or URL' : 'بارگذاری محتوا از فایل یا URL')}
                     </Dialog.Description>
                     <label className="mb-4 block">
                          <span className="text-text">{dict?.common?.uploadFile || 'Upload file'}</span>
                          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border-strong px-6 pb-6 pt-5">
                             <div className="space-y-1 text-center">
                                  <Upload className="mx-auto h-12 w-12 text-text-muted" />
                                  <div className="flex text-sm text-text-muted">
                                      <label className="relative cursor-pointer rounded-md bg-surface font-medium text-action hover:text-action-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-focus dark:text-focus dark:hover:text-focus">
                                         <span>{dict?.common?.selectFile || 'Select a file'}</span>
                                         <input type="file" className="sr-only" onChange={handleFileLoad} accept=".json,.txt,.sql,.md,.js,.html" />
                                     </label>
                                      <p className="ps-1">{dict?.common?.orDragAndDrop || 'or drag and drop'}</p>
                                 </div>
                                  <p className="text-xs text-text-subtle">JSON, TXT, SQL, MD, JS, HTML</p>
                             </div>
                         </div>
                     </label>
                     <div className="mb-4">
                          <label htmlFor="code-editor-url" className="block text-sm font-medium text-text">
                             {dict?.common?.loadFromUrl || 'Load from URL'}
                         </label>
                         <div className="mt-1 flex shadow-sm">
                             <input
                                 id="code-editor-url"
                                 type="url"
                                 value={urlInput}
                                 onChange={e => setUrlInput(e.target.value)}
                                 placeholder="https://example.com/file.json"
                                  className="block w-full flex-1 rounded-l-md border-border-strong bg-surface-inset p-2 text-text placeholder:text-text-muted"
                             />
                             <button
                                 type="button"
                                 onClick={handleUrlLoad}
                                 disabled={!urlInput}
                                   className="inline-flex items-center rounded-e-md border border-s-0 border-border-strong bg-surface-inset px-4 py-2 text-sm font-medium text-text hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
                             >
                                  <Link size={18} className="me-2" />{dict?.common?.load || 'Load'}
                             </button>
                         </div>
                     </div>
                       {fileError && <p role="alert" className="mt-2 flex items-center text-sm text-danger"><XCircle size={16} className="me-1" /> {fileError}</p>}
                 </Dialog.Content>
             </Dialog.Portal>
         </div>
         </Dialog.Root>
    );
};

export default CodeMirrorEditorComponent;
