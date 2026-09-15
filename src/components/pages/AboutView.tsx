import React from 'react';
import { Metadata } from 'next';
import { Code2, Globe, Zap, Shield, Users, Heart } from 'lucide-react';


interface AboutViewProps {
    dict: {
        title: string;
        description: string;
        mission: string;
        privacy: string;
    };
}

export const metadata: Metadata = {
    title: 'About ZebraCode - Free Online Developer Tools',
    description:
        'ZebraCode provides free, fast, and privacy-focused online converter tools for developers. JSON, CSS, GraphQL, and more — all processed locally in your browser.',
    alternates: {
        canonical: 'https://zebracode.ir/about',
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: 'About ZebraCode',
        description: 'Free online developer tools — no sign-up, no ads, fully client‑side.',
        url: 'https://zebracode.ir/about',
        siteName: 'ZebraCode',
        type: 'website',
    },
};

export default function AboutPage({ dict }: AboutViewProps) {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100">
            {/* Hero */}
            <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-[#0d1117] py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        About <span className="text-blue-600 dark:text-blue-400">ZebraCode</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        We build free, fast, and beautiful developer tools that respect your privacy.
                    </p>
                </div>
            </section>

            {/* Mission & Story */}
            <section className="max-w-4xl mx-auto px-4 py-16 space-y-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            ZebraCode was created to provide developers with a set of essential online utilities
                            that work instantly, without ads, tracking, or registration. Every tool runs entirely
                            in your browser — your data never leaves your device.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Code2 size={48} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-gray-50 dark:bg-[#161b22] py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-12">Why Choose ZebraCode?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Zap, title: 'Instant & Free', desc: 'All tools work directly in your browser with zero configuration and no fees.' },
                            { icon: Shield, title: 'Privacy First', desc: 'Your data is processed locally and never uploaded to any server.' },
                            { icon: Globe, title: 'Open Source', desc: 'Our code is open for anyone to inspect, contribute, or improve.' },
                            { icon: Users, title: 'For Developers', desc: 'Built by developers, for developers — with real‑world use cases in mind.' },
                            { icon: Code2, title: 'Wide Range', desc: 'From JSON to CSS, GraphQL to Timestamps, we cover the most needed conversions.' },
                            { icon: Heart, title: 'Community Driven', desc: 'We listen to feedback and continuously add new tools and features.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                                    <Icon size={24} />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Built with Modern Tech</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Next.js 15 · React · TypeScript · Tailwind CSS · Lucide Icons · Jalaali-js
                </p>
            </section>

            {/* Contribute */}
            {/*<section className="bg-blue-600 dark:bg-blue-700 py-16 px-4 text-white text-center">*/}
            {/*    <h2 className="text-2xl font-bold mb-4">Want to Contribute?</h2>*/}
            {/*    <p className="mb-6 max-w-xl mx-auto opacity-90">*/}
            {/*        ZebraCode is open source! Help us add new tools, improve the UI, or translate the site.*/}
            {/*    </p>*/}
            {/*    <a*/}
            {/*        href="https://github.com/your-org/zebracode"*/}
            {/*        target="_blank"*/}
            {/*        rel="noopener noreferrer"*/}
            {/*        className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"*/}
            {/*    >*/}
            {/*        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" /></svg>*/}
            {/*        View on GitHub*/}
            {/*    </a>*/}
            {/*</section>*/}
        </div>
    );
}