// App entry: loads the trophy data, wires the views, filters, search,
// spoiler setting, export/import and the detail drawer, and re-renders
// every surface whenever the tracker changes.
import { loadTrophies } from './data-loader.js';
import { store } from './store.js';
import { applyFilters } from './filters.js';
import { renderRoadmap } from './roadmap.js';
import { openDrawer, closeDrawer, refreshDrawerIfOpen } from './drawer.js';
import { renderDashboard, renderCards, renderMissable, renderCollectibles } from './render.js';

const filterState = { query: '', kind: 'all', grade: 'all', difficulty: 'all', sort: 'roadmap' };
let trophies = [];

function renderAll() {
  renderDashboard(trophies, store.earned);
  const list = applyFilters(trophies, filterState, store.earned);
  renderCards(document.getElementById('checklist'), list, store.earned, store.spoiler, handleToggle, handleOpen);
  document.getElementById('resultCount').textContent = list.length + ' of 55 trophies';
  document.getElementById('onlineNote').hidden = filterState.kind !== 'online';
  renderRoadmap(document.getElementById('roadmapStages'), trophies, store.earned, handleToggle, handleOpen);
  renderMissable(document.getElementById('missableList'), trophies, store.earned, handleToggle, handleOpen);
  refreshDrawerIfOpen(trophies, store.earned);
}

function handleToggle(id) {
  store.toggle(id);
  renderAll();
}

function handleOpen(trophy) {
  openDrawer(trophy, store.earned, handleToggle);
}

function switchView(name) {
  document.querySelectorAll('.view-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  closeDrawer();
  window.scrollTo({ top: 0 });
}

function jumpToTrophy(id) {
  filterState.kind = 'all';
  filterState.query = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.toggle('active', c.dataset.kind === 'all'));
  switchView('checklist');
  renderAll();
  const trophy = trophies.find((t) => t.id === id);
  if (trophy) handleOpen(trophy);
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function init() {
  try {
    trophies = await loadTrophies();
  } catch {
    document.getElementById('checklist').innerHTML = '<p class="empty">The trophy list could not be loaded. Serve the app folder with a static server and reload.</p>';
    return;
  }

  renderCollectibles(document.getElementById('collectibleSets'), trophies, jumpToTrophy);

  document.querySelectorAll('.view-btn').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });

  document.getElementById('searchInput').addEventListener('input', (event) => {
    filterState.query = event.target.value;
    renderAll();
  });
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.kind = chip.dataset.kind;
      renderAll();
    });
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    filterState.grade = event.target.value;
    renderAll();
  });
  document.getElementById('diffFilter').addEventListener('change', (event) => {
    filterState.difficulty = event.target.value;
    renderAll();
  });
  document.getElementById('sortSelect').addEventListener('change', (event) => {
    filterState.sort = event.target.value;
    renderAll();
  });

  const spoilerToggle = document.getElementById('spoilerToggle');
  spoilerToggle.checked = store.spoiler;
  spoilerToggle.addEventListener('change', () => {
    store.setSpoiler(spoilerToggle.checked);
    renderAll();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadFile('gta6-trophy-progress.json', store.exportJson());
  });
  document.getElementById('importInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const count = store.importJson(await file.text());
      spoilerToggle.checked = store.spoiler;
      renderAll();
      alert('Progress imported: ' + count + ' trophies earned.');
    } catch {
      alert('That file is not a progress export from this guide.');
    }
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all checked trophies?')) {
      store.reset();
      renderAll();
    }
  });

  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  renderAll();
}

init();
