#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const LEARNER_SOURCE = path.join(ROOT, 'prototypes/korean-daily-learning-20260923/index.html');
const CARD_SOURCE = path.join(ROOT, 'src/ui/index.html');
const CANONICAL_ORIGIN = 'https://01chungee10snu.github.io/NameOnMyMind';
const MOBILE_MANIFEST = 'MOBILE_WEB_MANIFEST.json';

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');

export function rebaseResourcePaths(html, depth) {
  if (!['root', 'learn'].includes(depth)) throw new Error('INVALID_MOBILE_ROUTE');
  const prefix = depth === 'root' ? './' : '../';
  return html.replaceAll('../../', prefix);
}

export function legacyRouterScript() {
  return `<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var card = params.get('card');
  var space = params.get('space');
  var validCard = /^C000[1-5]$/.test(card || '');
  var validSpace = ['today', 'discover', 'journal', 'collection'].includes(space || '');
  if (validCard || validSpace) {
    window.location.replace('./cards.html' + window.location.search + window.location.hash);
  }
}());
</script>`;
}

export function injectMetadata(html, { canonicalUrl, resourcePrefix }) {
  const metadata = [
    '<meta name="description" content="하루에 마음말 하나. 쉬운 뜻과 짧은 예문으로 내 마음에 맞는 말을 찾아보세요.">',
    `<link rel="canonical" href="${canonicalUrl}">`,
    '<meta property="og:title" content="오늘의 마음말 — NameOnMyMind">',
    '<meta property="og:description" content="하루에 마음말 하나. 쉬운 뜻과 짧은 예문으로 내 마음에 맞는 말을 찾아보세요.">',
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<link rel="icon" href="${resourcePrefix}assets/brand/app-icon.svg" type="image/svg+xml">`,
    `<link rel="manifest" href="${resourcePrefix}manifest.webmanifest">`,
  ].join('\n  ');
  return html
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<title>[^<]*<\/title>/, '<title>오늘의 마음말 — NameOnMyMind</title>')
    .replace('</head>', `  ${metadata}\n</head>`);
}

export function renderLearnerHtml(sourceHtml, { location = 'root' } = {}) {
  const resourcePrefix = location === 'root' ? './' : '../';
  const canonicalUrl = `${CANONICAL_ORIGIN}/${location === 'root' ? '' : 'learn/'}`;
  let html = rebaseResourcePaths(sourceHtml, location);
  html = injectMetadata(html, { canonicalUrl, resourcePrefix });
  if (location === 'root') html = html.replace('<head>', `<head>\n${legacyRouterScript()}`);
  return html;
}

export function assertMobileWebAuthorization(value) {
  if (value !== '1') throw new Error('MOBILE_WEB_STAGE_BLOCKED: explicit mobile web publication authorization is required.');
}

export function staleOutputPaths(actual, expected) {
  return Object.entries(expected)
    .filter(([rel, value]) => actual[rel] !== value)
    .map(([rel]) => rel);
}

function requiredJson(file, label) {
  if (!fs.existsSync(file)) throw new Error(`MOBILE_WEB_STAGE_BLOCKED: ${label} is missing.`);
  return JSON.parse(read(file));
}

function expectedOutputs() {
  assertMobileWebAuthorization(process.env.NAMEONMYMIND_MOBILE_WEB_PUBLISH_AUTHORIZED);
  const build = requiredJson(path.join(OUT, 'BUILD_MANIFEST.json'), 'BUILD_MANIFEST.json');
  const preview = requiredJson(path.join(OUT, 'RESEARCH_PREVIEW_MANIFEST.json'), 'RESEARCH_PREVIEW_MANIFEST.json');
  if (build.deployable !== true || build.external_publish_authorized !== true) {
    throw new Error('MOBILE_WEB_STAGE_BLOCKED: completed public build is not externally authorized.');
  }
  if (preview.preview_web_publish_authorized !== true || preview.product_release_authorized !== false) {
    throw new Error('MOBILE_WEB_STAGE_BLOCKED: completed research preview stage is invalid.');
  }
  if (!fs.existsSync(LEARNER_SOURCE)) throw new Error('Frozen learner prototype is missing.');
  if (!fs.existsSync(CARD_SOURCE)) throw new Error('Original card source is missing.');

  const learner = read(LEARNER_SOURCE);
  const card = read(CARD_SOURCE);
  const root = renderLearnerHtml(learner, { location: 'root' });
  const learn = renderLearnerHtml(learner, { location: 'learn' });
  const manifest = {
    schema_version: '1.0.0',
    artifact_type: 'MOBILE_PUBLIC_WEB_STAGE',
    no_login: true,
    no_install_required: true,
    requires_login: false,
    installation_required: false,
    physical_device_tested: false,
    entry_urls: {
      root: `${CANONICAL_ORIGIN}/`,
      learn: `${CANONICAL_ORIGIN}/learn/`,
      legacy_cards: `${CANONICAL_ORIGIN}/cards.html`,
    },
    source_sha256: {
      learner_prototype: sha256(learner),
      original_card_source: sha256(card),
    },
    output_sha256: {
      root_learner: sha256(root),
      learn_learner: sha256(learn),
      legacy_cards: sha256(card),
    },
  };
  return { root, learn, card, manifest };
}

function stage() {
  const outputs = expectedOutputs();
  fs.mkdirSync(path.join(OUT, 'learn'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), outputs.root);
  fs.writeFileSync(path.join(OUT, 'learn/index.html'), outputs.learn);
  fs.writeFileSync(path.join(OUT, 'cards.html'), outputs.card);
  fs.writeFileSync(path.join(OUT, MOBILE_MANIFEST), JSON.stringify(outputs.manifest, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'PASS', artifact: MOBILE_MANIFEST, entries: outputs.manifest.entry_urls }, null, 2));
}

function check() {
  const outputs = expectedOutputs();
  const files = {
    'index.html': outputs.root,
    'learn/index.html': outputs.learn,
    'cards.html': outputs.card,
    [MOBILE_MANIFEST]: JSON.stringify(outputs.manifest, null, 2) + '\n',
  };
  const actual = Object.fromEntries(Object.keys(files).map(rel => [
    rel,
    fs.existsSync(path.join(OUT, rel)) ? read(path.join(OUT, rel)) : undefined,
  ]));
  const stale = staleOutputPaths(actual, files);
  if (stale.length) throw new Error(`MOBILE_WEB_CHECK_FAILED: stale or missing output: ${stale.join(', ')}`);
  console.log(JSON.stringify({ status: 'PASS', check: true, entries: outputs.manifest.entry_urls }, null, 2));
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    process.argv.includes('--check') ? check() : stage();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
