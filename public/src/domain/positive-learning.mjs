// Display priority is editorial, not a diagnosis or a classification of a user's feelings.
const KE = /^KE\d{4}$/;
const AX = /^AX\d{4}$/;
const WC = /^WC\d{2}$/;
const hosts = new Set(['krdict.korean.go.kr','stdict.korean.go.kr','ko.wiktionary.org',
  'dicionario.priberam.org','www.wales.com','www.duden.de','kotobank.jp','zdic.net','creativecommons.org']);
const fail = message => { throw new Error('Invalid positive learning policy: ' + message); };
const text = (v, max = 1000) => typeof v === 'string' && !!v.trim() && v.length <= max;
export function safeLearningSource(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && hosts.has(u.hostname)
      && ![...u.searchParams.keys()].some(k => /^(key|api[_-]?key|access[_-]?token|token|secret|authorization|auth|password)$/i.test(k));
  } catch { return false; }
}
const checkSource = value => { if (!safeLearningSource(value)) fail('source URL'); };
function day(stamp) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp || '')) fail('invalid date');
  const [y,m,d] = stamp.split('-').map(Number), value = Date.UTC(y,m-1,d);
  if (new Date(value).toISOString().slice(0,10) !== stamp) fail('invalid date');
  return value / 86400000;
}
function localDay(now) {
  const d = new Date(now);
  if (!Number.isFinite(d.getTime())) fail('invalid date');
  return day(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
}
function freeze(v) {
  if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); }
  return v;
}
const unique = values => new Set(values).size === values.length;
const labelFor = r => r?.kind === 'LEXICAL_ANTONYM' ? '반대말' : r?.kind === 'CONTEXTUAL_CONTRAST' ? '대비되는 마음' : '찾아본 말';

export function createPositiveLearningModel(inputVocabulary, inputPolicy, inputWorld) {
  // Own immutable copies: caller mutations cannot silently change the daily policy.
  const vocabulary = freeze(structuredClone(inputVocabulary));
  const policy = freeze(structuredClone(inputPolicy));
  const world = freeze(structuredClone(inputWorld));
  if (vocabulary?.term_count !== 177 || vocabulary.entries?.length !== 177) fail('vocabulary count');
  const all = new Map();
  for (const row of vocabulary.entries) {
    if (!KE.test(row?.id || '') || all.has(row.id) || !text(row.expression,50)
      || !text(row.meaning,100) || !text(row.example,150) || row.status !== 'SOURCE_VERIFIED') fail('vocabulary entry');
    if (row.source_url) checkSource(row.source_url);
    all.set(row.id,row);
  }
  if (!unique([...all.values()].map(e=>e.expression))) fail('duplicate expression');
  if (policy?.schema_version !== '1.0.0' || !text(policy.version) || policy.positive_count !== 61
    || policy.focus_entries?.length !== 61 || !text(policy.emotion_note)) fail('focus count');
  const focus = new Map();
  for (const row of policy.focus_entries) {
    if (!KE.test(row?.id || '') || focus.has(row.id) || row.expression !== all.get(row.id)?.expression
      || !Number.isInteger(row.group) || row.group < 1 || row.group > 5
      || !Array.isArray(row.related_ids) || row.related_ids.length !== 2 || !unique(row.related_ids)
      || row.related_ids.includes(row.id)) fail('focus identity');
    focus.set(row.id,row);
  }
  for (const row of focus.values()) if (row.related_ids.some(id=>!focus.has(id))) fail('non-positive related word');
  if (!focus.has(policy.default_id)) fail('default outside focus');
  if (!Array.isArray(policy.daily_ids) || policy.daily_ids.length !== focus.size || !unique(policy.daily_ids)
    || policy.daily_ids.some(id=>!focus.has(id)) || policy.daily_ids[0] !== policy.default_id) fail('daily IDs');
  const effective = day(policy.effective_date), dailyIds = policy.daily_ids;
  if (policy.comparison_only_entries?.length !== 3) fail('comparison entry count');
  for (const row of policy.comparison_only_entries) {
    if (!AX.test(row?.id || '') || all.has(row.id) || !text(row.expression,50) || !text(row.meaning,100)
      || !text(row.example,150) || row.role !== 'COMPARISON_ONLY') fail('comparison entry');
    checkSource(row.source_url); all.set(row.id,row);
  }
  if (!unique([...all.values()].map(e=>e.expression))) fail('duplicate comparison expression');
  const byFocus = new Map(), byTarget = new Map(), pairs = new Set();
  if (!Array.isArray(policy.relations)) fail('relations');
  for (const r of policy.relations) {
    if (!focus.has(r?.focus_id) || !all.has(r.target_id) || focus.has(r.target_id)
      || !['LEXICAL_ANTONYM','CONTEXTUAL_CONTRAST'].includes(r.kind)) fail('relationship identity');
    const pair = `${r.focus_id}:${r.target_id}`;
    if (pairs.has(pair)) fail('duplicate relationship');
    pairs.add(pair);
    if (r.kind === 'LEXICAL_ANTONYM') {
      checkSource(r.source_url);
      const u = new URL(r.source_url);
      if (u.hostname !== 'ko.wiktionary.org' || u.pathname !== '/w/index.php'
        || !/^\d+$/.test(u.searchParams.get('oldid') || '') || !text(r.source_locator) || !text(r.checked_at)) fail('antonym evidence');
    } else {
      if (!text(r.note) || r.basis !== 'EDITORIAL_COMPARISON_OF_EXISTING_MEANINGS'
        || !Array.isArray(r.source_urls) || !r.source_urls.length) fail('context evidence');
      r.source_urls.forEach(checkSource);
    }
    if (!byFocus.has(r.focus_id)) byFocus.set(r.focus_id,[]);
    if (!byTarget.has(r.target_id)) byTarget.set(r.target_id,[]);
    byFocus.get(r.focus_id).push(r); byTarget.get(r.target_id).push(r);
  }
  const lexicalFirst = (a,b) => Number(a.kind !== 'LEXICAL_ANTONYM')-Number(b.kind !== 'LEXICAL_ANTONYM');
  for (const rows of [...byFocus.values(),...byTarget.values()]) rows.sort(lexicalFirst);
  if (world !== null && world?.entries?.length !== 7) fail('world count');
  const worlds = new Map();
  for (const w of world?.entries || []) {
    if (!WC.test(w?.id || '') || worlds.has(w.id) || !text(w.term,60) || !text(w.meaning)
      || !Array.isArray(w.anchors) || !w.anchors.length || w.anchors.some(a=>!text(a))
      || w.relation !== 'PARTIAL_CONTEXT_OVERLAP') fail('world entry');
    checkSource(w.source_url); worlds.set(w.id,w);
  }
  const primary = policy.primary_world_ids, secondary = policy.secondary_world_ids;
  if (!Array.isArray(primary) || !Array.isArray(secondary) || primary.length+secondary.length !== 7
    || !unique([...primary,...secondary]) || [...primary,...secondary].some(id=>!/^WC0[1-7]$/.test(id))) fail('world groups');
  checkSource(policy.relation_license_url);
  const matchWorld = (ids, expression) => ids.map(id=>worlds.get(id)).find(w=>w?.anchors.includes(expression)) || null;
  const daily = (now = new Date()) => {
    const offset = Math.max(0,localDay(now)-effective);
    return all.get(dailyIds[offset % dailyIds.length]);
  };
  const select = (hash = '', now = new Date()) => {
    const id = String(hash).replace(/^#/, '');
    let hero = daily(now), requested = null, requestedWorld = null;
    if (focus.has(id)) hero = all.get(id);
    else if (all.has(id)) {
      requested = all.get(id);
      const relation = byTarget.get(id)?.[0];
      if (relation) hero = all.get(relation.focus_id);
    } else if (worlds.has(id)) {
      requestedWorld = worlds.get(id);
      const positiveAnchor = policy.focus_entries.find(f=>requestedWorld.anchors.includes(f.expression));
      if (positiveAnchor) hero = all.get(positiveAnchor.id);
    }
    const relation = requested ? byTarget.get(requested.id)?.find(r=>r.focus_id === hero.id) || null
      : requestedWorld ? null : byFocus.get(hero.id)?.[0] || null;
    const comparison = requested || (relation ? all.get(relation.target_id) : null);
    const primaryWorld = requestedWorld && primary.includes(requestedWorld.id)
      ? requestedWorld : matchWorld(primary,hero.expression);
    let secondaryWorld = requestedWorld && secondary.includes(requestedWorld.id) ? requestedWorld
      : requested ? matchWorld(secondary,requested.expression) : matchWorld(secondary,hero.expression);
    if (requestedWorld && primary.includes(requestedWorld.id)) secondaryWorld = null;
    return freeze({ hero, focus:focus.get(hero.id), requested, requestedWorld, comparison, relation,
      comparison_label:comparison ? labelFor(relation) : null,
      primaryWorld, secondaryWorld, world:requestedWorld || primaryWorld,
      openComparison:!!requested || !!(requestedWorld && secondary.includes(requestedWorld.id)) });
  };
  const search = query => {
    const q = String(query || '').normalize('NFC').trim().toLocaleLowerCase();
    if (!q || q.length > 80) return [];
    const matches = row=>row.expression.toLocaleLowerCase().includes(q) || row.meaning.toLocaleLowerCase().includes(q);
    const sort = (a,b)=>Number(b.expression.toLocaleLowerCase()===q)-Number(a.expression.toLocaleLowerCase()===q);
    const positives = [...focus.keys()].map(id=>all.get(id)).filter(matches).sort(sort);
    const comparisons = [...all.values()].filter(r=>!focus.has(r.id)&&matches(r)).sort(sort);
    return freeze([...positives.map(term=>({type:'positive',term})),
      ...comparisons.map(term=>({type:'comparison',term,label:byTarget.has(term.id)?labelFor(byTarget.get(term.id)[0]):'다른 마음'})),
      ...[...worlds.values()].filter(w=>w.term.toLocaleLowerCase().includes(q)).map(world=>({type:'world',world}))]);
  };
  return Object.freeze({daily,select,search,focusIds:()=>[...focus.keys()],
    next:(id)=>all.get(dailyIds[(dailyIds.indexOf(id)+1)%dailyIds.length]),
    isPositive:id=>focus.has(id)});
}
