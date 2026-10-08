#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, 'content/korean-expression/world-hanja-v1.json');
const worldPath = path.join(root, 'content/korean-expression/world-contexts-v1.json');
const outputPath = path.join(root, 'src/domain/world-hanja-data.mjs');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const world = JSON.parse(fs.readFileSync(worldPath, 'utf8'));
const han = /\p{Script=Han}/u;
const allowedHosts = new Set(['ko.wiktionary.org', 'zdic.net']);
const expected = new Map(['WC06', 'WC07'].map(id => {
  const row = world.entries.find(entry => entry.id === id);
  return [id, row?.term];
}));

if (source.schema_version !== '1.0.0' || !source.version || !source.license?.trim() || !source.license_url?.trim()) {
  throw new Error('Hanja schema or licensing metadata is invalid');
}
const licenseUrl = new URL(source.license_url);
if (source.license !== 'CC BY-SA 4.0' || source.license_url !== 'https://creativecommons.org/licenses/by-sa/4.0/' || licenseUrl.protocol !== 'https:' || licenseUrl.username || licenseUrl.password) throw new Error('Invalid license URL');
const seen = new Set();
for (const entry of source.entries ?? []) {
  if (seen.has(entry.world_id)) throw new Error(`Duplicate Hanja world ID: ${entry.world_id}`);
  seen.add(entry.world_id);
  if (!expected.has(entry.world_id) || entry.term !== expected.get(entry.world_id)) throw new Error(`Hanja identity mismatch: ${entry.world_id}`);
  const actual = [...entry.term].filter(char => han.test(char));
  if (!actual.length || !Array.isArray(entry.characters) || entry.characters.length !== actual.length) throw new Error(`Hanja coverage mismatch: ${entry.world_id}`);
  const covered = entry.characters.map(character => character.hanja);
  if (covered.some((char, index) => char !== actual[index] || !han.test(char))) throw new Error(`Hanja character order mismatch: ${entry.world_id}`);
  const characterIds = new Set();
  for (const character of entry.characters) {
    if (characterIds.has(character.hanja)) throw new Error(`Duplicate Hanja character: ${character.hanja}`);
    characterIds.add(character.hanja);
    for (const key of ['display', 'hun', 'eum', 'source_url']) {
      if (typeof character[key] !== 'string' || !character[key].trim() || /[<>]/.test(character[key])) throw new Error(`Invalid Hanja ${key}`);
    }
    if (!/^[가-힣 ]{1,20}$/.test(character.hun) || !/^[가-힣](?:[가-힣/]{0,5})$/.test(character.eum)) throw new Error('Invalid Korean hun/eum');
    if (character.display !== character.hanja + (character.reference_form ? '(' + character.reference_form + ')' : '')) throw new Error('Display-form mismatch');
    if (character.reference_form && (!han.test(character.reference_form) || [...character.reference_form].length !== 1)) throw new Error('Invalid Hanja reference form');
    for (const key of ['source_url', 'variant_source_url']) {
      if (!character[key]) continue;
      const url = new URL(character[key]);
      if (key === 'source_url' && (url.hostname !== 'ko.wiktionary.org' || decodeURIComponent(url.pathname.slice('/wiki/'.length)) !== (character.reference_form || character.hanja))) throw new Error('Source character mismatch');
      if (url.search || url.hash) throw new Error('Unreviewed source URL parameters');
      const validPath = url.hostname === 'ko.wiktionary.org' ? url.pathname.startsWith('/wiki/') : url.pathname.startsWith('/hans/');
      if (url.protocol !== 'https:' || url.username || url.password || !allowedHosts.has(url.hostname) || !validPath) {
        throw new Error(`Invalid Hanja source URL: ${character[key]}`);
      }
    }
  }
  if (typeof entry.note !== 'string' || typeof entry.scope !== 'string' || !entry.scope.trim()) throw new Error('Invalid Hanja note or scope');
}
if (seen.size !== 2 || source.entries.length !== 2) throw new Error('Unexpected Hanja entry count');

const output = `// Generated from world-hanja-v1.json. Rebuild with build:world-hanja.
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const WORLD_HANJA_SOURCE = freeze(${JSON.stringify(source, null, 2)});
export const WORLD_HANJA = Object.freeze({
  get: (worldId, term) => WORLD_HANJA_SOURCE.entries.find(entry => entry.world_id === worldId && entry.term === term),
  keys: () => WORLD_HANJA_SOURCE.entries.map(entry => entry.world_id).values(),
  size: WORLD_HANJA_SOURCE.entries.length,
});
`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) throw new Error('Hanja module is out of date');
} else {
  fs.writeFileSync(outputPath, output);
}
console.log(JSON.stringify({ status: 'PASS', hanja_entries: source.entries.length, mode: process.argv.includes('--check') ? 'check' : 'build' }));
