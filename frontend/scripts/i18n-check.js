#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(frontendRoot, 'src');
const localesDir = path.join(srcRoot, 'i18n', 'locales');

const defaultLocale = process.env.DEFAULT_LOCALE || 'fr';

function flattenKeys(value, prefix = '', out = new Set()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenKeys(child, nextPrefix, out);
    }
    return out;
  }

  out.add(prefix);
  return out;
}

async function listFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTranslationKeys(sourceText) {
  const keys = new Set();

  const patterns = [
    /\bt\(\s*['"`]([^'"`]+?)['"`]/g,
    /\bi18n\.t\(\s*['"`]([^'"`]+?)['"`]/g
  ];

  for (const pattern of patterns) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(sourceText)) !== null) {
      const key = match[1]?.trim();
      if (!key) continue;
      if (key.includes('${')) continue; // dynamic template literal
      keys.add(key);
    }
  }

  return keys;
}

function formatList(items, max = 50) {
  if (items.length <= max) return items.map((k) => `  - ${k}`).join('\n');
  const head = items.slice(0, max).map((k) => `  - ${k}`).join('\n');
  return `${head}\n  ... (${items.length - max} more)`;
}

async function main() {
  const localeFiles = (await fs.readdir(localesDir))
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (localeFiles.length === 0) {
    console.error(`[i18n-check] No locale files found in ${localesDir}`);
    process.exit(1);
  }

  const defaultLocaleFile = `${defaultLocale}.json`;
  if (!localeFiles.includes(defaultLocaleFile)) {
    console.error(
      `[i18n-check] Default locale file not found: ${defaultLocaleFile}. Found: ${localeFiles.join(', ')}`
    );
    process.exit(1);
  }

  const localeMaps = new Map();
  for (const file of localeFiles) {
    const filePath = path.join(localesDir, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(raw);
    const localeName = path.basename(file, '.json');
    const keys = flattenKeys(json);
    localeMaps.set(localeName, keys);
  }

  const defaultKeys = localeMaps.get(defaultLocale);

  const sourceFiles = (await listFilesRecursively(srcRoot)).filter((f) =>
    /\.(jsx?|tsx?)$/.test(f)
  );

  const usedKeys = new Set();
  for (const filePath of sourceFiles) {
    const raw = await fs.readFile(filePath, 'utf8');
    for (const key of extractTranslationKeys(raw)) usedKeys.add(key);
  }

  const missingInDefault = [...usedKeys].filter((k) => !defaultKeys.has(k)).sort();

  const missingPerLocale = new Map();
  for (const [locale, keys] of localeMaps.entries()) {
    if (locale === defaultLocale) continue;

    const missing = [...defaultKeys].filter((k) => !keys.has(k)).sort();
    if (missing.length) missingPerLocale.set(locale, missing);
  }

  const unusedDefault = [...defaultKeys].filter((k) => !usedKeys.has(k)).sort();

  console.log(`[i18n-check] Locales: ${[...localeMaps.keys()].sort().join(', ')}`);
  console.log(`[i18n-check] Default locale: ${defaultLocale} (${defaultKeys.size} keys)`);
  console.log(`[i18n-check] Used keys in src/: ${usedKeys.size}`);

  let failed = false;

  if (missingInDefault.length) {
    failed = true;
    console.error(`\n[i18n-check] ERROR: Missing keys in default locale (${defaultLocale}): ${missingInDefault.length}`);
    console.error(formatList(missingInDefault));
  }

  if (missingPerLocale.size) {
    failed = true;
    for (const [locale, missing] of [...missingPerLocale.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      console.error(`\n[i18n-check] ERROR: Missing keys in locale (${locale}): ${missing.length}`);
      console.error(formatList(missing));
    }
  }

  if (unusedDefault.length) {
    console.log(`\n[i18n-check] WARN: Unused keys in default locale (${defaultLocale}): ${unusedDefault.length}`);
    console.log(formatList(unusedDefault, 25));
  }

  if (failed) process.exit(1);

  console.log(`\n[i18n-check] OK`);
}

main().catch((err) => {
  console.error('[i18n-check] Fatal:', err);
  process.exit(1);
});
