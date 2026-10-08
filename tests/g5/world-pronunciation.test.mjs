import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WORLD_PRONUNCIATION_SOURCE, WORLD_PRONUNCIATIONS } from '../../src/domain/world-pronunciation-data.mjs';
import { worldMarkup, worldSourceMarkup } from '../../src/ui/learning-dictionary.mjs';

const root = new URL('../../', import.meta.url);
const world = JSON.parse(fs.readFileSync(new URL('content/korean-expression/world-contexts-v1.json', root), 'utf8'));
const authored = JSON.parse(fs.readFileSync(new URL('content/korean-expression/world-pronunciations-v1.json', root), 'utf8'));

test('V25 pronunciation source is an exact seven-record projection with allowlisted locale data', () => {
  assert.equal(WORLD_PRONUNCIATION_SOURCE.version, authored.version);
  assert.deepEqual(WORLD_PRONUNCIATION_SOURCE.entries, authored.entries);
  assert.deepEqual([...WORLD_PRONUNCIATIONS.keys()], ['WC01', 'WC02', 'WC03', 'WC04', 'WC05', 'WC06', 'WC07']);
  for (const entry of authored.entries) {
    assert.ok(entry.voice_locales.length > 0);
    assert.ok(entry.source_url.startsWith('https://'));
    assert.match(entry.source_url, /^https:\/\/(en|de)\.wiktionary\.org\/|^https:\/\/creativecommons\.org\//);
    assert.ok(entry.speech_text && !entry.speech_text.includes(' '));
  }
});

test('world context renders readable IPA, guide, click-only allowlist buttons and attribution', () => {
  const markup = worldMarkup(world, '그립다');
  const sourceMarkup = worldSourceMarkup(world, '그립다');
  assert.match(markup, /\/sawˈda\.d͡ʒi\//);
  assert.match(markup, /사우다지/);
  assert.match(markup, /data-pronunciation-id="WC01"/g);
  assert.match(markup, /듣기/);
  assert.match(markup, /천천히/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(sourceMarkup, /온라인 음성은 기기 제공자의 서버를 사용할 수 있어요/);
  assert.match(sourceMarkup, /Wiktionary/);
  assert.doesNotMatch(markup, /speechSynthesis|searchInput|textContent/);
});
