import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildInfoPath = path.resolve(__dirname, '../build-info.json');
const settingsAppPath = path.resolve(__dirname, '../src/apps/settings/SettingsApp.tsx');
const neofetchCommandPath = path.resolve(__dirname, '../src/apps/xshell/commands/builtin/neofetch.command.tsx');

// 1. Read and update build info
let buildInfo = { build: 0 };
if (fs.existsSync(buildInfoPath)) {
  buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
}
buildInfo.build += 1;
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

// 2. Get current date
const buildDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// 3. Update SettingsApp.tsx
let settingsAppContent = fs.readFileSync(settingsAppPath, 'utf-8');
settingsAppContent = settingsAppContent.replace(
  /<strong>Version:<\/strong> 0\.3\.\d+ "Celebi"/,
  `<strong>Version:</strong> 0.3.${buildInfo.build} "Celebi"`
);
settingsAppContent = settingsAppContent.replace(
  /<strong>Build Date:<\/strong> .*?\n/,
  `<strong>Build Date:</strong> ${buildDate}\n`
);
fs.writeFileSync(settingsAppPath, settingsAppContent, 'utf-8');

// 4. Update neofetch.command.tsx
let neofetchContent = fs.readFileSync(neofetchCommandPath, 'utf-8');
neofetchContent = neofetchContent.replace(
  /const version = '0\.3\.\d+ "Celebi"';/,
  `const version = '0.3.${buildInfo.build} "Celebi"';`
);
neofetchContent = neofetchContent.replace(
  /const buildDate = '.*?';/,
  `const buildDate = '${buildDate}';`
);
fs.writeFileSync(neofetchCommandPath, neofetchContent, 'utf-8');

console.log(`Build number updated to: ${buildInfo.build}`);
console.log(`Build date updated to: ${buildDate}`);