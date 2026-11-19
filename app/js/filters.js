// Filters and search: one function turns the full trophy list plus the
// current filter state into the ordered list the checklist shows.
import { GRADE_ORDER } from './data-loader.js';

export function applyFilters(trophies, options, earned) {
  const query = (options.query || '').trim().toLowerCase();
  const kind = options.kind || 'all';
  const grade = options.grade || 'all';
  const difficulty = options.difficulty || 'all';
  const sort = options.sort || 'roadmap';

  let list = trophies.filter((t) => {
    if (kind === 'story' && t.kind !== 'story') return false;
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'collectible' && t.kind !== 'collectible') return false;
    if (kind === 'activity' && t.kind !== 'activity' && t.kind !== 'side') return false;
    if (kind === 'online') return false;
    if (kind === 'earned' && !earned.has(t.id)) return false;
    if (kind === 'remaining' && earned.has(t.id)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (difficulty !== 'all' && t.difficulty !== Number(difficulty)) return false;
    if (query) {
      const haystack = [t.name, t.description, t.guide, t.tip, (t.steps || []).join(' ')].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'grade') list.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
  else if (sort === 'difficulty') list.sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
  else list.sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return list;
}
