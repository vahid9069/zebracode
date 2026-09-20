import {ArrowRightLeft, KeyRound, Languages} from "lucide-react";
import {ToolMeta} from "@/types/types";

export const GeneratorToolsList: Record<string, ToolMeta> = {
    'password-generator': {
        type: 'password-generator',
        category: 'generators',
        subCategory: 'password',
        title: 'Password Generator',
        shortDescription: 'Generate strong, cryptographically secure passwords online',
        description:
            'A free online Password Generator that creates strong, random, and highly secure passwords with a single click. Customize your password length (up to 64 characters) and choose from lowercase, uppercase, numbers, and symbols. All passwords are generated locally in your browser for maximum privacy—never stored or transmitted.',
        icon: KeyRound,
        href: '/password-generator',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: () => '',
        gradientClasses: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Are the generated passwords truly random?", answer: "Yes, passwords are generated using the Web Crypto API (Crypto.getRandomValues), which provides cryptographically strong random values suitable for security purposes." },
                { question: "Can I customize the password requirements?", answer: "Yes, you can set the length from 8 to 64 characters and choose which character types to include: lowercase, uppercase, numbers, and symbols." },
                { question: "Are generated passwords stored anywhere?", answer: "No. Passwords are generated entirely in your browser and are never transmitted, stored, or logged anywhere." }
            ]
        }
    },
    'lorem-generator': {
        type: 'lorem-generator',
        category: 'generators',
        subCategory: 'text',
        title: 'Lorem Ipsum Generator',
        shortDescription: 'Generate Lorem Ipsum placeholder text for your designs in multiple languages',
        description:
            'A free, multilingual Lorem Ipsum Generator for designers and developers. Create dummy text instantly in English, Persian, Arabic, Spanish, French, and German. Customize the output as paragraphs, sentences, or words, and copy your placeholder text with a single click. Works completely offline in your browser.',
        icon: Languages,
        href: '/lorem-generator',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: () => '',
        gradientClasses: 'from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is Lorem Ipsum used for?", answer: "Lorem Ipsum is placeholder text used by designers and developers to fill content areas during layout prototyping, before real copy is available." },
                { question: "Does it support languages other than Latin?", answer: "Yes, this generator supports multiple languages including English, Persian, Arabic, Spanish, French, and German for realistic multilingual prototyping." },
                { question: "Can I customize the output format?", answer: "Yes, you can generate placeholder text as paragraphs, sentences, or individual words, and specify the exact amount needed." }
            ]
        }
    },
    'text-diff': {
        type: 'text-diff',
        category: 'generators',
        subCategory: 'text',
        title: 'Text Diff Checker',
        shortDescription: 'Compare two texts line by line and see the differences instantly',
        description:
            'A free online tool to compare two texts and see the differences line by line. Perfect for code review, document versioning, and text analysis. All processing is done in your browser.',
        icon: ArrowRightLeft,
        href: '/text-diff',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: () => '',
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How does the text comparison work?", answer: "The tool uses a line-by-line diff algorithm to compare two texts side by side, highlighting additions, deletions, and unchanged lines for easy review." },
                { question: "Can I compare code with this tool?", answer: "Yes, it's perfect for code review, comparing configuration files, or checking document versions. It works with any plain text format." },
                { question: "Is my text data secure?", answer: "Yes, all comparison happens locally in your browser. Your text is never uploaded to any server, ensuring complete privacy." }
            ]
        }
    },
};