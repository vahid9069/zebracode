const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'lib', 'registry');
const files = fs.readdirSync(dir).filter((f) => /ToolsList|encoders/.test(f) && f.endsWith('.ts'));
const out = {};
function extract(src) {
  const re = /(?:^|\n)\s*(['"]?)([A-Za-z0-9_-]+)\1:\s*\{[\s\S]*?title:\s*'((?:\\'|[^'])*)'[\s\S]*?shortDescription:\s*'((?:\\'|[^'])*)'[\s\S]*?description:\s*'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[2];
    if (['type', 'category', 'subCategory', 'icon', 'href'].includes(key)) continue;
    out[key] = {
      title: m[3].replace(/\\'/g, "'"),
      shortDescription: m[4].replace(/\\'/g, "'"),
      description: m[5].replace(/\\'/g, "'"),
    };
  }
}
for (const f of files) {
  extract(fs.readFileSync(path.join(dir, f), 'utf8'));
}
const dest = path.join(__dirname, '..', 'src', 'dictionaries', 'en', 'tools.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log('keys', Object.keys(out).length);
console.log(Object.keys(out).join('\n'));
