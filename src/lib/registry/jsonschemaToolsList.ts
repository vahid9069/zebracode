import { FileJson, FileCode2, CheckCircle, FileCode } from "lucide-react";
import { ToolMeta } from "@/types/types";

// نکته معماری: برای جلوگیری از مسدود شدن Thread و بزرگ شدن باندل اولیه، 
// توابع تبدیل باید به صورت Lazy (Dynamic Import) یا از طریق Web Worker فراخوانی شوند.
// در اینجا فرض می‌کنیم این کامپوننت‌ها در زمان اجرا بارگذاری می‌شوند.

export const JsonschemaToolsList: Record<string, ToolMeta> = {
    jsonSchemaToOpenApiSchema: {
        type: 'jsonSchemaToOpenApiSchema',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to OpenAPI',
        shortDescription: 'Convert JSON Schema definitions to OpenAPI specifications',
        description: 'Effortlessly convert your JSON Schema into OpenAPI 3.0 or 3.1 schemas. This free online converter maps JSON Schema types, validations, and examples directly to OpenAPI components, saving you hours of manual mapping. Perfect for building Swagger/OpenAPI docs from existing JSON Schema. No sign-up, fully client-side.',
        icon: FileJson,
        href: '/json-schema-to-openapi-schema',
        inputLanguage: 'json',
        outputLanguage: 'json',
        // پیشنهاد برای پرفورمنس: 
        // transformFunction: async (input) => { const { jsonSchemaToOpenApi } = await import("@/lib/tools-transformer/jsonSchemaTransformers"); return jsonSchemaToOpenApi(input); },
        transformFunction: async (input) => (await import("@/lib/tools-transformer/jsonSchemaTransformers")).jsonSchemaToOpenApi(input),
        gradientClasses: 'from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Which OpenAPI versions are supported?", answer: "This converter supports mapping JSON Schema to OpenAPI 3.0 and OpenAPI 3.1 specifications. OpenAPI 3.1 has natively adopted JSON Schema, making the conversion highly accurate." },
                { question: "Does this tool support nested JSON Schemas and $ref?", answer: "Yes, our converter intelligently handles nested objects, arrays, and standard $ref references to generate clean, reusable OpenAPI components." },
                { question: "Is my schema data secure?", answer: "Absolutely. The conversion process happens entirely locally within your browser. Your API structures are never sent to any external server." }
            ]
        }
    },
    jsonSchemaToTypeScript: {
        type: 'jsonSchemaToTypeScript',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to TypeScript',
        shortDescription: 'Generate TypeScript types from a JSON Schema',
        description: 'Automatically generate accurate TypeScript interfaces and type aliases from your JSON Schema. Our online converter handles nested objects, enums, unions, and optional properties. Ideal for frontend projects, API type syncing, and keeping your types in sync with backend validation. Free, fast, and works offline in your browser.',
        icon: FileCode2,
        href: '/json-schema-to-typescript',
        inputLanguage: 'json',
        outputLanguage: 'typescript',
        transformFunction: async (input) => (await import("@/lib/tools-transformer/jsonSchemaTransformers")).jsonSchemaToTs(input),
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Can I generate TypeScript interfaces instead of types?", answer: "Yes, by default, object schemas are converted to TypeScript interfaces, while primitive or union schemas generate type aliases." },
                { question: "How are 'additionalProperties' handled?", answer: "If your JSON Schema allows additionalProperties, the tool will generate TypeScript interfaces with an index signature (e.g., [k: string]: unknown) to ensure type safety." },
                { question: "Does it support JSON Schema Draft 7 and newer?", answer: "Yes, the converter supports modern JSON Schema drafts, ensuring compatibility with the latest validation standards." }
            ]
        }
    },
    jsonSchemaToZod: {
        type: 'jsonSchemaToZod',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to Zod',
        shortDescription: 'Turn a JSON Schema into a Zod validation schema',
        description: 'Convert your JSON Schema into a fully typed Zod schema for runtime validation in TypeScript. This online tool preserves refinements, defaults, and nested shapes, bridging the gap between static JSON Schema and Zod’s expressive validators. Perfect for form validation, API gateways, and Next.js server actions. No downloads, entirely browser-based.',
        icon: CheckCircle,
        href: '/json-schema-to-zod',
        inputLanguage: 'json',
        outputLanguage: 'typescript',
        transformFunction: async (input) => (await import("@/lib/tools-transformer/jsonSchemaTransformers")).jsonSchemaToZod(input),
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why should I convert JSON Schema to Zod?", answer: "While JSON Schema is excellent for language-agnostic validation, Zod provides a developer-friendly API for runtime validation in TypeScript, automatically inferring static types." },
                { question: "Are string formats (e.g., email, uuid) converted correctly?", answer: "Yes, standard JSON Schema string formats like 'email', 'uuid', and 'uri' are automatically mapped to their respective Zod validation methods (e.g., z.string().email())." },
                { question: "Does this tool work offline?", answer: "Yes, once the zebraCode page is loaded, the conversion logic runs entirely offline in your browser environment." }
            ]
        }
    },
    'json-schema-to-protobuf': {
        type: 'json-schema-to-protobuf',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to Protobuf',
        shortDescription: 'Generate Protocol Buffers definitions from JSON Schema',
        description: 'Convert your JSON Schema into high-quality Protocol Buffers (proto3) definitions. This free online converter maps JSON types to proto types, handles nested messages, enums, and repeated fields. Perfect for microservices, gRPC APIs, and sharing data schemas across systems. No installation required, works directly in your browser.',
        icon: FileCode,
        href: '/json-schema-to-protobuf',
        inputLanguage: 'json',
        outputLanguage: 'text',
        transformFunction: async (input) => (await import("@/lib/tools-transformer/jsonSchemaTransformers")).jsonSchemaToProtobuf(input),
        gradientClasses: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Which Protocol Buffers version is outputted?", answer: "The tool generates proto3 syntax, which is the latest and most widely used version of Protocol Buffers for gRPC and modern microservices." },
                { question: "How are JSON arrays converted?", answer: "JSON Schema arrays are converted into 'repeated' fields in the resulting Protocol Buffers message definition." },
                { question: "Does it support nested JSON objects?", answer: "Yes, nested JSON objects are extracted and defined as separate protobuf messages to maintain a clean and compiling proto structure." }
            ]
        }
    },
};