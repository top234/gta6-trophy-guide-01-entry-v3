// Trophy detail drawer: the slide-over panel that opens when a trophy card
// is clicked, with the full numbered steps, tip, sources, difficulty, time,
// missable warning, roadmap stage and a mark-earned button.
import { GRADE_LABELS, KIND_LABELS } from './data-loader.js';
import { starsText, escapeHtml } from './render.js';

let currentId = null;
let onToggleCallback = null;

export function openDrawer(trophy, earned, onToggle) {
  currentId = trophy.id;
  onToggleCallback = onToggle;
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const body = document.getElementById('drawerBody');
  const isEarned = earned.has(trophy.id);
  const steps = (trophy.steps || []).map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
  const sources = (trophy.sources || []).map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
  body.innerHTML =
    '<h2>' + escapeHtml(trophy.name) + '</h2>' +
    '<p class="drawer-desc">' + escapeHtml(trophy.description) + '</p>' +
    '<div class="badges"><span class="badge ' + trophy.grade + '">' + GRADE_LABELS[trophy.grade] + '</span>' +
    (trophy.missable ? '<span class="badge missable-badge">Missable</span>' : '') +
    (trophy.hidden ? '<span class="badge hidden-badge">Hidden on PSN</span>' : '') + '</div>' +
    '<div class="drawer-meta"><span><span class="stars">' + starsText(trophy.difficulty) + '</span> ' + escapeHtml(trophy.difficultyLabel) + ' (estimate)</span>' +
    '<span>Time: ' + escapeHtml(trophy.time) + ' (estimate)</span>' +
    '<span>Kind: ' + escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind) + '</span>' +
    '<span>Roadmap stage ' + trophy.stage + '</span></div>' +
    (trophy.missable && trophy.ponr
      ? '<div class="warn-box"><strong>Missable — point of no return:</strong> ' + escapeHtml(trophy.ponr) + '</div>'
      : '') +
    '<h3>How to earn it</h3><p>' + escapeHtml(trophy.guide) + '</p>' +
    '<h3>Step by step</h3><ol class="steps">' + steps + '</ol>' +
    '<div class="tip"><strong>Tip:</strong> ' + escapeHtml(trophy.tip) + '</div>' +
    (trophy.watchout ? '<div class="warn-box"><strong>Watch out:</strong> ' + escapeHtml(trophy.watchout) + '</div>' : '') +
    '<h3>Sources</h3><ul class="sources">' + sources + '</ul>' +
    '<p class="fineprint">Difficulty and time are this guide\u2019s estimates. Counts come only from the official description or the cited trophy-tracking lists.</p>' +
    '<button type="button" class="btn earn-btn" id="drawerEarnBtn">' + (isEarned ? '✓ Earned — tap to unmark' : 'Mark as earned') + '</button>';
  drawer.hidden = false;
  overlay.hidden = false;
  document.getElementById('drawerEarnBtn').addEventListener('click', () => {
    if (onToggleCallback && currentId !== null) onToggleCallback(currentId);
  });
}

export function closeDrawer() {
  document.getElementById('drawer').hidden = true;
  document.getElementById('drawerOverlay').hidden = true;
  currentId = null;
}

export function refreshDrawerIfOpen(trophies, earned) {
  if (currentId === null) return;
  const trophy = trophies.find((t) => t.id === currentId);
  if (trophy && onToggleCallback) openDrawer(trophy, earned, onToggleCallback);
}
