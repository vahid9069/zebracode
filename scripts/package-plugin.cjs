const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginDir = path.join(__dirname, '..', 'wordpress', 'plugins', 'omni-ai-suite');
const distPluginDir = path.join(pluginDir, 'dist', 'omni-ai-suite');
const zipPath = path.join(pluginDir, 'dist', 'omni-ai-suite.zip');

// Ensure destination directories
const destDataDir = path.join(distPluginDir, 'includes', 'data');
if (!fs.existsSync(destDataDir)) {
  fs.mkdirSync(destDataDir, { recursive: true });
}

// Copy files
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'data', 'tools-catalog.json'),
  path.join(destDataDir, 'tools-catalog.json')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'modules', 'class-tool-synchronizer.php'),
  path.join(distPluginDir, 'includes', 'modules', 'class-tool-synchronizer.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'modules', 'class-mcp-server.php'),
  path.join(distPluginDir, 'includes', 'modules', 'class-mcp-server.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'modules', 'class-ranking-module.php'),
  path.join(distPluginDir, 'includes', 'modules', 'class-ranking-module.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'modules', 'class-module-manager.php'),
  path.join(distPluginDir, 'includes', 'modules', 'class-module-manager.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'modules', 'class-social-broadcast.php'),
  path.join(distPluginDir, 'includes', 'modules', 'class-social-broadcast.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'api', 'class-rest-controller.php'),
  path.join(distPluginDir, 'includes', 'api', 'class-rest-controller.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'api', 'class-markdown-parser.php'),
  path.join(distPluginDir, 'includes', 'api', 'class-markdown-parser.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'api', 'class-headless-controller.php'),
  path.join(distPluginDir, 'includes', 'api', 'class-headless-controller.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'providers', 'class-gemini-provider.php'),
  path.join(distPluginDir, 'includes', 'providers', 'class-gemini-provider.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'providers', 'class-provider-factory.php'),
  path.join(distPluginDir, 'includes', 'providers', 'class-provider-factory.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'includes', 'class-activator.php'),
  path.join(distPluginDir, 'includes', 'class-activator.php')
);
fs.copyFileSync(
  path.join(pluginDir, 'assets', 'js', 'admin.js'),
  path.join(distPluginDir, 'assets', 'js', 'admin.js')
);
fs.copyFileSync(
  path.join(pluginDir, 'assets', 'js', 'admin.asset.php'),
  path.join(distPluginDir, 'assets', 'js', 'admin.asset.php')
);

// Delete existing zip if exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Compress using powershell Compress-Archive
console.log('Compressing plugin archive...');
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${distPluginDir}' -DestinationPath '${zipPath}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

console.log('Done! Zip size:', fs.statSync(zipPath).size, 'bytes');
