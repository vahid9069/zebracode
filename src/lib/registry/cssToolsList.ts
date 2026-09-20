import {ToolMeta} from "@/types/types";
import {Code} from 'lucide-react';
import {cssToJs,cssToScss,cssToTailwind,convertScssToCss} from "@/lib/tools-transformer/cssTransformers";

export const CssToolsList: Record<string, ToolMeta> = {
    cssToJs: {
        type: 'cssToJs',
        category: 'converters',
        subCategory: 'css',
        title: 'CSS to JS',
        shortDescription: 'Convert CSS to a JavaScript object',
        description:
            'Easily convert your CSS styles into a clean JavaScript object. This free online CSS to JS converter parses your CSS rules and outputs a JavaScript object literal—perfect for CSS-in-JS solutions, inline styles in React, or dynamic styling in any frontend project. Fast, accurate, and requires no sign-up.',
        icon: Code,
        href: '/css-to-js',
        inputLanguage: 'css',
        outputLanguage: 'javascript',
        transformFunction: cssToJs,
        gradientClasses: 'from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How does CSS to JS conversion work?", answer: "This tool parses your standard CSS rules and maps them into a JavaScript object structure compatible with CSS-in-JS libraries or inline styles." },
                { question: "Can I use this for React inline styles?", answer: "Yes, the output is formatted as a JavaScript object, which is exactly what React expects for the 'style' attribute." },
                { question: "Are vendor prefixes preserved?", answer: "Yes, all standard properties and vendor-prefixed properties in your CSS are preserved in the generated JS object." }
            ]
        }
    },
    cssToScss: {
        type: 'cssToScss',
        category: 'converters',
        subCategory: 'css',
        title: 'CSS to SCSS',
        shortDescription: 'Convert CSS to SCSS (Sassy CSS)',
        description:
            'Transform standard CSS into SCSS syntax with our online converter. It intelligently adds nesting, variables, and mixin-friendly structure to your existing styles, making them more maintainable and ready for modern Sass workflows. Ideal for migrating legacy CSS to a more powerful preprocessor. Free, fast, and works directly in your browser.',
        icon: Code,
        href: '/css-to-scss',
        inputLanguage: 'css',
        outputLanguage: 'scss',
        transformFunction: cssToScss,
        gradientClasses: 'from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this tool support CSS nesting?", answer: "Yes, it can infer nesting structures from your flat CSS based on class hierarchy and grouping." },
                { question: "Why convert CSS to SCSS?", answer: "SCSS offers powerful features like nesting, variables, and mixins that make large stylesheets much easier to manage." },
                { question: "Is the output valid Sass?", answer: "Yes, the output is fully compatible with any standard Sass compiler." }
            ]
        }
    },
    cssToTailwind: {
        type: 'cssToTailwind',
        category: 'converters',
        subCategory: 'css',
        title: 'CSS to Tailwind',
        shortDescription: 'Convert CSS classes to Tailwind CSS utilities',
        description:
            'Quickly refactor your CSS classes into Tailwind CSS utility classes. This online converter maps common CSS properties to their Tailwind equivalents, helping you migrate to a utility-first workflow. Suitable for developers adapting existing stylesheets to Tailwind—no manual translation needed. Free, online, and designed for frontend productivity.',
        icon: Code,
        href: '/css-to-tailwind',
        inputLanguage: 'css',
        outputLanguage: 'html',   // خروجی کلاس‌های Tailwind معمولاً در قالب HTML/JSX است
        transformFunction: cssToTailwind,
        gradientClasses: 'from-sky-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Can I convert entire CSS files?", answer: "Yes, you can paste your entire CSS file, and the tool will attempt to map the classes to Tailwind utility classes." },
                { question: "What if a property doesn't have a Tailwind equivalent?", answer: "Properties without a direct Tailwind match are often left as custom CSS classes or require manual adjustment in your tailwind.config.js." },
                { question: "Is this tool suitable for large projects?", answer: "It's a great starting point for migration, but large-scale migrations may require some manual review of the utility classes." }
            ]
        }
    },
    scssToCss: {
        type: 'scssToCss',
        category: 'converters',
        subCategory: 'css',
        title: 'SCSS to CSS',
        shortDescription: 'Compile SCSS to standard CSS',
        description:
            'Compile SCSS (Sassy CSS) to browser-ready CSS instantly. Our online SCSS to CSS converter supports variables, nesting, mixins, and partials. Simply paste your SCSS code and get clean, standard CSS output. Perfect for quick compilation without installing Sass or setting up a build process. Free and no registration needed.',
        icon: Code,
        href: '/scss-to-css',
        inputLanguage: 'scss',   // ورودی SCSS است نه CSS ساده
        outputLanguage: 'css',
        transformFunction: convertScssToCss,
        gradientClasses: 'from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Do I need to install Node.js to use this?", answer: "No, this compiler runs entirely in your browser without any server-side dependencies." },
                { question: "Does it support Sass mixins?", answer: "Yes, it supports standard Sass features including variables, nesting, and mixins." },
                { question: "Can I import other partials?", answer: "This online tool works with single blocks of code, so it doesn't support @import statements that reference local files." }
            ]
        }
    },
};