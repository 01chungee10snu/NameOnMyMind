#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, 'content/korean-expression/world-pronunciations-v1.json');
const outputPath = path.join(root, 'src/domain/world-pronunciation-data.mjs');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const world = JSON.parse(fs.readFileSync(path.join(root, 'content/korean-expression/world-contexts-v1.json'), 'utf8'));
const normalize = value => String(value).replaceAll('_', '-').toLowerCase();
const allowedLocales = { WC01: ['pt-br'], WC02: ['cy-gb', 'cy'], WC03: ['de-de', 'de'], WC04: ['de-de', 'de'], WC05: ['de-de', 'de'], WC06: ['ja-jp', 'ja'], WC07: ['zh-cn', 'zh-sg', 'zh-hans', 'zh-hans-cn', 'cmn', 'cmn-cn', 'cmn-hans-cn'] };
if (source.schema_version !== '1.0.0' || source.entries?.length !== 7 || source.default_rate !== 0.85 || source.slow_rate !== 0.6) throw new Error('Pronunciation schema or rate mismatch');
const seen = new Set();
for (const e of source.entries) {
  const context = world.entries.find(row => row.id === e.world_id);
  if (!context || context.term !== e.term || seen.has(e.world_id) || !allowedLocales[e.world_id]) throw new Error('Pronunciation identity mismatch');
  seen.add(e.world_id);
  for (const key of ['ipa', 'korean_guide', 'reading', 'variant', 'practice_tip', 'source_locator']) if (typeof e[key] !== 'string' || !e[key].trim() || e[key].length > 250 || (key !== 'source_locator' && /[<>]/.test(e[key]))) throw new Error('Invalid pronunciation copy: ' + key);
  if (!/^(\/[^\n]+\/|\[[^\n]+\])$/.test(e.ipa)) throw new Error('IPA delimiters missing');
  if (!Array.isArray(e.voice_locales) || !e.voice_locales.length || e.voice_locales.some(v => !allowedLocales[e.world_id].includes(normalize(v))) || !e.voice_locales.map(normalize).includes(normalize(e.locale))) throw new Error('Unsafe voice locale');
  const speechText = e.world_id === 'WC06' ? 'もののあわれ' : e.term;
  if (e.speech_text !== speechText) throw new Error('Speech text must be the reviewed target word');
  const url = new URL(e.source_url);
  if (url.protocol !== 'https:' || url.username || url.password || !['en.wiktionary.org', 'de.wiktionary.org'].includes(url.hostname) || !url.pathname.startsWith('/wiki/')) throw new Error('Invalid pronunciation source');
  if (e.license !== 'CC BY-SA 4.0' || e.license_url !== 'https://creativecommons.org/licenses/by-sa/4.0/' || !/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at)) throw new Error('Missing attribution');
}
const output = `// Generated from world-pronunciations-v1.json. Rebuild with build:world-pronunciation-data.
const freeze = value => { if(value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const WORLD_PRONUNCIATION_SOURCE = freeze(${JSON.stringify(source, null, 2)});
// A read-only lookup facade; Object.freeze(new Map()) would still permit .set().
export const WORLD_PRONUNCIATIONS = Object.freeze({
  get: id => WORLD_PRONUNCIATION_SOURCE.entries.find(entry => entry.world_id === id),
  keys: () => WORLD_PRONUNCIATION_SOURCE.entries.map(entry => entry.world_id).values(),
  size: WORLD_PRONUNCIATION_SOURCE.entries.length,
});
`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) throw new Error('Pronunciation module is out of date');
} else fs.writeFileSync(outputPath, output);
console.log(JSON.stringify({status:'PASS', pronunciation_entries:source.entries.length, mode:process.argv.includes('--check')?'check':'build'}));
