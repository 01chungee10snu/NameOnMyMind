#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['review-preview', 'public'].map((x) => path.join(ROOT, x)).filter((x) => fs.existsSync(x));
const forbidden = [
  /private\/interviews/i,
  /research_id/i,
  /claim_source_map/i,
  /evidence_locator/i,
  /\"human_editorial_release\"\s*:/i,
  /source_inventory/i,
  /internal excerpt/i,
  /reviewer_notes?/i,
  /personal reflection/i,
  /local reflection body/i,
];
const textExtensions = new Set(['.html','.js','.mjs','.css','.json','.txt','.md','.svg','.webmanifest']);
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (textExtensions.has(path.extname(file))) {
      const text = fs.readFileSync(file, 'utf8');
      for (const pattern of forbidden) if (pattern.test(text)) violations.push({ file: path.relative(ROOT, file), pattern: String(pattern) });
    }
  }
}
for (const root of roots) walk(root);
if (violations.length) {
  console.error(JSON.stringify({ status: 'FAIL', violations }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASS', scanned_roots: roots.map((x) => path.relative(ROOT, x)), violations: 0 }, null, 2));
