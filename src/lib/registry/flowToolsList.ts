// بخش Flow در toolRegistry

import { flowToDts , flowToTs , flowToJs } from '@/lib/tools-transformer/flowTransformers';

import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

export const FlowToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- Flow tools ---------------------
    flowToJavascript: {
        type: 'flowToJavascript',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to JavaScript',
        shortDescription: 'Strip Flow type annotations to get plain JavaScript',
        description:
            'Convert Flow-typed JavaScript to standard, browser-ready JavaScript by removing all type annotations. This free online converter lets you compile Flow code instantly without installing the Flow binary. Ideal for sharing code snippets, migrating away from Flow, or debugging type-stripped output. No registration required, all processing is client-side.',
        icon: Code,
        href: '/flow-to-javascript',
        inputLanguage: 'flow',
        outputLanguage: 'javascript',
        transformFunction: flowToJs,
        gradientClasses: 'from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this tool accurately strip all Flow types?", answer: "Yes, it uses Babel with the Flow preset to ensure precise type annotation removal while preserving your JavaScript logic." },
                { question: "Will the output run in any browser?", answer: "Yes, the output is standard JavaScript compatible with all modern browsers and Node.js environments." },
                { question: "Is this suitable for migrating away from Flow?", answer: "Absolutely. This tool is a quick first step for extracting plain JavaScript before migrating to TypeScript or maintaining vanilla JS." }
            ]
        }
    },
    flowToTypescript: {
        type: 'flowToTypescript',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to TypeScript',
        shortDescription: 'Convert Flow type definitions to TypeScript',
        description:
            'Migrate your codebase from Flow to TypeScript with our online converter. It translates Flow type annotations into equivalent TypeScript interfaces, types, and utility types. Designed to speed up migration, the tool handles common patterns like maybe types, union types, and utility types. Free, browser-based, and secure—your code stays on your machine.',
        icon: Code,
        href: '/flow-to-typescript',
        inputLanguage: 'flow',
        outputLanguage: 'typescript',
        transformFunction: flowToTs,
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How accurate is the Flow to TypeScript conversion?", answer: "The tool maps Flow type annotations to their TypeScript equivalents, handling common patterns like maybe types, unions, and generics. Complex utility types may need manual review." },
                { question: "Does it convert all Flow-specific syntax?", answer: "Yes, it handles Flow's `?Type` (maybe), `{| |}` (exact objects), `$Keys`, `$Values`, and other Flow-specific utility types." },
                { question: "Can I use this to migrate a large codebase?", answer: "Yes, it's designed for migration. The converter handles the syntax translation, though we recommend running your test suite after conversion to verify correctness." }
            ]
        }
    },
    flowToTypescriptDeclaration: {
        type: 'flowToTypescriptDeclaration',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to TypeScript Declaration',
        shortDescription: 'Generate TypeScript declaration files from Flow types',
        description:
            'Automatically generate TypeScript .d.ts declaration files from your Flow type definitions. This converter preserves exported types, interfaces, and module shapes, making it perfect for creating type stubs for JavaScript libraries originally typed with Flow. A vital tool for teams transitioning to TypeScript while maintaining type safety. Works entirely in your browser.',
        icon: Code,
        href: '/flow-to-typescript-declaration',
        inputLanguage: 'flow',
        outputLanguage: 'typescript',   // .d.ts فایل‌های هم‌چنان TypeScript محسوب می‌شوند
        transformFunction: flowToDts,
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What are .d.ts files used for?", answer: ".d.ts declaration files provide type information for JavaScript libraries, enabling TypeScript users to get autocompletion and type checking when using your package." },
                { question: "Does it preserve module structure?", answer: "Yes, the tool preserves exported types, interfaces, and module declarations from your Flow code, generating clean .d.ts output." },
                { question: "Is this part of a Flow-to-TypeScript migration?", answer: "Yes, generating .d.ts files from Flow types is a key step in transitioning a library to TypeScript while maintaining type safety for consumers." }
            ]
        }
    },
};