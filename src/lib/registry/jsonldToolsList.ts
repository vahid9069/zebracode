import { compactJsonLd, flattenJsonLd, frameJsonLd, normalizeJsonLd, toNQuads } from "@/lib/tools-transformer/jsonldTransformers";
import { ToolMeta } from "@/types/types";
import { Code } from "lucide-react";

export const JsonldToolsList: Record<string, ToolMeta> = {
    'jsonld-to-compacted': {
        type: 'jsonld-to-compacted',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Compacted',
        shortDescription: 'Compact a JSON-LD document with a given context',
        description: 'Compact your JSON-LD data by applying a specific context to shorten IRIs and reduce document size. This online compactor helps you simplify expanded JSON-LD into a concise, production-ready form. Ideal for SEO, schema markup, and API payloads. Free and processed entirely in your browser.',
        icon: Code,
        href: '/jsonld-to-compacted',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: compactJsonLd,
        gradientClasses: 'from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        requiresSecondaryInput: true,
        secondaryInputTitle: 'JSON-LD Context',
        secondarySampleCode: '',
        extraContent: {
            faq: [
                { question: "What is JSON-LD compaction?", answer: "Compaction applies a context to shorten IRIs into human-readable terms, reducing the document size and making it easier to read and work with in applications." },
                { question: "Why would I need to compact JSON-LD?", answer: "Compacted JSON-LD is more developer-friendly, smaller in size for API responses, and easier to embed in web pages for SEO schema markup." },
                { question: "Is a context always required?", answer: "Yes, compaction requires a JSON-LD context that defines how IRIs map to short terms. The tool accepts a standard context as secondary input." }
            ]
        }
    },
    'jsonld-to-flattened': {
        type: 'jsonld-to-flattened',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Flattened',
        shortDescription: 'Flatten a JSON-LD document to a node-based graph',
        description: 'Flatten your JSON-LD document into a list of top-level nodes, making it easier to index and query. This converter removes nested objects, replacing them with node references. Perfect for debugging, graph databases, and standardizing structured data. Free online tool, no registration required.',
        icon: Code,
        href: '/jsonld-to-flattened',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: flattenJsonLd,
        gradientClasses: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What does flattening JSON-LD do?", answer: "Flattening converts nested JSON-LD objects into a flat list of top-level nodes with explicit IDs, making it easier to index, query, and process the graph structure." },
                { question: "When should I flatten JSON-LD?", answer: "Flattening is ideal when you need to store JSON-LD in a graph database, index it for search, or standardize its structure for programmatic processing." },
                { question: "Does flattening change the data?", answer: "No, flattening is a reversible transformation. It restructures the document without losing any semantic information from the original JSON-LD." }
            ]
        }
    },
    'jsonld-to-framed': {
        type: 'jsonld-to-framed',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Framed',
        shortDescription: 'Shape a JSON-LD document by applying a frame',
        description: 'Frame your JSON-LD data to extract a specific view of the graph. This online framer applies a JSON-LD frame to match desired property shapes, making it easier to consume linked data in apps and sites. Essential for schema.org SEO and semantic web development. Free and client-side only.',
        icon: Code,
        href: '/jsonld-to-framed',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: frameJsonLd,
        gradientClasses: 'from-sky-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        requiresSecondaryInput: true,
        secondaryInputTitle: 'JSON-LD Frame',
        secondarySampleCode: '',
        extraContent: {
            faq: [
                { question: "What is JSON-LD framing?", answer: "Framing shapes a JSON-LD document to match a desired structure defined by a frame, extracting exactly the data you need in a predictable format." },
                { question: "How is framing different from compaction?", answer: "While compaction shortens terms, framing restructures the entire document shape — you define the desired output structure and the tool extracts matching data." },
                { question: "What is a frame used for?", answer: "Frames are used to extract specific views of linked data for UI rendering, API responses, or transforming JSON-LD into a shape your application expects." }
            ]
        }
    },
    'jsonld-to-normalized': {
        type: 'jsonld-to-normalized',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Normalized',
        shortDescription: 'Normalize JSON-LD (RDF Dataset Normalization)',
        description: 'Apply the RDF Dataset Normalization algorithm (URDNA2015) to your JSON-LD document online. Produce a canonical, deterministic form suitable for digital signatures, hashing, and data integrity verification. Free, fast, and entirely client-side.',
        icon: Code,
        href: '/jsonld-to-normalized',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: normalizeJsonLd,
        gradientClasses: 'from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is JSON-LD normalization?", answer: "Normalization (or canonicalization) transforms a JSON-LD document into a standard, deterministic format using the URDNA2015 algorithm, ensuring identical graphs produce the exact same output string." },
                { question: "Why do I need to normalize JSON-LD?", answer: "It is crucial for cryptographic operations. If you need to digitally sign, hash, or compare two JSON-LD documents for equality, you must normalize them first to avoid false mismatches due to formatting or node ordering." },
                { question: "Is data lost during normalization?", answer: "No semantic data is lost, but structural elements like specific blank node identifiers or property orderings are rewritten to match the canonical standard." }
            ]
        }
    },
    'jsonld-to-nquads': {
        type: 'jsonld-to-nquads',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to N-Quads',
        shortDescription: 'Convert JSON-LD documents to N-Quads format online',
        description: 'Serialize your JSON-LD linked data into the N-Quads line-based format instantly. Ideal for feeding RDF data to graph databases, triple stores, or standard Linked Data pipelines. Free online converter requiring no registration.',
        icon: Code,
        href: '/jsonld-to-nquads',
        inputLanguage: 'jsonld',
        outputLanguage: 'text',
        transformFunction: toNQuads,
        gradientClasses: 'from-lime-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is the N-Quads format?", answer: "N-Quads is a simple, line-based, plain text format for encoding an RDF dataset. Each line represents a single statement comprising a subject, predicate, object, and an optional graph label (a quad)." },
                { question: "Why convert JSON-LD to N-Quads?", answer: "N-Quads are highly optimized for machine reading and stream processing. Graph databases (like Neo4j with RDF plugins or Blazegraph) and triple stores often require N-Quads for bulk data ingestion." },
                { question: "Does this tool support multiple graphs?", answer: "Yes, if your JSON-LD document contains named graphs, the converter will accurately output the fourth element (the graph label) in the resulting N-Quads." }
            ]
        }
    }
};