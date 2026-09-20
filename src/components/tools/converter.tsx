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
        validationErrorMessage = 'Invalid input',
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
            setError(err.message || 'Error during conversion');
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
                setError(validationErrorMessage);
                setOutputValue('');
                return;
            }
        } else {
            setIsValid(true);
        }

        await performTransformation(text, secondaryInputValue, isSecondaryMode ? 'secondary' : 'primary');
    }, [validateInput, validationErrorMessage, performTransformation, secondaryInputValue, isSecondaryMode]);

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
            title: isInputMaximized ? 'Minimize' : 'Maximize',
            onClick: () => { setIsOutputMaximized(false); setIsInputMaximized(prev => !prev); },
            disabled: isOutputMaximized,
        },
    ], [isInputMaximized, isOutputMaximized]);

    const customOutputButtons = useMemo(() => {
        const btns: any[] = [
            {
                key: 'toggle-size-output',
                icon: isOutputMaximized ? <Minimize size={18} /> : <Maximize size={18} />,
                title: isOutputMaximized ? 'Minimize' : 'Maximize',
                onClick: () => { setIsInputMaximized(false); setIsOutputMaximized(prev => !prev); },
                disabled: isInputMaximized,
            },
        ];
        if (secondaryTransformFunction) {
            btns.push({
                key: 'toggle-secondary',
                icon: <Table size={18} className={isSecondaryMode ? 'text-blue-500' : 'text-gray-500'} />,
                title: isSecondaryMode ? 'Switch to primary output' : secondaryButtonText,
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
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-red-500 bg-red-50 dark:bg-red-900/20')
        : 'border-gray-300 dark:border-gray-600';

    const cardClasses = useCardStyle
        ? 'bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'
        : '';

    const inputHeight = isInputMaximized ? maxHeight : normalHeight;
    const outputHeight = isOutputMaximized ? maxHeight : normalHeight;

    return (
        <div className="w-full min-h-screen bg-background pb-12 text-foreground">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="relative mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-10 text-center">
                    <div className="relative">
                    <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center justify-center gap-3">
                        <IconComponent size={32} className="text-primary"/>
                        {title}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">
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
                                        className="bg-muted/60 px-4 py-2 border-b flex justify-between items-center">
                                        <h2 className="text-sm font-bold text-foreground">
                                            Input ({inputLanguage.toUpperCase()})
                                        </h2>
                                    </div>
                                )}
                                {!useCardStyle && (
                                    <h2 className="text-xl font-semibold mb-2 dark:text-white border-b pb-2">
                                        Input ({inputLanguage.toUpperCase()})
                                        {validateInput && isValid &&
                                            <CheckCircle size={20} className="inline ml-2 text-green-500"/>}
                                    </h2>
                                )}
                                <div
                                    className={`flex-1 relative ${!useCardStyle ? `rounded-lg border-2 ${inputBorderClass}` : ''}`}
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
                                        className="bg-muted/60 px-4 py-2 border-b flex justify-between items-center">
                                        <h2 className="text-sm font-bold text-foreground">
                                            {secondaryInputTitle}
                                        </h2>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleApplySecondary}
                                        >
                                            <Play size={12}/>
                                            Apply
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
                                    className="bg-muted/60 px-4 py-2 border-b flex justify-between items-center">
                                    <h2 className="text-sm font-bold text-foreground">
                                        Output ({currentOutputLanguage.toUpperCase()})
                                        {isSecondaryMode && <span className="text-blue-500 ml-1">(secondary)</span>}
                                    </h2>
                                    </div>
                            )}
                            {!useCardStyle && (
                                <h2 className="text-xl font-semibold mb-2 dark:text-white border-b pb-2">
                                    Output ({currentOutputLanguage.toUpperCase()})
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
                                        className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none">
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">📄</div>
                                            <div className="text-sm">Output will appear here</div>
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
                        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {features.map((f, i) => (
                                <Card key={i} className="text-center p-6">
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{f.description}</p>
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