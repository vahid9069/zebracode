'use client';

import React, { useMemo } from 'react';
import ConverterWorkbench from '@/components/tools/ConverterWorkbench';
import type { ToolDefinition, ToolOptionValue } from '@/config/tools';
import type { Locale } from '@/i18n/getDictionary';

interface UniversalConverterWorkbenchProps {
    tool: ToolDefinition;
    locale: Locale;
    title?: string;
    description?: string;
    category?: string;
}

export default function UniversalConverterWorkbench({
    tool,
    locale,
    title = locale === 'fa' ? tool.persianTitle : tool.title,
    description = tool.description,
    category,
}: UniversalConverterWorkbenchProps) {
    const validate = useMemo(() => (source: string) => {
        tool.validate(source);
        return source;
    }, [tool]);

    const convert = useMemo(
        () => (source: string, options: Record<string, ToolOptionValue>) => tool.transform(source, options),
        [tool]
    );

    return <ConverterWorkbench<string, string>
        key={tool.slug}
        title={title}
        description={description}
        locale={locale}
        category={category || tool.category}
        inputLanguage={tool.input.badge}
        outputLanguage={tool.output.badge}
        inputExtension={tool.input.acceptedExtensions}
        outputExtension={tool.output.fileExtension}
        outputMimeType={tool.output.downloadMimeType}
        initialInput={tool.input.sampleCode}
        sampleInput={tool.input.sampleCode}
        version={tool.version}
        specification="v1.0.0"
        toolOptions={tool.options}
        features={tool.features}
        codeSnippets={tool.codeSnippets}
        faqs={tool.faqs}
        validate={validate}
        convert={convert}
        serialize={output => output}
    />;
}
