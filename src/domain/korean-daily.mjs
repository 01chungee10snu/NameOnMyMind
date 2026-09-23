export function localDateStamp(now = new Date()) {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectEffectiveKoreanDailyPool(registry, now = new Date()) {
  if (!Array.isArray(registry?.pools)) return null;
  const localDate = localDateStamp(now);
  const eligible = registry.pools
    .filter((row) =>
      row &&
      typeof row.pool_id === 'string' &&
      typeof row.path === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(row.effective_date || '') &&
      row.effective_date <= localDate
    )
    .sort((a, b) =>
      a.effective_date.localeCompare(b.effective_date, 'en') ||
      Number(a.version_order || 0) - Number(b.version_order || 0)
    );
  return eligible.at(-1) || null;
}

export function resolveKoreanDailyVerifiedTerm(data, pool, now = new Date()) {
  if (!Array.isArray(data?.terms)) return null;
  const termsById = new Map(data.terms.map((term) => [term.id, term]));
  const lockedIds = Array.isArray(pool?.term_ids) && pool.term_ids.length
    ? pool.term_ids
    : data.terms.filter((term) => term.status === 'SOURCE_VERIFIED').map((term) => term.id).sort();
  const verified = lockedIds
    .map((id) => termsById.get(id))
    .filter((term) => term?.status === 'SOURCE_VERIFIED');
  if (!verified.length) return null;
  const localDayKey = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return verified[localDayKey % verified.length];
}
