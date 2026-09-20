// lib/toolRegistry.ts
import {Code,Ban} from 'lucide-react';
import {
    formatJSON,
    jsonToBigQuery,
    jsonToFlow,
    jsonToGo,
    jsonToGoBSON,
    jsonToGraphQL,
    jsonToIoTS,
    jsonToJava,
    jsonToJSDoc,
    jsonToJsonSchema,
    jsonToKotlin,
    jsonToMobXStateTree,
    jsonToMongoose,
    jsonToMySQL,
    jsonToPropTypes,
    jsonToRustSerde,
    jsonToSarcastic,
    jsonToScalaCaseClass,
    jsonToToml,
    jsonToTypeScript,
    jsonToYaml,
    jsonToZod
} from "@/lib/tools-transformer/jsonTransformers";
import {ToolMeta} from "@/types/types";

export const JsonToolsList: Record<string, ToolMeta> = {
    // --------------------- JSON tools ---------------------
    formatJSON: {
        type: 'json-format',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON Format',
        shortDescription: 'Prettify and format your JSON data',
        description:
            'Format, beautify, and indent your minified or messy JSON with a single click. This free online JSON formatter makes your data readable, validates syntax, and highlights errors. Perfect for debugging APIs, configuration files, and log entries. Works entirely in your browser—no registration required.',
        icon: Ban,
        href: '/json-format',
        inputLanguage: 'json',
        outputLanguage: 'json',          // خروجی JSON مرتب‌شده
        transformFunction: formatJSON,
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            description: `
        <p><strong>JSON Formatter</strong> is a free online tool that helps you beautify and indent your JSON data instantly. It supports large JSON files, validates syntax, and highlights errors.</p>
        <p>Whether you're debugging an API response or working with configuration files, this tool makes your data readable.</p>
    `,
            faq: [
                {
                    question: "Is my JSON data secure?",
                    answer: "Absolutely. All processing happens directly in your browser. Your data is never uploaded to any server."
                },
                {
                    question: "Can I format large JSON files?",
                    answer: "Yes, the tool is optimized for performance and can handle files up to several megabytes."
                },
                {
                    question: "Does it validate my JSON?",
                    answer: "Yes, if your JSON is invalid, the tool will show an error message instead of formatting it."
                }
            ],
        }
    },
    jsonToBigQuery: {
        type: 'jsonToBigQuery',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to BigQuery',
        shortDescription: 'Convert JSON to BigQuery table schema',
        description:
            'Transform your JSON data structure into a BigQuery-compatible schema definition. This online converter infers field names, types, and nested records, making it easy to load JSON into Google BigQuery. A time-saver for data engineers and analysts. Free and client-side, no sign-up needed.',
        icon: Code,
        href: '/json-to-big-query',
        inputLanguage: 'json',
        outputLanguage: 'sql',           // خروجی شبیه SQL DDL
        transformFunction: jsonToBigQuery,
        gradientClasses: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is the benefit of BigQuery schema from JSON?", answer: "It automates the tedious task of defining schema fields, saving hours of manual labor when loading JSON data into Google BigQuery." },
                { question: "How does it handle nested objects?", answer: "The converter flattens the structure or creates RECORD types in the BigQuery schema definition, ensuring nested data is correctly represented." },
                { question: "Is the output standard SQL?", answer: "Yes, it produces standard SQL DDL (Data Definition Language) that you can run directly in the BigQuery console." }
            ]
        }
    },
    jsonToFlow: {
        type: 'jsonToFlow',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Flow',
        shortDescription: 'Generate Flow type definitions from JSON',
        description:
            'Instantly create Flow type annotations from your sample JSON data. This converter analyses your JSON structure and outputs precise Flow types, helping you add static typing to JavaScript projects. Perfect for bootstrapping type coverage in existing codebases. Free, online, and requires no installation.',
        icon: Code,
        href: '/json-to-flow',
        inputLanguage: 'json',
        outputLanguage: 'flow',          // خروجی Flow types
        transformFunction: jsonToFlow,
        gradientClasses: 'from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How accurate are the generated Flow types?", answer: "The tool creates highly accurate types by inspecting your provided JSON object and inferring the corresponding Flow types." },
                { question: "Can I use these types in existing projects?", answer: "Yes, they are standard Flow type declarations ready for use in any React or JavaScript project using Flow." },
                { question: "Does it handle arrays?", answer: "Absolutely, it detects array structures and generates corresponding Array<T> type definitions." }
            ]
        }
    },
    jsonToGo: {
        type: 'jsonToGo',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Go',
        shortDescription: 'Convert JSON to Go struct definitions',
        description:
            'Generate idiomatic Go structs from your JSON example. This converter automatically maps JSON fields to Go types, handles nested objects, and adds `json` tags. Ideal for building Go clients, unmarshalling API responses, and rapidly prototyping data models. Free and browser-based.',
        icon: Code,
        href: '/json-to-go',
        inputLanguage: 'json',
        outputLanguage: 'go',            // یا 'text' چون CodeMirror گو را مستقیماً پشتیبانی نمی‌کند؛ بگذاریم 'text'
        transformFunction: jsonToGo,
        gradientClasses: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "How to convert JSON to Go structs?", answer: "Simply paste your JSON into the input field, and the tool will automatically generate Go struct definitions, including necessary `json` tags for unmarshalling." },
                { question: "Does it handle nested JSON objects?", answer: "Yes, it recursively maps nested JSON objects to corresponding nested Go structs." },
                { question: "Is this suitable for production Go projects?", answer: "Yes, the generated structs follow standard Go conventions and are ready for use in your production API clients." }
            ]
        }
    },
    jsonToGoBson: {
        type: 'jsonToGoBson',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Go BSON',
        shortDescription: 'Create Go structs with BSON tags from JSON',
        description:
            'Convert JSON data into Go structs with BSON tags for MongoDB integration. This online tool outputs structs with both `json` and `bson` tags, perfect for Go applications using the official MongoDB driver. Fast, free, and no registration required.',
        icon: Code,
        href: '/json-to-go-bson',
        inputLanguage: 'json',
        outputLanguage: 'text',          // گو با تگ BSON
        transformFunction: jsonToGoBSON,
        gradientClasses: 'from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToGraphQl: {
        type: 'jsonToGraphQl',          // دقت: در لیست شما 'jsonToGraphQl' با حروف بزرگ Q
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to GraphQL',
        shortDescription: 'Turn a JSON object into a GraphQL schema',
        description:
            'Quickly derive a GraphQL schema from your existing JSON data. This free converter infers types, fields, and relationships, generating SDL you can drop into any GraphQL server. Great for prototyping APIs or bootstrapping a schema from sample responses. No sign-up, fully client-side.',
        icon: Code,
        href: '/json-to-graphql',
        inputLanguage: 'json',
        outputLanguage: 'graphql',       // خروجی SDL
        transformFunction: jsonToGraphQL,
        gradientClasses: 'from-pink-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Can I generate a full GraphQL schema from JSON?", answer: "Yes, this tool infers types and relationships from your JSON object to generate a valid GraphQL SDL (Schema Definition Language)." },
                { question: "Is the output compatible with all GraphQL servers?", answer: "Yes, the generated schema uses standard GraphQL syntax that is compatible with any server-side GraphQL implementation." },
                { question: "Does it support GraphQL list types?", answer: "Yes, it automatically identifies array fields in your JSON and converts them into GraphQL list types." }
            ]
        }
    },
    jsonToIoTs: {
        type: 'jsonToIoTs',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to io-ts',
        shortDescription: 'Generate io-ts codec definitions from JSON',
        description:
            'Build runtime type-checking with io-ts by converting your sample JSON into io-ts codec definitions. This online tool handles unions, partial objects, and arrays, enabling robust validation in TypeScript projects. Free, quick, and works right in your browser.',
        icon: Code,
        href: '/json-to-io-ts',
        inputLanguage: 'json',
        outputLanguage: 'typescript',    // io-ts در TypeScript استفاده می‌شود
        transformFunction: jsonToIoTS,
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is io-ts useful for?", answer: "io-ts is excellent for runtime type validation in TypeScript, ensuring your API responses match your expected data shapes." },
                { question: "Does this tool handle optional fields?", answer: "Yes, it detects potentially missing or nullable fields and uses io-ts partials and optionals for robust validation." },
                { question: "Can I use the output directly in my TS project?", answer: "Absolutely, the generated codecs are standard io-ts definitions that you can import and use for your API validation layers." }
            ]
        }
    },
    jsonToJava: {
        type: 'jsonToJava',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Java',
        shortDescription: 'Create Java POJOs from JSON data',
        description:
            'Convert your JSON into clean Java classes with Jackson annotations. This free online converter generates POJOs with fields, getters, and setters, tailored for deserialising JSON in Spring Boot or Android apps. Save hours of manual mapping. No download needed, entirely browser-based.',
        icon: Code,
        href: '/json-to-java',
        inputLanguage: 'json',
        outputLanguage: 'java',
        transformFunction: jsonToJava,
        gradientClasses: 'from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Does this support Jackson annotations?", answer: "Yes, the generated POJOs include Jackson annotations like @JsonProperty for easy JSON deserialization in Java." },
                { question: "Can it handle complex nested JSON?", answer: "Yes, it creates separate Java classes for nested objects to maintain clean and modular code structure." },
                { question: "Is it suitable for Android development?", answer: "Definitely, the POJO output is fully compatible with common Android JSON parsing libraries." }
            ]
        }
    },
    jsonToJsdoc: {
        type: 'jsonToJsdoc',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to JSDoc',
        shortDescription: 'Generate JSDoc type annotations from JSON',
        description:
            'Document your JavaScript objects by converting JSON data into JSDoc type definitions. This free tool adds @typedef and @property annotations, providing IntelliSense support in VS Code and other editors. Ideal for adding types without TypeScript. No registration, fully client-side.',
        icon: Code,
        href: '/json-to-jsdoc',
        inputLanguage: 'json',
        outputLanguage: 'javascript',
        transformFunction: jsonToJSDoc,
        gradientClasses: 'from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Why use JSDoc over TypeScript?", answer: "JSDoc is a lightweight way to get IDE type checking and autocompletion in standard JavaScript files without the complexity of a build step." },
                { question: "Will IDEs recognize the output?", answer: "Yes, VS Code and many other editors natively support JSDoc for enhanced IntelliSense and code navigation." },
                { question: "Does it support nested structures?", answer: "Yes, it maps nested JSON to complex JSDoc @typedef definitions." }
            ]
        }
    },
    jsonToJsonSchema: {
        type: 'jsonToJsonSchema',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to JSON Schema',
        shortDescription: 'Infer a JSON Schema from a JSON sample',
        description:
            'Automatically generate a JSON Schema that describes your JSON data. This converter analyses your input and creates a schema with accurate types, required fields, and nested definitions. Perfect for validation, documentation, and API contracts. Free online tool, no sign-up required.',
        icon: Code,
        href: '/json-to-json-schema',
        inputLanguage: 'json',
        outputLanguage: 'json',          // JSON Schema خودش JSON معتبر است
        transformFunction: jsonToJsonSchema,
        gradientClasses: 'from-purple-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToKotlin: {
        type: 'jsonToKotlin',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Kotlin',
        shortDescription: 'Create Kotlin data classes from JSON',
        description:
            'Convert your JSON into Kotlin data classes with ease. This online generator produces model classes with `@SerializedName` annotations, ready for use with Gson or Moshi in Android development. Free, fast, and works directly in your browser without installations.',
        icon: Code,
        href: '/json-to-kotlin',
        inputLanguage: 'json',
        outputLanguage: 'text',           // Kotlin
        transformFunction: jsonToKotlin,
        gradientClasses: 'from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToMobxStateTree: {
        type: 'jsonToMobxStateTree',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to MobX State Tree',
        shortDescription: 'Generate MobX State Tree models from JSON',
        description:
            'Transform your JSON into strongly-typed MobX State Tree (MST) model definitions. This free converter creates types, actions, and views scaffolding from sample data, helping you build observable state trees faster. No sign-up, entirely client-side.',
        icon: Code,
        href: '/json-to-mobx-state-tree',
        inputLanguage: 'json',
        outputLanguage: 'javascript',     // یا 'typescript'
        transformFunction: jsonToMobXStateTree,
        gradientClasses: 'from-teal-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToMongoose: {
        type: 'jsonToMongoose',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Mongoose',
        shortDescription: 'Convert JSON to Mongoose schemas',
        description:
            'Generate Mongoose schema definitions from your JSON data for MongoDB and Node.js. This online tool infers data types, nested schemas, and defaults, helping you bootstrap your ODM models. Perfect for quick prototyping and API development. Free, no registration needed.',
        icon: Code,
        href: '/json-to-mongoose',
        inputLanguage: 'json',
        outputLanguage: 'javascript',     // Mongoose schema در JS/TS
        transformFunction: jsonToMongoose,
        gradientClasses: 'from-lime-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToMysql: {
        type: 'jsonToMysql',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to MySQL',
        shortDescription: 'Turn JSON into MySQL CREATE TABLE scripts',
        description:
            'Convert your nested JSON objects into normalised MySQL table definitions with relationships. This online tool analyses your data and outputs SQL statements ready for database creation. Ideal for data migration and ETL tasks. Free and works entirely in your browser.',
        icon: Code,
        href: '/json-to-mysql',
        inputLanguage: 'json',
        outputLanguage: 'sql',            // MySQL SQL
        transformFunction: jsonToMySQL,
        gradientClasses: 'from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToPropTypes: {
        type: 'jsonToPropTypes',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to PropTypes',
        shortDescription: 'Generate React PropTypes from JSON data',
        description:
            'Create React PropTypes definitions automatically from a JSON object. This free converter outputs exact shape, arrayOf, and oneOfType validators, ensuring runtime prop validation in your React components. No more manual PropTypes typing. Fast, online, and requires no sign-up.',
        icon: Code,
        href: '/json-to-proptypes',
        inputLanguage: 'json',
        outputLanguage: 'javascript',     // PropTypes در JS/JSX
        transformFunction: jsonToPropTypes,
        gradientClasses: 'from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToRustSerde: {
        type: 'jsonToRustSerde',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Rust Serde',
        shortDescription: 'Create Rust structs with Serde attributes from JSON',
        description:
            'Convert your JSON into Rust structs with Serde `Deserialize` and `Serialize` derives. This online generator handles JSON types, nested structures, and optional fields, giving you ready-to-compile code for your Rust projects. Free, fast, and browser-based.',
        icon: Code,
        href: '/json-to-rust-serde',
        inputLanguage: 'json',
        outputLanguage: 'rust',           // یا 'text' چون پشتیبانی مستقیم از Rust در CodeMirror نیست
        transformFunction: jsonToRustSerde,
        gradientClasses: 'from-stone-50 to-zinc-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToSarcastic: {
        type: 'jsonToSarcastic',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Sarcastic',
        shortDescription: 'Generate Sarcastic type definitions from JSON (humorous tool)',
        description:
            'Convert your JSON into Sarcastic type definitions—a playful, opinionated language for describing data with sarcasm. This light-hearted online tool wraps your data structure in humorous names while preserving structure. For fun, not production. Free and client-side.',
        icon: Code,
        href: '/json-to-sarcastic',
        inputLanguage: 'json',
        outputLanguage: 'text',           // خروجی متنی (طنزآمیز)
        transformFunction: jsonToSarcastic,
        gradientClasses: 'from-fuchsia-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToScalaCaseClass: {
        type: 'jsonToScalaCaseClass',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Scala Case Class',
        shortDescription: 'Create Scala case classes from JSON',
        description:
            'Generate Scala case classes with Play JSON or Circe annotations from your sample JSON. This free converter supports nested objects, Option types, and Seq, making it easy to model APIs in functional Scala. No registration needed, works in the browser.',
        icon: Code,
        href: '/json-to-scala-case-class',
        inputLanguage: 'json',
        outputLanguage: 'scala',          // یا 'text'
        transformFunction: jsonToScalaCaseClass,
        gradientClasses: 'from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToToml: {
        type: 'jsonToToml',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to TOML',
        shortDescription: 'Convert JSON data to TOML format',
        description:
            'Effortlessly translate your JSON configuration files into TOML format. This online converter preserves arrays, tables, and inline tables, giving you clean, human-friendly TOML output. Ideal for migrating configs for Rust, Python, or Hugo projects. Free and client-side.',
        icon: Code,
        href: '/json-to-toml',
        inputLanguage: 'json',
        outputLanguage: 'toml',           // CodeMirror از TOML ممکن است پشتیبانی نکند؛ 'text' بگذارید
        transformFunction: jsonToToml,
        gradientClasses: 'from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToTypeScript: {
        type: 'jsonToTypeScript',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to TypeScript',
        shortDescription: 'Generate TypeScript interfaces from JSON',
        description:
            'Convert your sample JSON into precise TypeScript interfaces and type aliases. This free tool handles optional properties, arrays, unions, and nested objects, perfect for adding type safety to your frontend or Node.js apps. No sign-up, works entirely in your browser.',
        icon: Code,
        href: '/json-to-typescript',
        inputLanguage: 'json',
        outputLanguage: 'typescript',
        transformFunction: jsonToTypeScript,
        gradientClasses: 'from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToYaml: {
        type: 'jsonToYaml',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to YAML',
        shortDescription: 'Convert JSON to YAML online',
        description:
            'Quickly transform your JSON into clean, indented YAML. This free online converter preserves data types, ordering, and nested structures, making it ideal for Kubernetes manifests, docker-compose files, and CI/CD configs. No download required, completely browser-based.',
        icon: Code,
        href: '/json-to-yaml',
        inputLanguage: 'json',
        outputLanguage: 'yaml',
        transformFunction: jsonToYaml,
        gradientClasses: 'from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    jsonToZod: {
        type: 'jsonToZod',
        category: 'converters',
        subCategory: 'json',
        title: 'JSON to Zod',
        shortDescription: 'Generate Zod schemas from your JSON data',
        description:
            'Create fully typed Zod validation schemas from a JSON sample. This free converter infers string, number, object, and array schemas, including optional and default values. Perfect for Next.js server actions, API validation, and form libraries. Works online, no sign-up.',
        icon: Code,
        href: '/json-to-zod',
        inputLanguage: 'json',
        outputLanguage: 'typescript',    // Zod معمولاً در TypeScript استفاده می‌شود
        transformFunction: jsonToZod,
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
    },
};