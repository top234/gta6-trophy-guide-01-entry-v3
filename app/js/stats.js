// Stats: progress totals, time remaining, difficulty and time breakdowns,
// and the "Up next" recommendations (missable first, then quickest wins).
import { GRADE_ORDER } from './data-loader.js';

export function computeStats(trophies, earned) {
  const earnedCount = trophies.filter((t) => earned.has(t.id)).length;
  const pct = Math.round((earnedCount / trophies.length) * 100);
  const remainingMinutes = trophies
    .filter((t) => !earned.has(t.id))
    .reduce((sum, t) => sum + (t.timeMinutes || 0), 0);
  const hoursRemaining = remainingMinutes / 60;
  const missableLeft = trophies.filter((t) => t.missable && !earned.has(t.id));
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { total: 0, earned: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].earned += 1;
  }
  const byDifficulty = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const t of trophies) byDifficulty[t.difficulty] = (byDifficulty[t.difficulty] || 0) + 1;
  const timeByKind = {};
  for (const t of trophies) {
    if (earned.has(t.id)) continue;
    timeByKind[t.kind] = (timeByKind[t.kind] || 0) + (t.timeMinutes || 0);
  }
  return { earnedCount, total: trophies.length, pct, hoursRemaining, missableLeft, byGrade, byDifficulty, timeByKind };
}

export function formatHours(hours) {
  if (hours <= 0) return '0 h';
  if (hours < 1) return Math.round(hours * 60) + ' min';
  if (hours < 10) return (Math.round(hours * 2) / 2) + ' h';
  return '~' + Math.round(hours) + ' h';
}

// The next three trophies to chase: unearned missables first (they can lock
// out), then the shortest remaining ones, easiest first.
export function upNext(trophies, earned) {
  const remaining = trophies.filter((t) => !earned.has(t.id));
  const missable = remaining.filter((t) => t.missable)
    .sort((a, b) => (a.timeMinutes || 0) - (b.timeMinutes || 0));
  const rest = remaining.filter((t) => !t.missable)
    .sort((a, b) => (a.timeMinutes || 0) - (b.timeMinutes || 0) || a.difficulty - b.difficulty);
  const picks = [...missable, ...rest].slice(0, 3);
  return picks.map((t) => ({
    trophy: t,
    reason: t.missable
      ? 'Missable — earn it before the final mission: ' + t.ponr
      : 'Quick win — about ' + t.time + ', ' + t.difficultyLabel.toLowerCase() + ' difficulty.',
  }));
}

export function gradeKeysInOrder(byGrade) {
  return Object.keys(byGrade).sort((a, b) => GRADE_ORDER[a] - GRADE_ORDER[b]);
}
