import { WORLD_HANJA, WORLD_HANJA_SOURCE } from '../domain/world-hanja-data.mjs';

const escapeText = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const rowKey = row => ({ worldId: row?.id || row?.world_id, term: row?.term });
const getEntry = row => {
  const { worldId, term } = rowKey(row);
  return typeof worldId === 'string' && typeof term === 'string' ? WORLD_HANJA.get(worldId, term) : null;
};

export function renderHanja(row) {
  const entry = getEntry(row);
  if (!entry) return '';
  const items = entry.characters.map(character => `<span class="world-hanja-item" style="display:inline-block;white-space:nowrap"><bdi lang="ko">${escapeText(character.display)}</bdi> <span class="world-hanja-hun">${escapeText(character.hun)}</span> <span class="world-hanja-eum">${escapeText(character.eum)}</span></span>`).join(' <span aria-hidden="true">·</span> ');
  const note = entry.note ? `<p class="hint" style="margin:6px 0 0">${escapeText(entry.note)}</p>` : '';
  return `<div class="world-hanja" lang="ko" aria-label="한국식 한자 음훈" style="margin-top:16px"><p class="hint world-hanja-label" style="margin:0 0 5px">한자 음훈 · 한국식</p><p class="world-hanja-list" style="margin:0;font-size:15px;line-height:1.9">${items}</p>${note}</div>`;
}

export function hanjaSources(row) {
  const entry = getEntry(row);
  if (!entry) return '';
  const links = entry.characters.flatMap(character => {
    const source = `<a href="${escapeText(character.source_url)}" target="_blank" rel="noopener noreferrer">${escapeText(character.hanja)} 한국어 한자 항목</a>`;
    const variant = character.variant_source_url ? ` · <a href="${escapeText(character.variant_source_url)}" target="_blank" rel="noopener noreferrer">간체 대응</a>` : '';
    return [`${source}${variant}`];
  }).join(' · ');
  return `<p class="dictionary-credit world-hanja-sources">한자 안내 출처: ${links} · <a href="${escapeText(WORLD_HANJA_SOURCE.license_url)}" target="_blank" rel="noopener noreferrer">${escapeText(WORLD_HANJA_SOURCE.license)}</a></p>`;
}
