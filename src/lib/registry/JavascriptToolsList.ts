// مسیر: src/contants/toolsList/converters/JavascriptToolsList.ts
import { Code, FileJson, FileCode2 } from "lucide-react";
import { ToolMeta } from "@/types/types";

// توابع تبدیل از ماژول مربوطه (بعداً می‌سازید یا تغییر می‌دهید)
import {
    es5ToEs6,
    es6ToEs5,
    jsToJson,
    jsToTypescript
} from "@/lib/tools-transformer/javascriptTransformers";

export const JavascriptToolsList: Record<string, ToolMeta> = {
    'es5-to-es6': {
        type: 'es5-to-es6',
        category: 'converters',
        subCategory: 'javascript',
        title: 'ES5 to ES6',
        shortDescription: 'Convert ES5 JavaScript code to modern ES6+ syntax',
        description:
            'Transform your legacy ES5 code into modern ES6+ JavaScript. This free online converter updates `var` to `let`/`const`, converts functions to arrow functions, uses template literals, and applies many other modern syntax improvements—perfect for refactoring older codebases. Works directly in your browser.',
        icon: Code,
        href: '/es5-to-es6',
        inputLanguage: 'javascript',
        outputLanguage: 'javascript',
        transformFunction: es5ToEs6,
        gradientClasses: 'from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why refactor ES5 to modern ES6+?", answer: "Modern ES6+ syntax is cleaner, more concise, and offers better performance optimizations for modern JavaScript engines." },
                { question: "Does it convert all `var` declarations?", answer: "Yes, the tool intelligently upgrades `var` to `let` or `const` based on their usage scope and re-assignment." },
                { question: "Is this safe for production code?", answer: "It follows standard syntax refactoring rules, but we always recommend running your test suite after refactoring legacy codebases." }
            ]
        }
    },
    'es6-to-es5': {
        type: 'es6-to-es5',
        category: 'converters',
        subCategory: 'javascript',
        title: 'ES6 to ES5',
        shortDescription: 'Transpile ES6+ JavaScript down to ES5 for compatibility',
        description:
            'Convert modern ES6+ JavaScript back to broadly compatible ES5 code. This free tool transpiles arrow functions, template literals, `const`/`let`, classes, and more into ES5 equivalents—perfect for supporting older browsers or environments. Simple, fast, and runs entirely in your browser.',
        icon: Code,
        href: '/es6-to-es5',
        inputLanguage: 'javascript',
        outputLanguage: 'javascript',
        transformFunction: es6ToEs5,
        gradientClasses: 'from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why transpile ES6+ to ES5?", answer: "To ensure your application runs seamlessly in older browsers (like Internet Explorer) that do not support modern ES6+ features." },
                { question: "Does it support classes and inheritance?", answer: "Yes, it transpiles modern ES6 class syntax into ES5 prototype-based object structures." },
                { question: "Can I use this for production environments?", answer: "Yes, it produces standard, high-compatibility code suitable for deployment in environments requiring ES5 support." }
            ]
        }
    },
    'js-to-json': {
        type: 'js-to-json',
        category: 'converters',
        subCategory: 'javascript',
        title: 'JS to JSON',
        shortDescription: 'Extract or convert a JavaScript object to JSON',
        description:
            'Turn a JavaScript object literal into valid JSON with a single click. Our online converter handles quotes, trailing commas, and unquoted keys, outputting clean, standards-compliant JSON. Great for config files, API payloads, or safely serializing data. No sign-up, fully client-side.',
        icon: FileJson,
        href: '/js-to-json',
        inputLanguage: 'javascript',
        outputLanguage: 'json',
        transformFunction: jsToJson,
        gradientClasses: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How is this different from JSON.stringify?", answer: "Unlike standard `JSON.stringify`, this tool handles common JS object syntax (like unquoted keys or trailing commas) that isn't strict JSON, converting it to valid standards-compliant JSON." },
                { question: "Can it handle circular references?", answer: "This converter focuses on object literals. For complex objects with circular references, it may require manual cleanup." },
                { question: "Is the output valid JSON?", answer: "Yes, the tool ensures the final output follows strict JSON standards, making it safe for data interchange." }
            ]
        }
    },
    'js-to-typescript': {
        type: 'js-to-typescript',
        category: 'converters',
        subCategory: 'javascript',
        title: 'JS to TypeScript',
        shortDescription: 'Convert JavaScript code to TypeScript with type annotations',
        description:
            'Migrate your JavaScript code to TypeScript automatically. This free converter infers types, adds interfaces, and converts `PropTypes` to TypeScript interfaces where possible. Perfect for bootstrapping type safety in existing JavaScript projects. Works offline in your browser, no registration required.',
        icon: FileCode2,
        href: '/js-to-typescript',
        inputLanguage: 'javascript',
        outputLanguage: 'typescript',
        transformFunction: jsToTypescript,
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How accurate is the type inference?", answer: "The tool analyzes usage patterns in your JavaScript code to infer likely types, though complex dynamic patterns might require manual review." },
                { question: "Does it convert PropTypes automatically?", answer: "Yes, if you have React `PropTypes` defined, it will map those definitions directly to TypeScript interfaces." },
                { question: "Is the output strict TypeScript?", answer: "It generates idiomatic TypeScript definitions which you can then customize or make stricter in your project." }
            ]
        }
    },
};