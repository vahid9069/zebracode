import Link from 'next/link';
import type { DeveloperToolContent } from '@/lib/developer-tools/content-types';
import { getToolConfig } from '@/components/utils/tools/helper';
import { getLocalizedToolPath } from '@/lib/seo';
import en from '@/dictionaries/en/developer-content-ui.json';
import fa from '@/dictionaries/fa/developer-content-ui.json';

interface Props {
    slug: string;
    title: string;
    locale: 'fa' | 'en';
    content: DeveloperToolContent;
    toolTitles: Record<string, { title: string }>;
}

/** Server-rendered, indexable content. Visitor inputs never enter this component. */
export default function DeveloperToolGuide({ slug, title, locale, content, toolTitles }: Props) {
    const text = locale === 'fa' ? fa : en;
    const id = `${slug}-guide`;
    const headingClass = 'text-lg font-bold text-text';
    const cardClass = 'space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6';
    const related = content.relatedSlugs.flatMap(relatedSlug => {
        const tool = getToolConfig(relatedSlug);
        const path = getLocalizedToolPath(relatedSlug, locale);
        return tool && path && relatedSlug !== slug ? [{ href: `${path}/`, title: toolTitles[relatedSlug]?.title || tool.title }] : [];
    });

    return <article id={id} dir={locale === 'fa' ? 'rtl' : 'ltr'} aria-labelledby={`${id}-title`} className="bg-canvas px-4 pb-10 text-text sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6 text-sm leading-7">
            <h2 id={`${id}-title`} className="text-xl font-bold sm:text-2xl">{text.guide.replace('{tool}', title)}</h2>
            <section aria-labelledby={`${id}-overview`} className={cardClass}>
                <h3 id={`${id}-overview`} className={headingClass}>{text.overview}</h3>
                <p>{content.answer}</p>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
                <section aria-labelledby={`${id}-steps`} className={cardClass}>
                    <h3 id={`${id}-steps`} className={headingClass}>{text.steps}</h3>
                    <ol className="list-decimal space-y-2 ps-5">{content.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
                </section>
                <section aria-labelledby={`${id}-uses`} className={cardClass}>
                    <h3 id={`${id}-uses`} className={headingClass}>{text.useCases}</h3>
                    <ul className="list-disc space-y-2 ps-5">{content.useCases.map((useCase, index) => <li key={index}>{useCase}</li>)}</ul>
                </section>
            </div>
            <section aria-labelledby={`${id}-example`} className={cardClass}>
                <h3 id={`${id}-example`} className={headingClass}>{text.example}</h3>
                <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                    {[['input', text.input, content.example.input], ['output', text.output, content.example.output]].map(([key, label, value]) => <figure key={key} className="min-w-0">
                        <figcaption className="mb-2 font-medium">{label}</figcaption>
                        <pre dir="ltr" tabIndex={0} aria-label={label} className="max-h-96 overflow-auto whitespace-pre rounded-lg border border-border bg-surface-inset p-3 text-left font-mono text-xs leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{value}</pre>
                    </figure>)}
                </div>
            </section>
            <section aria-labelledby={`${id}-limits`} className={cardClass}>
                <h3 id={`${id}-limits`} className={headingClass}>{text.limitations}</h3>
                <ul className="list-disc space-y-2 ps-5">{content.limitations.map((limit, index) => <li key={index}>{limit}</li>)}</ul>
            </section>
            <section id={`${slug}-faq`} aria-labelledby={`${id}-faq-title`} className={cardClass}>
                <h3 id={`${id}-faq-title`} className={headingClass}>{text.faq}</h3>
                <div className="divide-y divide-border">{content.faq.map((item, index) => <details key={index} className="py-3">
                    <summary className="cursor-pointer rounded-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{item.question}</summary>
                    <p className="mt-3 text-text-muted">{item.answer}</p>
                </details>)}</div>
            </section>
            {related.length > 0 && <nav aria-labelledby={`${id}-related`} className={cardClass}>
                <h3 id={`${id}-related`} className={headingClass}>{text.related}</h3>
                <ul className="flex flex-wrap gap-3">{related.map(tool => <li key={tool.href}><Link href={tool.href} className="inline-flex rounded-lg border border-border bg-surface-inset px-3 py-2 text-action hover:bg-action-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:text-focus">{tool.title}</Link></li>)}</ul>
            </nav>}
            {!!content.references?.length && <section aria-labelledby={`${id}-references`} className={cardClass}>
                <h3 id={`${id}-references`} className={headingClass}>{text.references}</h3>
                <ul className="list-disc space-y-2 ps-5">{content.references.filter(reference => reference.url.startsWith('https://')).map(reference => <li key={reference.url}>
                    <a href={reference.url} className="break-words rounded-sm text-action underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:text-focus">{reference.label}</a>
                </li>)}</ul>
            </section>}
        </div>
    </article>;
}
