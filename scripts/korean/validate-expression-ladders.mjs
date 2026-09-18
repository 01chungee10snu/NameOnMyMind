#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (message) => { throw new Error(message); };

const schema = read('schema/korean-expression-ladder.schema.json');
const data = read('content/korean-expression/batches/01_everyday_expression_ladders.json');
const pool = read('content/korean-expression/candidate-pool.json');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(data)) fail(JSON.stringify(validate.errors));

if (data.track_id !== 'KOREAN_EXPRESSIVE_CHOICE') fail('track id mismatch');
if (data.lexemes.length !== 12) fail(`expected 12 lexemes, got ${data.lexemes.length}`);
if (data.ladders.length !== 6) fail(`expected 6 ladders, got ${data.ladders.length}`);

const ids = data.lexemes.map((x) => x.id);
if (new Set(ids).size !== ids.length) fail('duplicate lexeme id');

const expressions = data.lexemes.map((x) => x.expression);
if (new Set(expressions).size !== expressions.length) fail('duplicate lexeme expression');

const forbiddenFraming = ['사용을 금지한다', '쓰지 마', '쓰면 안 된다', '나쁜 말이다', '틀린 표현이다'];
const joined = JSON.stringify(data);
for (const phrase of forbiddenFraming) {
  if (joined.includes(phrase)) fail(`prohibitive/punitive framing detected: ${phrase}`);
}

for (const x of data.lexemes) {
  const u = new URL(x.source.url);
  if (!['krdict.korean.go.kr','www.korean.go.kr'].includes(u.hostname)) fail(`${x.id} uses non-NIKL source host ${u.hostname}`);
  if (!['LEXICAL_PASS','USAGE_PASS'].includes(x.status)) fail(`${x.id} is not source-verified`);
}

for (const ladder of data.ladders) {
  if (ladder.options.length < 3) fail(`${ladder.id} must offer at least 3 choices`);
  const optionNames = ladder.options.map((x) => x.expression);
  if (new Set(optionNames).size !== optionNames.length) fail(`${ladder.id} has duplicate options`);
}

if (pool.track_id !== data.track_id) fail('candidate pool track mismatch');
if (pool.candidates.length < 40) fail(`candidate pool too small: ${pool.candidates.length}`);
const verifiedPool = pool.candidates.filter((x) => x.status === 'SOURCE_VERIFIED').map((x) => x.expression).sort();
const batchExpressions = [...expressions].sort();
if (JSON.stringify(verifiedPool) !== JSON.stringify(batchExpressions)) fail('SOURCE_VERIFIED pool must match Batch 01 lexemes exactly');
if (pool.candidates.some((x) => !['SOURCE_VERIFIED','DISCOVERY_ONLY'].includes(x.status))) fail('invalid candidate-pool status');

const success = data.ladders.find((x) => x.id === 'KL005');
if (!success) fail('KL005 success-exclamation ladder missing');
for (const expected of ['됐다!','해냈다!','쾌재!']) {
  if (!success.options.some((x) => x.expression === expected)) fail(`KL005 missing ${expected}`);
}

const emphasis = data.ladders.find((x) => x.id === 'KL001');
if (!emphasis || !emphasis.common_expression.some((x) => x.includes('진짜'))) fail('KL001 must explicitly address 진짜');
const discomfort = data.ladders.find((x) => x.id === 'KL002');
if (!discomfort || !discomfort.common_expression.some((x) => x.includes('겁나'))) fail('KL002 must explicitly address 겁나');

console.log(JSON.stringify({
  status: 'PASS',
  track_id: data.track_id,
  lexeme_count: data.lexemes.length,
  ladder_count: data.ladders.length,
  candidate_pool_count: pool.candidates.length,
  lexical_pass: data.lexemes.filter((x) => x.status === 'LEXICAL_PASS').length,
  usage_pass: data.lexemes.filter((x) => x.status === 'USAGE_PASS').length,
  source_hosts: [...new Set(data.lexemes.map((x) => new URL(x.source.url).hostname))],
  examples: {
    emphasis: emphasis.options.map((x) => x.expression),
    success: success.options.map((x) => x.expression),
  },
}, null, 2));
