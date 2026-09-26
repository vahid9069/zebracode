'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';
import {BASE_URL} from "@/lib/env";

import { localizeTool } from "@/i18n/localize";
import { Dictionary } from "@/i18n/getDictionary";

interface CommandMenuProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    locale: string;
    dict: Dictionary;
    shortcutEnabled?: boolean;
}

const getGroupedTools = (tools: ToolMeta[]) => {
    const groups: Record<string, ToolMeta[]> = {};
    tools.forEach(tool => {
        const category = String(tool.subCategory).toUpperCase() || 'OTHER';
        if (!groups[category]) groups[category] = [];
        groups[category].push(tool);
    });
    return Object.keys(groups).map(key => ({ title: key, items: groups[key] }));
};

/**
 * رندر ایمن و مقاوم آیکون
 */
function renderIcon(Icon: any, className?: string): React.ReactNode {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;

    const isValidComponentType =
        typeof Icon === 'function' ||
        (typeof Icon === 'object' &&
            Icon !== null &&
            (Icon.$$typeof === Symbol.for('react.forward_ref') ||
                Icon.$$typeof === Symbol.for('react.memo')));

    if (isValidComponentType) {
        try {
            return React.createElement(Icon, { className });
        } catch (error) {
            console.error('Failed to create icon element:', Icon, error);
            return null;
        }
    }

    console.warn('Unrecognised icon type:', Icon);
    return null;
}

export default function CommandMenu({ isOpen, setIsOpen, locale, dict, shortcutEnabled = true }: CommandMenuProps) {
    const [search, setSearch] = useState('');
    const router = useRouter();

    const toolsArray = useMemo(() => Object.values(AllToolsList), []);
    const groupedToolsList = useMemo(() => getGroupedTools(toolsArray), [toolsArray]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (shortcutEnabled && e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setIsOpen, shortcutEnabled]);

    const getValidPath = (itemPath: string) => {
        let cleanPath = itemPath || '';
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return `${BASE_URL}${cleanPath}`;
    };

    const filteredCategories = groupedToolsList.map(category => ({
        ...category,
        items: category.items.filter((item) =>
            item.title?.toLowerCase().includes(search.toLowerCase()) ||
            item.shortDescription?.toLowerCase().includes(search.toLowerCase()) ||
            item.type?.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <div
                className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        autoFocus
                        type="text"
                        placeholder={dict.common.searchConverters}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {filteredCategories.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            {dict.common.noToolsFoundFor} &quot;{search}&quot;
                        </div>
                    ) : (
                        filteredCategories.map((category, idx) => (
                            <div key={idx} className="mb-4">
                                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">
                                    {dict.common.convertersLabel} / {category.title}
                                </h3>
                                <ul>
                                    {category.items.map((item, itemIdx) => {
                                        const localizedItem = localizeTool(item, dict.tools, item.type);
                                        const Icon = localizedItem.icon;
                                        return (
                                            <li key={itemIdx}>
                                                <button
                                                    onClick={() => {
                                                        const validPath = getValidPath(localizedItem.href);
                                                        router.push(validPath);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`w-full flex items-center px-3 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors ${locale === 'fa' ? 'flex-row-reverse' : ''} group`}
                                                >
                                                    <div className={`p-2 bg-gray-100 dark:bg-gray-800 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors ${locale === 'fa' ? 'ml-3' : 'mr-0'}`}>
                                                        {renderIcon(Icon, "w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400")}
                                                    </div>
                                                    <div className={`flex-1 ${locale === 'fa' ? 'text-right' : 'text-left'}`}>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{localizedItem.title}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{localizedItem.shortDescription}</div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex justify-between">
                    <span>{dict.common.searchByName}</span>
                    <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">Esc</kbd> {dict.common.escToClose}</span>
                </div>
            </div>
        </div>
    );
}