const fs = require('fs');
const path = require('path');

// 1. Read zebracode tools
const zebraRaw = require(path.join(__dirname, 'tools.json'));
const zebraTools = zebraRaw.map(t => ({
  slug: t.path,
  title: t.titleFa || t.titleEn,
  description: t.descriptionFa || t.descriptionEn || `ابزار تخصصی آنلاین ${t.path}`,
  url: `https://zebracode.ir/${t.path}`,
  domain: 'zebracode.ir',
}));

// 2. Read kit tools from kit/src/lib/tools.ts
const kitToolsTs = path.join(__dirname, '..', 'kit', 'src', 'lib', 'tools.ts');
const kitTools = [];
if (fs.existsSync(kitToolsTs)) {
  const content = fs.readFileSync(kitToolsTs, 'utf8');
  const regex = /{\s*slug:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],\s*shortDescription:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    kitTools.push({
      slug: match[1],
      title: match[2],
      description: match[3],
      url: `https://kit.zebracode.ir/${match[1]}`,
      domain: 'kit.zebracode.ir',
    });
  }
}

console.log(`Loaded ${zebraTools.length} tools from zebracode.ir`);
console.log(`Loaded ${kitTools.length} tools from kit.zebracode.ir`);

const allTools = [...zebraTools, ...kitTools];
console.log(`Total combined tools: ${allTools.length}`);

// Ensure target directory exists
const targetDir = path.join(__dirname, '..', 'wordpress', 'plugins', 'omni-ai-suite', 'includes', 'data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = path.join(targetDir, 'tools-catalog.json');
fs.writeFileSync(targetPath, JSON.stringify(allTools, null, 2), 'utf8');
console.log(`Successfully wrote ${allTools.length} tools to ${targetPath}`);
