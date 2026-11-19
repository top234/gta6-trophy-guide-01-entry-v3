// Rendering: builds the dashboard (ring, stats, banner, Up Next, charts),
// the trophy cards, the Collectibles hub and the Missable view from the
// trophy data and the tracker's earned set.
import { GRADE_LABELS, KIND_LABELS } from './data-loader.js';
import { computeStats, formatHours, upNext, gradeKeysInOrder } from './stats.js';

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function starsText(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function trophyGlyph(grade) {
  const colors = { platinum: '#b8ecff', gold: '#f5c542', silver: '#d7dde8', bronze: '#e0995c' };
  const color = colors[grade] || '#d7dde8';
  return '<svg class="trophy-glyph" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M14 6h20v10a10 10 0 0 1-20 0V6z" fill="' + color + '"/>' +
    '<path d="M14 8H8a2 2 0 0 0 2 8h4M34 8h6a2 2 0 0 1-2 8h-4" fill="none" stroke="' + color + '" stroke-width="2.5"/>' +
    '<rect x="21" y="26" width="6" height="8" fill="' + color + '"/>' +
    '<rect x="14" y="36" width="20" height="5" rx="2" fill="' + color + '"/></svg>';
}

const RING_CIRCUMFERENCE = 527.8;

export function renderDashboard(trophies, earned) {
  const stats = computeStats(trophies, earned);
  document.getElementById('ringCount').textContent = stats.earnedCount + ' / ' + stats.total;
  document.getElementById('ringPct').textContent = stats.pct + '%';
  document.getElementById('ringFg').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - stats.pct / 100));
  document.getElementById('statEarned').textContent = stats.earnedCount;
  document.getElementById('statHours').textContent = formatHours(stats.hoursRemaining);
  document.getElementById('statMissable').textContent =
    stats.missableLeft.length === 0 ? '0 — all safe' : stats.missableLeft.length + ' at risk';
  document.getElementById('navMissable').textContent = String(stats.missableLeft.length);

  const banner = document.getElementById('missableBanner');
  if (stats.missableLeft.length === 0) {
    banner.className = 'banner ok';
    banner.innerHTML = '<strong>All missable trophies secured.</strong> Nothing can lock you out now — finish the story and enjoy the cleanup.';
  } else {
    banner.className = 'banner warn';
    banner.innerHTML = '<strong>Missable alert: ' + stats.missableLeft.length + ' trophies still at risk.</strong> Earn them before the final mission:' +
      '<ul>' + stats.missableLeft.map((t) => '<li><strong>' + escapeHtml(t.name) + '</strong> — ' + escapeHtml(t.ponr.replace(/^Before the final mission — /, '')) + '</li>').join('') + '</ul>';
  }

  const picks = upNext(trophies, earned);
  document.getElementById('upNextList').innerHTML = picks.length
    ? picks.map((p) => '<li><span class="up-name">' + escapeHtml(p.trophy.name) + '</span>' +
      '<span class="up-reason">' + escapeHtml(p.reason) + '</span>' +
      '<span class="up-meta">' + GRADE_LABELS[p.trophy.grade] + ' · ' + escapeHtml(p.trophy.time) + ' · Roadmap stage ' + p.trophy.stage + '</span></li>').join('')
    : '<li><span class="up-name">Platinum earned!</span><span class="up-reason">Every trophy is checked off. You are a Leonida Legend.</span></li>';

  const maxDiff = Math.max(...Object.values(stats.byDifficulty), 1);
  const diffLabels = { 1: '1★ Easy', 2: '2★ Moderate', 3: '3★ Hard', 4: '4★ Very Hard', 5: '5★ Extreme' };
  document.getElementById('diffChart').innerHTML = [1, 2, 3, 4, 5].map((d) =>
    '<div class="bar-row"><span>' + diffLabels[d] + '</span>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round((stats.byDifficulty[d] / maxDiff) * 100) + '%"></div></div>' +
    '<span class="bar-count">' + stats.byDifficulty[d] + '</span></div>').join('');

  const kindOrder = ['story', 'collectible', 'activity', 'side', 'exploration'];
  const timeRows = kindOrder.filter((k) => stats.timeByKind[k]).map((k) =>
    '<div class="ts-row"><span>' + escapeHtml(KIND_LABELS[k]) + '</span><span>' + formatHours(stats.timeByKind[k] / 60) + ' left</span></div>').join('');
  document.getElementById('timeSplit').innerHTML = '<div class="ts-row"><strong>Time left by kind</strong><span></span></div>' + timeRows +
    '<div class="ts-row ts-total"><span>Total remaining</span><span>' + formatHours(stats.hoursRemaining) + '</span></div>';

  document.getElementById('gradeBars').innerHTML = gradeKeysInOrder(stats.byGrade).map((g) => {
    const b = stats.byGrade[g];
    const pct = Math.round((b.earned / b.total) * 100);
    return '<div class="grade-row"><span class="badge ' + g + '">' + GRADE_LABELS[g] + '</span>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span><strong>' + b.earned + ' / ' + b.total + '</strong></span></div>';
  }).join('');
}

function cardElement(trophy, earned, spoilerOn, onToggle, onOpen) {
  const isEarned = earned.has(trophy.id);
  const hidden = spoilerOn && trophy.kind === 'story' && !isEarned && trophy.id !== 1;
  const card = document.createElement('article');
  card.className = 'card' + (isEarned ? ' earned' : '') + (trophy.missable ? ' missable' : '');
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', hidden ? 'Hidden story trophy' : trophy.name);
  const nameHtml = hidden
    ? '<span class="spoiler-hidden">Hidden story trophy — earn it to reveal</span>'
    : escapeHtml(trophy.name);
  const descHtml = hidden
    ? '<span class="spoiler-hidden">Hidden until earned (spoiler setting is on).</span>'
    : escapeHtml(trophy.description);
  const guideText = hidden ? 'Guide hidden until earned.' : trophy.guide;
  card.innerHTML =
    '<div class="card-head">' + trophyGlyph(trophy.grade) +
    '<div><h3 class="card-name">' + nameHtml + '</h3>' +
    '<p class="card-desc">' + descHtml + '</p></div></div>' +
    '<div class="badges"><span class="badge ' + trophy.grade + '">' + GRADE_LABELS[trophy.grade] + '</span>' +
    (trophy.missable ? '<span class="badge missable-badge">Missable</span>' : '') +
    (trophy.hidden ? '<span class="badge hidden-badge">Hidden on PSN</span>' : '') + '</div>' +
    '<div class="meta-line"><span><span class="stars">' + starsText(trophy.difficulty) + '</span> ' + escapeHtml(trophy.difficultyLabel) + '</span>' +
    '<span>Time: ' + escapeHtml(trophy.time) + '</span>' +
    '<span>' + escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind) + ' · Stage ' + trophy.stage + '</span></div>' +
    '<p class="guide-preview"><strong>Guide:</strong> ' + escapeHtml(guideText) + '</p>' +
    '<div class="card-foot"><label class="check"><input type="checkbox" ' + (isEarned ? 'checked' : '') + '> Earned</label>' +
    '<span class="open-hint">Full steps &amp; sources →</span></div>';
  card.querySelector('input[type="checkbox"]').addEventListener('click', (event) => {
    event.stopPropagation();
    onToggle(trophy.id);
  });
  card.addEventListener('click', () => onOpen(trophy));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') onOpen(trophy);
  });
  return card;
}

export function renderCards(container, list, earned, spoilerOn, onToggle, onOpen) {
  container.innerHTML = '';
  for (const t of list) container.appendChild(cardElement(t, earned, spoilerOn, onToggle, onOpen));
  document.getElementById('emptyState').hidden = list.length !== 0;
}

export function renderMissable(container, trophies, earned, onToggle, onOpen) {
  const list = trophies.filter((t) => t.missable).sort((a, b) => a.stage - b.stage || a.id - b.id);
  renderCards(container, list, earned, false, onToggle, onOpen);
}

const COLLECTIBLE_SETS = [
  { name: 'Stunts', count: '250', unit: 'stunts', text: 'Jumps, near-misses and airtime, counted as you drive.', trophyIds: [15] },
  { name: 'Shooting Range challenges', count: '42', unit: 'challenges', text: 'Every challenge needs a gold medal — the hardest skill trophy here.', trophyIds: [17] },
  { name: 'Top Fun Drone Races', count: '14', unit: 'locations', text: 'Win a drone race at every location.', trophyIds: [18] },
  { name: 'Races', count: '20', unit: 'different wins', text: 'Win 20 different races — re-wins do not count.', trophyIds: [19] },
  { name: 'Stranger strands', count: '8', unit: 'strands', text: 'Complete eight mission strands for strangers across Leonida.', trophyIds: [25] },
  { name: 'Meditation spots', count: '18', unit: 'spots', text: 'Quiet scenic points across Leonida — sit, meditate, move on.', trophyIds: [28] },
  { name: 'Collectible Card sets', count: '3', unit: 'sets', text: 'Cards hide in shops, bars, houses and odd corners. Grab them as you go.', trophyIds: [30] },
  { name: 'WAiNK It locations', count: '100', unit: 'locations', text: 'Snap a photo at 100 different locations with the in-world app.', trophyIds: [31] },
  { name: 'Challenges', count: '50', unit: 'challenges', text: 'Rotating feats across driving, shooting, flying and stranger tasks.', trophyIds: [32] },
  { name: 'Vehicles discovered', count: '100', unit: 'vehicles', text: 'Sit in 100 different vehicles — cars, bikes, boats, planes and more.', trophyIds: [35] },
  { name: 'Bank Vaults', count: '5', unit: 'vaults', text: 'Rob five bank vaults and escape after each one.', trophyIds: [40] },
  { name: 'Areas of Leonida', count: '52', unit: 'areas', text: 'Explore every area — count per the trophy-tracking lists (Exophase / PSNProfiles).', trophyIds: [42] },
  { name: 'Gang operations', count: '9', unit: 'gangs', text: 'Rob an illegal operation of each gang — count per the trophy-tracking lists.', trophyIds: [43] },
  { name: 'Garage properties', count: '8', unit: 'garages', text: 'Buy all garage properties — count per the trophy-tracking lists.', trophyIds: [54] },
  { name: 'Scooter Bros registrations', count: '10', unit: 'vehicles', text: 'Register ten vehicles to the Scooter Bros app.', trophyIds: [55] },
];

export function renderCollectibles(container, trophies, onJumpToTrophy) {
  container.innerHTML = '';
  for (const set of COLLECTIBLE_SETS) {
    const names = set.trophyIds.map((id) => {
      const t = trophies.find((x) => x.id === id);
      return t ? t.name : '';
    }).filter(Boolean).join(', ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'set';
    button.innerHTML = '<div class="set-count">' + escapeHtml(set.count) + '</div>' +
      '<div class="set-name">' + escapeHtml(set.name) + ' <span style="font-weight:400;color:var(--muted);font-size:1rem;">(' + escapeHtml(set.unit) + ')</span></div>' +
      '<p>' + escapeHtml(set.text) + '</p>' +
      '<div class="set-trophies">Trophy: ' + escapeHtml(names) + ' →</div>';
    button.addEventListener('click', () => onJumpToTrophy(set.trophyIds[0]));
    container.appendChild(button);
  }
}
