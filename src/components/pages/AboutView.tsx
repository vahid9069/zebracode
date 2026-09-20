import React from 'react';
import { Code2, Globe, Zap, Shield, Users, Heart } from 'lucide-react';

interface AboutViewProps {
    dict: any;
}

export default function AboutPage({ dict }: AboutViewProps) {
    const d = dict;
    return (
        <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100">
            {/* Hero */}
            <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-[#0d1117] py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        {d.heroTitlePrefix} <span className="text-blue-600 dark:text-blue-400">ZebraCode</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {d.heroDescription}
                    </p>
                </div>
            </section>

            {/* Mission & Story */}
            <section className="max-w-4xl mx-auto px-4 py-16 space-y-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{d.missionTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {d.mission}
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
                    <h2 className="text-2xl font-bold text-center mb-12">{d.whyTitle}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {(d.features as any[]).map((feature: any) => {
                            const icons: Record<string, any> = { instant: Zap, privacy: Shield, opensource: Globe, developers: Users, range: Code2, community: Heart };
                            const Icon = icons[feature.id] || Code2;
                            
                            return (
                                <div key={feature.id} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">{d.techTitle}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {d.techDescription}
                </p>
            </section>
        </div>
    );
}