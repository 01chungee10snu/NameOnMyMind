#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');
const snapshotPath = path.join(ROOT, 'content/korean-expression/evidence/contrast-source-v2.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const evidenceByTerm = new Map(snapshot.entries.map((x) => [x.term, x]));

const canonicalAliases = new Map([['샘나다', '샘내다']]);

for (const term of map.terms) {
  const canonical = canonicalAliases.get(term.expression);
  if (canonical) term.expression = canonical;
}

for (const set of map.contrast_sets) {
  set.terms = set.terms.map((term) => canonicalAliases.get(term) || term);
  for (const cue of set.choice_cues) cue.expression = canonicalAliases.get(cue.expression) || cue.expression;
}

const targetSetIds = new Set(['KC005','KC006','KC008','KC010','KC011','KC012','KC013','KC015','KC016']);
const targetTerms = new Set(map.contrast_sets.filter((x) => targetSetIds.has(x.id)).flatMap((x) => x.terms));
for (const expression of targetTerms) {
  const term = map.terms.find((x) => x.expression === expression);
  if (!term) throw new Error(`missing term: ${expression}`);
  const evidence = evidenceByTerm.get(expression);
  if (!evidence) throw new Error(`missing evidence snapshot: ${expression}`);
  term.status = 'SOURCE_VERIFIED';
  term.evidence_ref = evidence.evidence_ref;
  term.note = evidence.source_type === 'official_dictionary'
    ? '2026-09-21 국립국어원 한국어기초사전의 표제어·뜻풀이를 직접 확인한 표현.'
    : '기존 NameOnMyMind source-first 연구기록에서 표제어·의미 경계를 확인한 표현.';
}

const contrastUpdates = {
  KC005: {
    title: '허전하다 · 외롭다 · 쓸쓸하다',
    cues: {
      '허전하다': '의지할 곳이 없어지거나 무언가를 잃은 듯 빈 느낌이 들 때.',
      '외롭다': '혼자가 되거나 의지할 데가 없다고 느껴 쓸쓸할 때.',
      '쓸쓸하다': '마음에 외로움과 허전함이 함께 겹쳐 있을 때.'
    },
    prompt: '무언가 사라진 빈자리가 큰가, 혼자라 의지할 데 없는가, 아니면 외로움과 허전함이 함께 겹치는가?'
  },
  KC006: {
    title: '속상하다 · 안타깝다 · 서럽다',
    cues: {
      '속상하다': '일이 뜻대로 되지 않아 마음이 편하지 않고 괴로울 때.',
      '안타깝다': '뜻대로 되지 않거나 누군가가 가엾어 가슴이 아프고 답답할 때.',
      '서럽다': '억울함과 슬픔이 함께 들어 마음이 아플 때.'
    },
    prompt: '내 일이 뜻대로 되지 않아 괴로운가, 안타깝고 답답한가, 아니면 억울함과 슬픔이 함께 드는가?'
  },
  KC008: {
    title: '화나다 · 분하다 · 억울하다 · 원망스럽다',
    cues: {
      '화나다': '몹시 언짢거나 못마땅해서 기분이 나빠졌을 때.',
      '분하다': '억울한 일을 당했거나 될 듯한 일이 되지 않아 매우 화가 날 때.',
      '억울하다': '내 잘못이 아닌데 피해·비난·불이익을 받았다고 느낄 때.',
      '원망스럽다': '마음에 들지 않는 결과 때문에 특정 사람이나 대상을 탓하거나 미워하는 마음이 들 때.'
    },
    prompt: '못마땅해 화가 난 건가, 결과가 분한가, 부당한 피해가 억울한가, 아니면 누군가를 탓하고 싶은가?'
  },
  KC010: {
    title: '실망하다 · 허탈하다 · 허무하다 · 씁쓸하다',
    cues: {
      '실망하다': '기대하던 대로 되지 않아 희망을 잃거나 마음이 크게 상했을 때.',
      '허탈하다': '힘이 빠지고 정신이 멍해질 만큼 맥이 풀렸을 때.',
      '허무하다': '가치나 의미가 없게 느껴져 허전하고 쓸쓸할 때.',
      '씁쓸하다': '싫거나 언짢은 기분이 조금 남아 마음이 개운하지 않을 때.'
    },
    prompt: '기대가 깨져 실망했나, 맥이 풀려 멍한가, 의미가 사라진 듯 허무한가, 아니면 언짢은 뒷맛이 남았나?'
  },
  KC011: {
    title: '설레다 · 기대되다 · 들뜨다',
    cues: {
      '설레다': '마음이 차분하지 않고 들떠 두근거릴 때.',
      '기대되다': '어떤 일이 이루어지기를 바라며 기다리게 될 때.',
      '들뜨다': '마음이 안정되지 않고 조금 흥분돼 평소보다 차분하기 어려울 때.'
    },
    prompt: '두근거림이 큰가, 이루어지길 바라며 기다리는가, 아니면 흥분돼 마음이 붕 뜬 듯한가?'
  },
  KC012: {
    title: '안심되다 · 후련하다 · 홀가분하다',
    cues: {
      '안심되다': '걱정이 없어지고 마음이 편해졌을 때.',
      '후련하다': '답답하게 맺혀 있던 일이 풀려 속이 시원하고 가벼워졌을 때.',
      '홀가분하다': '신경 쓰이거나 부담스럽던 것이 줄어 가볍고 편안해졌을 때.'
    },
    prompt: '걱정이 사라져 마음이 놓였나, 맺힌 것이 풀렸나, 아니면 신경 쓰이던 부담에서 가벼워졌나?'
  },
  KC013: {
    title: '부럽다 · 샘내다 · 질투하다 · 선망하다',
    cues: {
      '부럽다': '다른 사람의 좋은 일이나 물건을 보고 나도 이루거나 갖고 싶을 때.',
      '샘내다': '남의 것을 탐내거나 나보다 형편이 나은 사람을 부러워하면서 싫은 마음까지 들 때.',
      '질투하다': '소중한 관계를 빼앗길까 미워지거나, 다른 사람의 좋은 처지를 괜히 미워하고 싫어할 때.',
      '선망하다': '누군가를 부러워하면서 나도 그렇게 되기를 바랄 때.'
    },
    prompt: '나도 갖고 싶은가, 부러움에 싫은 마음까지 섞였나, 관계나 비교 때문에 미워지는가, 아니면 닮고 싶은 마음이 큰가?'
  },
  KC015: {
    title: '착잡하다 · 시원섭섭하다 · 심란하다',
    cues: {
      '착잡하다': '여러 생각과 감정이 뒤섞여 마음이 복잡하고 갈피를 잡기 어려울 때.',
      '시원섭섭하다': '끝나서 후련하면서도 서운하고 아쉬운 마음이 동시에 들 때.',
      '심란하다': '마음이 편안하지 못하고 어지러워 안정되기 어려울 때.'
    },
    prompt: '여러 감정이 뒤섞여 복잡한가, 후련함과 아쉬움이 동시에 있나, 아니면 마음이 어지럽고 편치 않은가?'
  },
  KC016: {
    title: '그립다 · 아련하다 · 애틋하다',
    cues: {
      '그립다': '사람·장소·시간을 다시 보고 싶고 만나고 싶은 마음이 클 때.',
      '아련하다': '기억이나 생각이 또렷하지 않고 희미하게 떠오를 때.',
      '애틋하다': '누군가를 깊이 아끼고 위하는 정이 크고, 때로 안타까움이나 애타는 마음도 함께 들 때.'
    },
    prompt: '다시 보고 싶은 마음이 큰가, 희미한 기억이 떠오르는가, 아니면 깊이 아끼는 정과 안타까움이 함께 있는가?'
  }
};

for (const set of map.contrast_sets) {
  if (!targetSetIds.has(set.id)) continue;
  const update = contrastUpdates[set.id];
  if (!update) throw new Error(`missing contrast update: ${set.id}`);
  set.title = update.title;
  for (const cue of set.choice_cues) {
    if (!update.cues[cue.expression]) throw new Error(`missing cue update: ${set.id}/${cue.expression}`);
    cue.cue = update.cues[cue.expression];
  }
  set.reflection_prompt = update.prompt;
  set.status = 'SOURCE_VERIFIED';
}

const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));
for (const evidence of snapshot.entries) {
  if (registryMap.has(evidence.evidence_ref)) continue;
  const entry = {
    evidence_ref: evidence.evidence_ref,
    source_type: evidence.source_type,
    path: evidence.source_type === 'local_research_record' ? evidence.path : null,
    url: evidence.source_type === 'official_dictionary' ? evidence.url : null
  };
  registry.entries.push(entry);
  registryMap.set(entry.evidence_ref, entry);
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'PASS',
  promoted_set_ids: [...targetSetIds],
  promoted_term_count: targetTerms.size,
  canonicalized: { from: '샘나다', to: '샘내다' },
  registry_count: registry.entries.length,
  snapshot_id: snapshot.snapshot_id
}, null, 2));
