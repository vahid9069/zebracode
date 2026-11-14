import { ArrowLeftRight, Image as ImageIcon } from "lucide-react";
import { ToolMeta } from "@/types/types";

export const ImageToolsList: Record<string, ToolMeta> = {
    'image-compressor': {
        type: 'image-compressor',
        category: 'converters',
        subCategory: 'media',
        title: 'Image Compressor & Converter',
        shortDescription: 'Compress and optimize JPG, PNG, WebP, and AVIF images locally in your browser',
        description:
            'A powerful, 100% client-side image compression and conversion tool. Optimize JPG, PNG, WebP, and AVIF files with real-time before/after visual comparison, multi-image batch processing, custom resolution resizing, target file size tuning, and 1-click ZIP export. Zero server uploads, completely private and offline-ready.',
        icon: ImageIcon,
        href: '/image-compressor',
        inputLanguage: 'image',
        outputLanguage: 'image',
        transformFunction: () => '',
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                {
                    question: "Does this image compressor reduce quality visibly?",
                    answer: "No. The balanced preset uses perceptual optimization to remove redundant data while keeping details sharp, slashing file sizes by up to 80% without noticeable degradation."
                },
                {
                    question: "Are my images uploaded to any server?",
                    answer: "Never. All compression runs 100% locally in your browser using HTML5 Canvas and Web APIs. Your images never leave your machine."
                },
                {
                    question: "Can I compress multiple images and download them as a ZIP?",
                    answer: "Yes, you can upload dozens of images simultaneously, fine-tune batch settings, and download all compressed files in a single ZIP bundle."
                },
                {
                    question: "Which formats are supported?",
                    answer: "Input supports JPG, PNG, WebP, AVIF, SVG, GIF, and BMP. Output can be kept in original format or converted to WebP, JPEG, PNG, or AVIF."
                }
            ]
        }
    },
    'image-converter': {
        type: 'image-converter',
        category: 'converters',
        subCategory: 'media',
        title: 'Image Format Converter',
        shortDescription: 'Convert PNG, JPG, WebP, AVIF, SVG, ICO, and BMP images online for free',
        description:
            'A versatile, 100% browser-based image converter and transformer. Convert between PNG, JPG, WebP, AVIF, SVG, Favicon ICO, and BMP with zero quality loss. Features SVG vector rasterization (1x, 2x Retina, 4x), multi-size Favicon package generation, rotation, flip, grayscale filter, and batch ZIP export.',
        icon: ArrowLeftRight,
        href: '/image-converter',
        inputLanguage: 'image',
        outputLanguage: 'image',
        transformFunction: () => '',
        gradientClasses: 'from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                {
                    question: "Can this tool convert SVG to PNG or WebP without quality loss?",
                    answer: "Yes! You can choose 1x, 2x (Retina), or 4x (Ultra HD) scale multipliers to render vector SVGs into super-sharp, high-DPI raster images."
                },
                {
                    question: "Does it support creating real Favicon .ICO files?",
                    answer: "Yes! Our built-in encoder creates valid Windows and Web multi-resolution .ico files bundled with 16x16, 32x32, 48x48, and 64x64 icon frames."
                },
                {
                    question: "Are my images private and secure?",
                    answer: "Completely private. All conversion runs client-side inside your web browser. No files are uploaded to any remote server."
                },
                {
                    question: "Can I convert multiple images to different formats simultaneously?",
                    answer: "Yes! You can drop multiple images and select global format conversion, or customize target formats per image and download everything in one organized ZIP."
                }
            ]
        }
    }
};
