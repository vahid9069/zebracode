// بخش Encoders در toolRegistry.ts

import { base64Decode, base64Encode , jwtDecode , urlDecode , urlEncode } from '@/lib/tools-transformer/encoderTransformers';

import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

// ... داخل toolRegistry
export const EncodersToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- Encoders / Decoders ---------------------
    base64Decode: {
        type: 'base64Decode',
        category: 'converters',
        subCategory: 'encoders',
        title: 'Base64 Decode',
        shortDescription: 'Decode Base64 encoded strings to plain text',
        description:
            'Instantly decode Base64 encoded data back to readable text, JSON, or binary. This free online Base64 decoder handles UTF-8, ASCII, and binary input with no registration needed. Perfect for debugging encoded tokens, API responses, or email attachments. All decoding happens directly in your browser for maximum privacy and speed.',
        icon: Code,
        href: '/base64-decode',
        inputLanguage: 'text',         // رشتهٔ بیس۶۴ متنی است
        outputLanguage: 'text',       // خروجی می‌تواند متن، JSON یا هر چیز دیگری باشد
        transformFunction: base64Decode,
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Is Base64 decoding secure?", answer: "Yes, all decoding happens directly in your browser. Your encoded data is never uploaded to any server, ensuring complete privacy." },
                { question: "Does it support UTF-8 and special characters?", answer: "Yes, the decoder handles UTF-8 encoded text, emojis, and special characters, converting them correctly back to their original form." },
                { question: "Is there a file size limit?", answer: "The tool is optimized for performance and can handle encoded strings up to several megabytes, depending on your browser's capabilities." }
            ]
        }
    },
    'base64-encode': {
        type: 'base64-encode',
        category: 'converters',
        subCategory: 'encoders',
        title: 'Base64 Encode',
        shortDescription: 'Encode text or files to Base64 format',
        description:
            'Quickly encode any text string, JSON object, or binary content into Base64 format online. This free Base64 encoder is secure—your data never leaves your browser. Ideal for creating data URIs, embedding images in CSS/HTML, or safely transmitting binary in text-based protocols. Fast, simple, and requires no sign-up.',
        icon: Code,
        href: '/base64-encode',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: base64Encode,
        gradientClasses: 'from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What can I use Base64 encoding for?", answer: "Base64 encoding is commonly used for embedding images as Data URIs in HTML/CSS, transmitting binary data in JSON APIs, and encoding credentials for Basic Authentication." },
                { question: "Is my data secure during encoding?", answer: "Yes, all encoding happens locally in your browser. Your data is never transmitted to any server, ensuring complete confidentiality." },
                { question: "Can I encode files as well as text?", answer: "Yes, you can encode any text string. For binary files, paste the content or use the browser's built-in FileReader API alongside this tool." }
            ]
        }
    },
    'jwt-decoder': {
        type: 'jwt-decoder',
        category: 'converters',
        subCategory: 'encoders',
        title: 'Jwt Decoder',
        shortDescription: 'Decode and inspect JWT tokens',
        description:
            'Decode and explore the header and payload of any JWT (JSON Web Token) without verifying its signature. Our online JWT decoder displays claims like issuer, expiration, and subject in a clear, human-readable format. An essential developer tool for debugging authentication, inspecting API tokens, and understanding JWT structure. Client-side only—your tokens stay private.',
        icon: Code,
        href: '/jwt-decoder',
        inputLanguage: 'text',         // JWT یک رشتهٔ متنی است
        outputLanguage: 'json',       // محتوای header و payload به‌صورت JSON نمایش داده می‌شود
        transformFunction: jwtDecode,
        gradientClasses: 'from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Is the JWT signature verified?", answer: "This decoder extracts and displays the header and payload without cryptographic verification. For signature verification, use a server-side library with your secret key." },
                { question: "Is my JWT token safe to paste here?", answer: "Yes, all decoding happens locally in your browser. Your token is never sent to any server. However, never share tokens containing sensitive data on public screens." },
                { question: "What information can I see in a decoded JWT?", answer: "You can view the algorithm, token type, expiration time (exp), issued-at time (iat), issuer (iss), subject (sub), and any custom claims in the payload." }
            ]
        }
    },
};