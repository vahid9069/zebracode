// بخش TypeScript tools در toolRegistry.ts

import {tsToDts, tsToJs, tsToFlow, tsToZod, tsToJsonSchema} from '@/lib/tools-transformer/typescriptTransformers';

import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

// ... داخل toolRegistry
export const TypescriptToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- TypeScript Converters ---------------------
    'typescript-to-flow': {
        type: 'typescript-to-flow',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Flow',
        shortDescription: 'Convert TypeScript types to Flow type annotations',
        description:
            'Migrate your TypeScript type definitions to Flow with our free online converter. It maps interfaces, types, enums, and generics to their Flow equivalents, helping you transition codebases between these two static type checkers. Fast, browser-based, and requires no sign-up.',
        icon: Code,
        href: '/typescript-to-flow',
        inputLanguage: 'typescript',
        outputLanguage: 'flow',
        transformFunction: tsToFlow,
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why migrate from TS to Flow?", answer: "Flow and TypeScript share many concepts, but some projects prefer Flow for its specific type-checking characteristics or integration with older React setups." },
                { question: "Does it convert generics?", answer: "Yes, the tool maps TypeScript generic syntax to Flow-compatible generic syntax." },
                { question: "Is this for production migration?", answer: "It handles the syntax conversion efficiently, though large-scale migrations always benefit from manual testing and verification." }
            ]
        }
    },
    'typescript-to-javascript': {
        type: 'typescript-to-javascript',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to JavaScript',
        shortDescription: 'Compile TypeScript to plain JavaScript online',
        description:
            'Strip TypeScript type annotations and compile your code to clean JavaScript instantly. This free online tool removes types, handles enums and decorators, and outputs standard JavaScript that runs in any browser or Node.js environment. Perfect for quick demos, debugging, or sharing snippets without a build step.',
        icon: Code,
        href: '/typescript-to-javascript',
        inputLanguage: 'typescript',
        outputLanguage: 'javascript',
        transformFunction: tsToJs,
        gradientClasses: 'from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this replace the need for `tsc`?", answer: "This is a quick-and-easy online compiler for snippets. For large projects, the standard `tsc` compiler is recommended for full project configuration support." },
                { question: "Does it support decorators?", answer: "Yes, it is designed to handle common TypeScript features, including decorators, in the transpiled JavaScript." },
                { question: "Why compile to JS manually?", answer: "It's perfect for quick testing, verifying generated code, or sharing logic snippets without setting up a full build environment." }
            ]
        }
    },
    'typescript-to-json-schema': {
        type: 'typescript-to-json-schema',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to JSON Schema',
        shortDescription: 'Generate JSON Schema from TypeScript interfaces',
        description:
            'Transform your TypeScript interfaces and types into valid JSON Schema drafts. This online converter supports generics, unions, optional properties, and arrays, producing schemas perfect for request validation, configuration files, or API documentation. No registration needed, fully client-side.',
        icon: Code,
        href: '/typescript-to-json-schema',
        inputLanguage: 'typescript',
        outputLanguage: 'json',
        transformFunction: tsToJsonSchema,
        gradientClasses: 'from-purple-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How does it handle optional properties?", answer: "It correctly sets required fields in the JSON Schema based on whether a TypeScript property is optional or mandatory." },
                { question: "Can I use this for API docs?", answer: "Yes, the JSON Schema generated is standard-compliant, making it ready to be used in Swagger/OpenAPI or any JSON-driven documentation." },
                { question: "Does it support complex unions?", answer: "Yes, the tool converts TypeScript union types into JSON Schema `oneOf` or `anyOf` structures." }
            ]
        }
    },
    'typescript-to-typescript-declaration': {
        type: 'typescript-to-typescript-declaration',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Declaration (.d.ts)',
        shortDescription: 'Generate .d.ts declaration files from TypeScript source',
        description:
            'Extract only the type declarations from your TypeScript code, producing .d.ts files ready for library publishing. This free online tool removes implementations and keeps interfaces, types, and exports, helping you create type packages for your JavaScript modules. Works directly in your browser with no installation.',
        icon: Code,
        href: '/typescript-to-typescript-declaration',
        inputLanguage: 'typescript',
        outputLanguage: 'typescript',
        transformFunction: tsToDts,
        gradientClasses: 'from-teal-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What are .d.ts files for?", answer: ".d.ts files provide type information for your JavaScript modules, allowing other TypeScript users to get IntelliSense and type checking when using your package." },
                { question: "Does it remove all code?", answer: "Yes, it performs declaration extraction, stripping away logic and implementations while preserving type signatures." },
                { question: "Is this helpful for libraries?", answer: "Absolutely, it's a vital step for creating type-safe declarations for libraries published to NPM." }
            ]
        }
    },
    'typescript-to-zod': {
        type: 'typescript-to-zod',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Zod',
        shortDescription: 'Generate Zod validation schemas from TypeScript types',
        description:
            'Convert your TypeScript type definitions into Zod schemas instantly. This free online tool translates interfaces, enums, unions, and optional properties into safe, runtime type validators. Perfect for adding validation to Next.js server actions, API routes, or form libraries without writing schemas by hand. Entirely browser-based—no sign-up needed.',
        icon: Code,
        href: '/typescript-to-zod',
        inputLanguage: 'typescript',
        outputLanguage: 'typescript',
        transformFunction: tsToZod,
        gradientClasses: 'from-cyan-50 to-teal-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why use Zod with TypeScript?", answer: "TypeScript provides compile-time checking, while Zod provides runtime validation, ensuring your data adheres to your types when it reaches your server." },
                { question: "Does it handle complex interfaces?", answer: "Yes, the tool is designed to map complex nested interfaces and object definitions into robust Zod schemas." },
                { question: "Is it suitable for form validation?", answer: "Yes, Zod schemas are industry-standard for libraries like react-hook-form, making this converter perfect for form-heavy apps." }
            ]
        }
    },
};