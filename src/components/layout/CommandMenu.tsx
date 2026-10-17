'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';

import { localizeCategory, localizeTool } from "@/i18n/localize";
import { Dictionary } from "@/i18n/getDictionary";
import { matchesCommandSearch, normalizeCommandSearch } from '@/components/layout/commandMenuSearch';
import { isModKShortcut } from '@/lib/keyboard';

interface CommandMenuProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    locale: string;
    dict: Dictionary;
    shortcutEnabled?: boolean;
    returnFocusRef?: React.MutableRefObject<HTMLElement | null>;
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

export default function CommandMenu({ isOpen, setIsOpen, locale, dict, shortcutEnabled = true, returnFocusRef }: CommandMenuProps) {
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const toolsArray = useMemo(() => Object.values(AllToolsList), []);
    const groupedToolsList = useMemo(() => getGroupedTools(toolsArray), [toolsArray]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (shortcutEnabled && isModKShortcut(e)) {
                e.preventDefault();
                if (returnFocusRef) {
                    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                }
                setIsOpen(true);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setIsOpen, shortcutEnabled]);

    const getValidPath = (itemPath: string) => {
        const cleanPath = itemPath.trim().replace(/^\/+|\/+$/g, '');
        return `${locale === 'en' ? '/en' : ''}/${cleanPath}/`;
    };

    const filteredCategories = useMemo(() => {
        const query = normalizeCommandSearch(search);

        return groupedToolsList.map(category => ({
            ...category,
            items: category.items.filter(item => {
                const localized = localizeTool(item, dict.tools, item.type);
                const localizedCategory = localizeCategory(dict.categories, item.subCategory || item.category);
                return matchesCommandSearch([
                    localized.title,
                    localized.shortDescription,
                    localized.description,
                    item.title,
                    item.shortDescription,
                    item.description,
                    item.type,
                    item.category,
                    item.subCategory,
                    localizedCategory,
                ], query);
            }),
        })).filter(category => category.items.length > 0);
    }, [dict.categories, dict.tools, groupedToolsList, search]);

    const filteredToolCount = filteredCategories.reduce((count, category) => count + category.items.length, 0);
    const flatItems = useMemo(
        () => filteredCategories.flatMap(category => category.items.map(item => ({ item, category: category.title }))),
        [filteredCategories],
    );

    useEffect(() => {
        setActiveIndex(flatItems.length > 0 ? 0 : -1);
    }, [flatItems.length, search]);

    useEffect(() => {
        if (activeIndex < 0) return;
        resultRefs.current[`command-menu-option-${activeIndex}`]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const getOptionId = (index: number) => `command-menu-option-${index}`;

    const selectTool = (item: ToolMeta) => {
        const localizedItem = localizeTool(item, dict.tools, item.type);
        router.push(getValidPath(localizedItem.href));
        setIsOpen(false);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && flatItems.length > 0) {
            event.preventDefault();
            setActiveIndex(current => (current + 1 + flatItems.length) % flatItems.length);
            return;
        }

        if (event.key === 'ArrowUp' && flatItems.length > 0) {
            event.preventDefault();
            setActiveIndex(current => (current - 1 + flatItems.length) % flatItems.length);
            return;
        }

        if (event.key === 'Enter' && activeIndex >= 0 && flatItems[activeIndex]) {
            event.preventDefault();
            selectTool(flatItems[activeIndex].item);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
                <Dialog.Content
                    id="command-menu"
                    data-command-menu="true"
                    className="fixed left-1/2 top-24 z-[101] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface-raised shadow-2xl animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
                    onOpenAutoFocus={event => {
                        event.preventDefault();
                        searchInputRef.current?.focus();
                    }}
                    onCloseAutoFocus={event => {
                        const element = returnFocusRef?.current;
                        if (element?.isConnected) {
                            event.preventDefault();
                            element.focus();
                        }
                    }}
                >
                    <Dialog.Title className="sr-only">{dict.layout.searchTools}</Dialog.Title>
                    <Dialog.Description className="sr-only">{dict.common.searchByName}</Dialog.Description>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="w-5 h-5 shrink-0 text-text-muted" />
                    <label htmlFor="command-menu-search" className="sr-only">{dict.common.searchConverters}</label>
                    <input
                        ref={searchInputRef}
                        id="command-menu-search"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls="command-menu-results"
                        aria-expanded={isOpen}
                        aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
                        type="text"
                        placeholder={dict.common.searchConverters}
                        className="flex-1 bg-transparent border-none outline-none text-text placeholder:text-text-muted text-lg focus-visible:ring-2 focus-visible:ring-focus"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <Dialog.Close asChild>
                    <button type="button" aria-label={dict.layout.closeMenu} className="p-1 rounded-md text-text-muted hover:bg-action-soft hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                        <X className="w-5 h-5" />
                    </button>
                    </Dialog.Close>
                </div>

                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {search.trim()
                        ? filteredToolCount > 0
                            ? dict.common.searchResultsCount.replace('{count}', String(filteredToolCount))
                            : `${dict.common.noToolsFoundFor} "${search.trim()}"`
                        : ''}
                </div>

                <div id="command-menu-results" role="listbox" aria-label={dict.layout.developerTools} className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {filteredCategories.length === 0 ? (
                        <div className="p-6 text-center text-text-muted">
                            {dict.common.noToolsFoundFor} &quot;{search}&quot;
                        </div>
                    ) : (
                        filteredCategories.map((category, idx) => (
                            <div key={idx} role="group" aria-labelledby={`command-menu-group-${idx}`} className="mb-4">
                                <h3 id={`command-menu-group-${idx}`} className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 mt-2">
                                    {dict.layout.developerTools} / {category.title === 'JSON'
                                        ? dict.layout.jsonConverters
                                        : localizeCategory(dict.categories, category.title)}
                                </h3>
                                <div>
                                    {category.items.map((item, itemIdx) => {
                                        const localizedItem = localizeTool(item, dict.tools, item.type);
                                        const Icon = localizedItem.icon;
                                        const resultIndex = flatItems.findIndex(entry => entry.item === item);
                                        const optionId = getOptionId(resultIndex);
                                        return (
                                            <div
                                                key={`${category.title}-${item.type}-${itemIdx}`}
                                                id={optionId}
                                                ref={element => {
                                                    resultRefs.current[optionId] = element;
                                                }}
                                                role="option"
                                                aria-selected={activeIndex === resultIndex}
                                                tabIndex={-1}
                                                onMouseDown={event => event.preventDefault()}
                                                onMouseEnter={() => setActiveIndex(resultIndex)}
                                                onClick={() => selectTool(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${locale === 'fa' ? 'flex-row-reverse' : ''} group ${activeIndex === resultIndex ? 'bg-action-soft' : 'hover:bg-action-soft'}`}
                                                >
                                                    <div className="shrink-0 rounded-md bg-surface-inset p-2 transition-colors group-hover:bg-action-soft">
                                                        {renderIcon(Icon, "w-5 h-5 text-text-muted group-hover:text-action dark:group-hover:text-focus")}
                                                    </div>
                                                    <div className={`flex-1 ${locale === 'fa' ? 'text-right' : 'text-left'}`}>
                                                        <div className="text-sm font-medium text-text">{localizedItem.title}</div>
                                                        <div className="text-xs text-text-muted">{localizedItem.shortDescription}</div>
                                                    </div>
                                                </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-4 py-3 bg-surface-inset border-t border-border text-xs text-text-muted flex justify-between">
                    <span>{dict.common.searchByName}</span>
                    <span><kbd className="bg-surface-raised px-1.5 py-0.5 rounded text-text-muted">Esc</kbd> {dict.common.escToClose}</span>
                </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
