import { localDateStamp } from './korean-daily.mjs';

export function validateLearningVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary?.entries) || vocabulary.term_count !== vocabulary.entries.length) throw new Error('Learning vocabulary count mismatch');
  const byId = new Map();
  const expressions = new Set();
  for (const row of vocabulary.entries) {
    if (!/^KE\d{4}$/.test(row.id || '') || byId.has(row.id) || expressions.has(row.expression)) throw new Error('Duplicate or invalid learning identity');
    if (row.status !== 'SOURCE_VERIFIED' || !row.expression?.trim() || !row.meaning?.trim() || !row.example?.trim()) throw new Error('Incomplete learning entry');
    if (row.meaning.length > 64 || row.example.length > 90) throw new Error('Learning copy too long');
    byId.set(row.id, row); expressions.add(row.expression);
  }
  for (const row of byId.values()) {
    if (!Array.isArray(row.related_ids) || row.related_ids.length !== 2 || new Set(row.related_ids).size !== 2 || row.related_ids.some(id => id === row.id || !byId.has(id))) throw new Error('Invalid comparison pair');
  }
  return byId;
}

function calendarDay(stamp) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp || '')) throw new Error('Invalid date stamp');
  const [year, month, day] = stamp.split('-').map(Number);
  const ms = Date.UTC(year, month - 1, day);
  if (new Date(ms).toISOString().slice(0, 10) !== stamp) throw new Error('Invalid calendar date');
  return ms / 86400000;
}

export function resolveExpandedLearningDaily(vocabulary, schedule, legacyDaily, now = new Date()) {
  const byId = validateLearningVocabulary(vocabulary);
  if (schedule?.vocabulary_id !== vocabulary.vocabulary_id || schedule?.algorithm !== 'LOCAL_CALENDAR_CYCLE_V1') throw new Error('Learning schedule mismatch');
  const ids = schedule.term_ids;
  if (!Array.isArray(ids) || ids.length !== byId.size || schedule.term_count !== ids.length || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) throw new Error('Invalid learning schedule IDs');
  const offset = calendarDay(localDateStamp(now)) - calendarDay(schedule.effective_date);
  // Earlier days retain the already-published assignment; future days advance
  // by actual calendar days, including month/year/leap-day boundaries.
  if (offset < 0) {
    if (!byId.has(legacyDaily?.id)) throw new Error('Legacy daily term missing');
    return byId.get(legacyDaily.id);
  }
  return byId.get(ids[offset % ids.length]);
}
