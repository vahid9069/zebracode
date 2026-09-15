const fs = require("fs");
const p = "src/components/layout/AppLayout.tsx";
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  "import {BASE_URL} from \"@/lib/env\";",
  "import {BASE_URL} from \"@/lib/env\";\nimport { I18nProvider } from \"@/i18n/I18nProvider\";\nimport type { Dictionary, Locale } from \"@/i18n/getDictionary\";\nimport { localizeCategory, localizeTool } from \"@/i18n/localize\";"
);
s = s.replace(
  "export default function AppLayout({ children, locale }: { children: React.ReactNode, locale: string }) {",
  "export default function AppLayout({ children, locale, dict }: { children: React.ReactNode, locale: Locale, dict: Dictionary }) {"
);
s = s.replace(
  "const cat = (tool.category || 'other').toUpperCase();\n        const sub = (tool.subCategory || 'general').toUpperCase();",
  "const cat = tool.category || 'other';\n        const sub = tool.subCategory || 'general';"
);
s = s.replace(
  "<CommandMenu isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} locale={locale} />",
  "<CommandMenu isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} locale={locale} dict={dict} />"
);
s = s.replace("{locale === 'en' ? 'Home' : 'خانه'}", "{dict.layout.home}");
s = s.replace("{locale === 'en' ? 'About Us' : 'درباره ما'}", "{dict.layout.about}");
s = s.replace("title={locale === 'en' ? 'تغییر زبان به فارسی' : 'Switch to English'}", "title={dict.layout.switchLanguage}");
s = s.replace("{locale === 'en' ? 'FA' : 'EN'}", "{dict.layout.langCode}");
s = s.replace(
  "<span className=\"flex items-center\"><Search className=\"w-4 h-4 mr-2\" /> Search</span>",
  "<span className=\"flex items-center\"><Search className=\"w-4 h-4 me-2\" /> {dict.layout.search}</span>"
);
s = s.replace("{category.title}", "{localizeCategory(dict.categories, category.title)}");
s = s.replace("{subGroup.title}", "{localizeCategory(dict.categories, subGroup.title)}");
s = s.replace("{item.title}", "{localizeTool(item, dict.tools).title}");
s = s.replace(
  "return (\n        <div className=\"h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans\">",
  "return (\n        <I18nProvider locale={locale} dict={dict}>\n        <div className=\"h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans\">"
);
s = s.replace(
  "                </main>\n            </div>\n        </div>\n    );\n}",
  "                </main>\n            </div>\n        </div>\n        </I18nProvider>\n    );\n}"
);
fs.writeFileSync(p, s);
console.log("AppLayout patched");