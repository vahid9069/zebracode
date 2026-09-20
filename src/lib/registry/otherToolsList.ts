import { Code, FileText, Settings, Braces } from "lucide-react";
import { ToolMeta } from "@/types/types";

// نکته معماری: هیچ ایمپورت استاتیکی از 'miscTransformers' اینجا قرار نمی‌دهیم.
// تمامی ترانسفورمرها در زمان اجرا (Runtime) و فقط با کلیک کاربر دانلود می‌شوند.

export const OtherToolsList: Record<string, ToolMeta> = {
    'cadence-to-go': {
        type: 'cadence-to-go',
        category: 'converters',
        subCategory: 'workflows', // دسته‌بندی تجاری‌تر به جای others
        title: 'Cadence to Go',
        shortDescription: 'Convert Cadence workflow definitions to Go code',
        description: 'Generate Go worker boilerplate from your Cadence workflow definitions. This free online converter translates your Cadence DSL into ready-to-compile Go structs, activities, and workflow interfaces—perfect for bootstrapping Temporal or Cadence projects. All processing happens in your browser, no sign-up required.',
        icon: Code,
        href: '/cadence-to-go',
        inputLanguage: 'go', 
        outputLanguage: 'go',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).cadenceToGo(input),
        gradientClasses: 'from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is Cadence?", answer: "Cadence is a distributed, scalable, highly available, and fault-tolerant workflow orchestration engine developed by Uber. This tool helps you generate the Go boilerplate for it." },
                { question: "Is this compatible with Temporal?", answer: "Yes, since Temporal is a fork of Cadence, the generated Go activity and workflow interfaces are highly compatible with Temporal's Go SDK." }
            ]
        }
    },
    'markdown-to-html': {
        type: 'markdown-to-html',
        category: 'converters',
        subCategory: 'markup',
        title: 'Markdown to HTML',
        shortDescription: 'Convert Markdown to clean, semantic HTML',
        description: 'Transform your Markdown into clean, responsive HTML with our free online converter. Supports tables, code blocks (with syntax highlighting), GitHub-flavored Markdown, and custom CSS. Ideal for developers, content creators, and anyone building static sites. Works instantly in your browser, no account needed.',
        icon: FileText,
        href: '/markdown-to-html',
        inputLanguage: 'markdown',
        outputLanguage: 'html',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).markdownToHtml(input),
        gradientClasses: 'from-gray-50 to-stone-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this support GitHub Flavored Markdown (GFM)?", answer: "Yes, our converter fully supports GFM, including tables, strikethrough, task lists, and autolinks." },
                { question: "Are my documents saved anywhere?", answer: "No, all Markdown parsing is done locally in your browser. Your text never leaves your device." }
            ]
        }
    },
    'toml-to-json': {
        type: 'toml-to-json',
        category: 'converters',
        subCategory: 'config-data',
        title: 'TOML to JSON',
        shortDescription: 'Convert TOML configuration files to JSON online',
        description: 'Easily convert your TOML configuration files into structured JSON. This free online tool preserves arrays, nested tables, and inline objects, making it perfect for migrating configs between Rust, Python, and JavaScript ecosystems. Fast, client-side, and requires no installation or sign-up.',
        icon: Settings,
        href: '/toml-to-json',
        inputLanguage: 'toml', 
        outputLanguage: 'json',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).tomlToJson(input),
        gradientClasses: 'from-lime-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How does this tool handle TOML dates?", answer: "TOML native dates and datetimes are accurately parsed and converted into standard ISO 8601 string formats in the resulting JSON." },
                { question: "Is this tool suitable for large config files?", answer: "Yes, it runs highly optimized WASM/JS parsers directly in your browser, making it capable of handling large TOML files instantly." }
            ]
        }
    },
    'xml-to-json': {
        type: 'xml-to-json',
        category: 'converters',
        subCategory: 'data-formats',
        title: 'XML to JSON',
        shortDescription: 'Parse and convert XML data to JSON format',
        description: 'Transform XML documents into JSON with a single click. Our converter handles attributes, nested elements, and arrays intelligently, producing clean JSON perfect for APIs, web services, or data interchange. Free, secure, and works entirely in your browser—no XML file touches a server.',
        icon: Braces,
        href: '/xml-to-json',
        inputLanguage: 'xml', 
        outputLanguage: 'json',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).xmlToJsonConvert(input),
        gradientClasses: 'from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How are XML attributes converted to JSON?", answer: "By default, XML attributes are prefixed with an '@' symbol or grouped under a specific key to differentiate them from standard text nodes in the resulting JSON object." },
                { question: "Does it support SOAP XML responses?", answer: "Yes, you can paste any valid XML, including SOAP envelopes, and it will be accurately mapped to a JSON structure for easy reading." }
            ]
        }
    },
    'yaml-to-json': {
        type: 'yaml-to-json',
        category: 'converters',
        subCategory: 'config-data',
        title: 'YAML to JSON',
        shortDescription: 'Convert YAML configs to JSON instantly',
        description: 'Quickly translate your YAML configuration or data files into valid JSON. This free online converter supports all YAML types, anchors, and multiline strings. Ideal for migrating from Docker Compose, Kubernetes manifests, or CI/CD pipelines to JSON-based tools. No registration required, completely client-side.',
        icon: Settings,
        href: '/yaml-to-json',
        inputLanguage: 'yaml',
        outputLanguage: 'json',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).yamlToJson(input),
        gradientClasses: 'from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this support YAML anchors and aliases?", answer: "Yes, our parser resolves YAML anchors (&) and aliases (*) seamlessly, expanding them correctly in the JSON output." },
                { question: "Can I use this for Kubernetes manifests?", answer: "Absolutely. Developers frequently use this tool to convert multi-document Kubernetes YAML files into JSON for programmatic processing." }
            ]
        }
    },
    'yaml-to-toml': {
        type: 'yaml-to-toml',
        category: 'converters',
        subCategory: 'config-data',
        title: 'YAML to TOML',
        shortDescription: 'Convert YAML files to TOML format',
        description: 'Effortlessly convert your YAML files into clean, readable TOML. This free converter handles nested tables, arrays of tables, and preserves comments where possible. Perfect for teams moving configuration from YAML to TOML for better readability in Python or Rust projects. Works online, no download needed.',
        icon: Settings,
        href: '/yaml-to-toml',
        inputLanguage: 'yaml',
        outputLanguage: 'toml', 
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).yamlToToml(input),
        gradientClasses: 'from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why convert YAML to TOML?", answer: "TOML is often preferred in ecosystems like Rust (Cargo) and Python (Poetry) because its explicit table structure can be easier to read and less prone to indentation errors than YAML." },
                { question: "Are YAML lists supported?", answer: "Yes, standard YAML lists are correctly mapped to TOML arrays, and lists of objects become TOML arrays of tables." }
            ]
        }
    },
    'toml-to-yaml': {
        type: 'toml-to-yaml',
        category: 'converters',
        subCategory: 'config-data',
        title: 'TOML to YAML',
        shortDescription: 'Convert TOML files to YAML format',
        description: 'Transform your TOML configuration files into clean, indented YAML. This free online converter preserves tables, arrays, and nested structures, making it ideal for migrating configs between Rust, Python, and Kubernetes ecosystems. No registration needed, all processing is done in your browser.',
        icon: Settings,
        href: '/toml-to-yaml',
        inputLanguage: 'toml',
        outputLanguage: 'yaml',
        transformFunction: async (input) => (await import('@/lib/tools-transformer/miscTransformers')).tomlToYaml(input),
        gradientClasses: 'from-green-50 to-lime-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Is the generated YAML formatting customizable?", answer: "The converter outputs standard, 2-space indented YAML which is the universally accepted standard for CI/CD and DevOps tools." },
                { question: "How are inline TOML tables handled?", answer: "Inline TOML tables are expanded into standard YAML nested objects to ensure maximum readability in the output." }
            ]
        }
    },
};