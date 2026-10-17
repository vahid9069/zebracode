// components/Converter.tsx
'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Maximize, Minimize, Table, CheckCircle, Play } from 'lucide-react';
import CodeMirrorEditorComponent from '@/components/CodeMirrorEditorComponent';
import { ToolMeta } from '@/types/types';
import SeoContent from "../pages/SeoContent";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOptionalI18n } from '@/i18n/I18nProvider';

type CodeMirrorLanguage = 'json' | 'javascript' | 'html' | 'sql' | 'markdown' | 'text';

const mapToCodeMirrorLang = (lang: string): CodeMirrorLanguage => {
    const n = lang.toLowerCase();
    if (n === 'json') return 'json';
    if (n === 'javascript' || n === 'js' || n === 'typescript' || n === 'ts' || n === 'flow') return 'javascript';
    if (n === 'html') return 'html';
    if (n === 'sql') return 'sql';
    if (n === 'markdown' || n === 'md') return 'markdown';
    return 'text';
};

interface ConverterProps {
    config: ToolMeta;
    locale?: 'fa' | 'en';
}

export default function Converter({ config, locale = 'en' }: ConverterProps) {
    const {
        title,
        description,
        icon: IconComponent,
        transformFunction,
        outputLanguage,
        inputLanguage,
        sampleCodeSimple,
        sampleCodeComplex,
        validateInput,
        validationErrorMessage,
        secondaryTransformFunction,
        secondaryButtonText = 'Toggle Output',
        secondaryOutputLanguage,
        requiresSecondaryInput = false,
        secondaryInputTitle = 'Secondary Input',
        secondarySampleCode = '',
        features,
        gradientClasses = 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        useCardStyle = true,
        normalHeight = '400px',
        maxHeight = '600px',
    } = config;

    const [inputValue, setInputValue] = useState('');
    const [secondaryInputValue, setSecondaryInputValue] = useState(secondarySampleCode);
    const [outputValue, setOutputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const [isSecondaryMode, setIsSecondaryMode] = useState(false);
    const { theme } = useTheme();
    const t = useOptionalI18n()?.dict.common;
    const validationMessage = validationErrorMessage || t?.invalidInput || 'Invalid input';

    const [isInputMaximized, setIsInputMaximized] = useState(false);
    const [isOutputMaximized, setIsOutputMaximized] = useState(false);

    const currentOutputLanguage = isSecondaryMode && secondaryOutputLanguage
        ? secondaryOutputLanguage
        : outputLanguage;

    // پایدارسازی ارجاع به توابع تبدیل
    const transformRef = useRef(transformFunction);
    transformRef.current = transformFunction;
    const secondaryTransformRef = useRef(secondaryTransformFunction);
    secondaryTransformRef.current = secondaryTransformFunction;

    // نگه‌داری آخرین context در ref (همیشه به‌روز)
    const secondaryInputRef = useRef(secondarySampleCode);
    useEffect(() => {
        secondaryInputRef.current = secondaryInputValue;
    }, [secondaryInputValue]);

    // انجام تبدیل
    const performTransformation = useCallback(async (
        primary: string,
        secondary: string,
        mode: 'primary' | 'secondary'
    ) => {
        const fn = mode === 'secondary' && secondaryTransformRef.current
            ? secondaryTransformRef.current
            : transformRef.current;

        // استفاده از ref برای context (مطمئن‌ترین روش)
        const contextToUse = requiresSecondaryInput ? (secondaryInputRef.current || secondary) : undefined;

        try {
            const result = await fn(primary, contextToUse);
            setOutputValue(result);
            setError(null);
        } catch (err: any) {
            console.error('Transformation error:', err);
            setError(err.message || t?.conversionError || 'Error during conversion');
            setOutputValue('');
        }
    }, [requiresSecondaryInput]);

    // Handlerها
    const handlePrimaryInputChange = useCallback(async (value: string | undefined) => {
        const text = value ?? '';
        setInputValue(text);
        setError(null);

        if (!text.trim()) {
            setOutputValue('');
            setIsValid(false);
            return;
        }

        if (validateInput) {
            const valid = validateInput(text);
            setIsValid(valid);
            if (!valid) {
                setError(validationMessage);
                setOutputValue('');
                return;
            }
        } else {
            setIsValid(true);
        }

        await performTransformation(text, secondaryInputValue, isSecondaryMode ? 'secondary' : 'primary');
    }, [validateInput, validationMessage, performTransformation, secondaryInputValue, isSecondaryMode]);

    const handleSecondaryInputChange = useCallback((value: string | undefined) => {
        const text = value ?? '';
        setSecondaryInputValue(text);
        secondaryInputRef.current = text;  // به‌روزرسانی فوری ref
    }, []);

    const toggleSecondaryMode = useCallback(async () => {
        if (!inputValue.trim() || (validateInput && !isValid)) return;
        const nextMode = !isSecondaryMode;
        setIsSecondaryMode(nextMode);
        await performTransformation(inputValue, secondaryInputValue, nextMode ? 'secondary' : 'primary');
    }, [inputValue, secondaryInputValue, isSecondaryMode, isValid, validateInput, performTransformation]);

    // تابع کمکی برای تبدیل دستی (با کلیک دکمه Apply)
    const handleApplySecondary = useCallback(() => {
        if (!inputValue.trim()) return;
        performTransformation(
            inputValue,
            secondaryInputValue,
            isSecondaryMode ? 'secondary' : 'primary'
        );
    }, [inputValue, secondaryInputValue, isSecondaryMode, performTransformation]);

    // دکمه‌های ابزار
    const customInputButtons = useMemo(() => [
        {
            key: 'toggle-size-input',
            icon: isInputMaximized ? <Minimize size={18} /> : <Maximize size={18} />,
            title: isInputMaximized ? (t?.minimize || 'Minimize') : (t?.maximize || 'Maximize'),
            onClick: () => { setIsOutputMaximized(false); setIsInputMaximized(prev => !prev); },
            disabled: isOutputMaximized,
        },
    ], [isInputMaximized, isOutputMaximized]);

    const customOutputButtons = useMemo(() => {
        const btns: any[] = [
            {
                key: 'toggle-size-output',
                icon: isOutputMaximized ? <Minimize size={18} /> : <Maximize size={18} />,
                title: isOutputMaximized ? (t?.minimize || 'Minimize') : (t?.maximize || 'Maximize'),
                onClick: () => { setIsInputMaximized(false); setIsOutputMaximized(prev => !prev); },
                disabled: isInputMaximized,
            },
        ];
        if (secondaryTransformFunction) {
            btns.push({
                key: 'toggle-secondary',
                icon: <Table size={18} className={isSecondaryMode ? 'text-action dark:text-focus' : 'text-text-muted'} />,
                title: isSecondaryMode ? (t?.switchPrimaryOutput || 'Switch to primary output') : secondaryButtonText,
                onClick: toggleSecondaryMode,
                disabled: !inputValue.trim() || (validateInput && !isValid),
            });
        }
        return btns;
    }, [
        isInputMaximized, isOutputMaximized,
        secondaryTransformFunction, isSecondaryMode,
        secondaryButtonText, toggleSecondaryMode,
        inputValue, isValid, validateInput,
    ]);

    // کلاس‌های layout
    const gridCols = (isInputMaximized || isOutputMaximized) ? 'lg:grid-cols-1' : 'lg:grid-cols-2';

    const inputBorderClass = validateInput && inputValue.trim()
        ? (isValid
            ? 'border-success bg-success-soft'
            : 'border-danger bg-danger-soft')
        : 'border-border-strong bg-surface-inset';

    const cardClasses = useCardStyle
        ? 'bg-surface rounded-xl shadow-lg border border-border-strong overflow-hidden'
        : '';

    const inputHeight = isInputMaximized ? maxHeight : normalHeight;
    const outputHeight = isOutputMaximized ? maxHeight : normalHeight;

    return (
        <div className="w-full min-h-screen bg-canvas pb-12 text-text">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-border-strong bg-gradient-to-br from-action-soft via-surface to-surface px-6 py-10 text-center">
                    <div className="relative">
                    <h1 className="mb-2 flex items-center justify-center gap-3 text-4xl font-extrabold text-text">
                        <IconComponent size={32} className="text-action dark:text-focus"/>
                        {title}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="mb-4 rounded border border-danger bg-danger-soft p-3 text-danger">
                        {error}
                    </div>
                )}

                {/* Grid */}
                <div className={`grid grid-cols-1 ${gridCols} gap-6 min-h-[50vh]`}>
                    {/* Input Section */}
                    {!isOutputMaximized && (
                        <div className={`flex flex-col gap-4 ${isInputMaximized ? 'lg:col-span-2' : ''}`}>
                            <Card className={`flex flex-col overflow-hidden ${requiresSecondaryInput ? 'flex-1' : 'h-full'}`}>
                                {useCardStyle && (
                                    <div
                                        className="flex items-center justify-between border-b border-border-strong bg-surface-inset px-4 py-2">
                                        <h2 className="text-sm font-bold text-text">
                                            {t?.input || 'Input'} ({inputLanguage.toUpperCase()})
                                        </h2>
                                    </div>
                                )}
                                {!useCardStyle && (
                                    <h2 className="mb-2 border-b border-border pb-2 text-xl font-semibold text-text">
                                        {t?.input || 'Input'} ({inputLanguage.toUpperCase()})
                                        {validateInput && isValid &&
                                            <CheckCircle size={20} className="inline ms-2 text-success"/>}
                                    </h2>
                                )}
                                <div
                                    className={`relative flex-1 ${!useCardStyle ? `rounded-lg border-2 ${inputBorderClass} focus-within:outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-surface` : ''}`}
                                    style={{height: useCardStyle ? '100%' : inputHeight}}
                                >
                                    <CodeMirrorEditorComponent
                                        theme={theme}
                                        language={mapToCodeMirrorLang(inputLanguage)}
                                        value={inputValue}
                                        onChange={handlePrimaryInputChange}
                                        readOnly={false}
                                        toolbarConfig={{
                                            copy: true,
                                            clear: true,
                                            paste: true,
                                            save: true,
                                            open: true,
                                            sample: true
                                        }}
                                        sampleCodeOne={sampleCodeSimple}
                                        sampleCodeTwo={sampleCodeComplex}
                                        rightToolbarButtons={customInputButtons}
                                    />
                                </div>
                            </Card>

                            {/* Secondary Input */}
                            {requiresSecondaryInput && (
                                <Card className="flex flex-col flex-1 overflow-hidden">
                                    <div
                                        className="flex items-center justify-between border-b border-border-strong bg-surface-inset px-4 py-2">
                                        <h2 className="text-sm font-bold text-text">
                                            {secondaryInputTitle}
                                        </h2>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleApplySecondary}
                                        >
                                            <Play size={12}/>
                                            {t?.apply || 'Apply'}
                                        </Button>
                                    </div>
                                    <div className="flex-1">
                                        <CodeMirrorEditorComponent
                                            theme={theme}
                                            language="json"
                                            value={secondaryInputValue}
                                            onChange={handleSecondaryInputChange}
                                            readOnly={false}
                                            toolbarConfig={{copy: true, clear: true, paste: true, save: true}}
                                            rightToolbarButtons={[]}
                                        />
                                    </div>
                                    </Card>
                            )}
                        </div>
                    )}

                    {/* Output Section */}
                    {!isInputMaximized && (
                        <Card className={`flex flex-col overflow-hidden ${isOutputMaximized ? 'lg:col-span-2' : ''}`}>
                            {useCardStyle && (
                                <div
                                    className="flex items-center justify-between border-b border-border-strong bg-surface-inset px-4 py-2">
                                    <h2 className="text-sm font-bold text-text">
                                        {t?.output || 'Output'} ({currentOutputLanguage.toUpperCase()})
                                        {isSecondaryMode && <span className="ms-1 text-action dark:text-focus">({t?.secondary || 'secondary'})</span>}
                                    </h2>
                                    </div>
                            )}
                            {!useCardStyle && (
                                <h2 className="mb-2 border-b border-border pb-2 text-xl font-semibold text-text">
                                    {t?.output || 'Output'} ({currentOutputLanguage.toUpperCase()})
                                </h2>
                            )}
                            <div
                                className="flex-1 relative"
                                style={{height: useCardStyle ? '100%' : outputHeight}}
                            >
                                <CodeMirrorEditorComponent
                                    theme={theme}
                                    language={mapToCodeMirrorLang(currentOutputLanguage)}
                                    value={outputValue}
                                    onChange={() => {
                                    }}
                                    readOnly={true}
                                    toolbarConfig={{copy: true, save: true}}
                                    rightToolbarButtons={customOutputButtons}
                                />
                                {!outputValue && (
                                    <div
                                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-text-muted">
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">📄</div>
                                            <div className="text-sm">{t?.outputPlaceholder || 'Output will appear here'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Features Section */}
                {features && features.length > 0 && (
                    <div className="mt-12 max-w-4xl mx-auto">
                        <h3 className="mb-6 text-center text-2xl font-bold text-text">{t?.features || 'Features'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {features.map((f, i) => (
                                <Card key={i} className="text-center p-6">
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h4 className="mb-2 font-semibold text-text">{f.title}</h4>
                                    <p className="text-sm text-text-muted">{f.description}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="yn-bnr" id="ynpos-18249"></div>
            {/* ========== محتوای سئو (خودکار) ========== */}
            <SeoContent
                toolType={config.type}
                subCategory={config.subCategory || 'others'}
                description={config.extraContent?.description || config.description}
                customFaq={config.extraContent?.faq}
                locale={locale}
            />
        </div>
    );
}
