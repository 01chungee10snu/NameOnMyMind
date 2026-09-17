import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

test('public build separates content snapshot from runtime/UI snapshot', () => {
  const build = readJson('public/BUILD_MANIFEST.json');
  const contentInputs = Object.entries(build.input_sha256)
    .filter(([key]) => !key.startsWith('runtime_'))
    .sort(([a], [b]) => a.localeCompare(b));
  const seed = contentInputs.map(([key, value]) => `${key}:${value}`).join('|');
  const expected = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
  const baseline = readJson('content/approved/public-content-baseline.json');
  assert.equal(build.content_snapshot_version, expected);
  assert.equal(build.content_snapshot_version, baseline.content_snapshot_version);
  assert.equal(baseline.approval_record, 'content/approved/illustration-background-release-20260917.json');
  assert.notEqual(build.snapshot_version, build.content_snapshot_version);
});
