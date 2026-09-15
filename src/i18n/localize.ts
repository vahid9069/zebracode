import { ToolMeta } from "@/types/types";
import type { Dictionary } from "@/i18n/getDictionary";

export function localizeCategory(categories: Dictionary["categories"], key: string) {
  const normalized = (key || "other").toLowerCase();
  return categories[normalized as keyof typeof categories] || key;
}

export function localizeTool(tool: ToolMeta, toolsDict: Dictionary["tools"], registryKey?: string): ToolMeta {
  const translation =
    (registryKey && toolsDict[registryKey]) ||
    (tool.type && toolsDict[tool.type]) ||
    undefined;

  if (!translation) return tool;

  return {
    ...tool,
    title: translation.title || tool.title,
    shortDescription: translation.shortDescription || tool.shortDescription,
    description: translation.description || tool.description,
    secondaryInputTitle: translation.secondaryInputTitle || tool.secondaryInputTitle,
  };
}