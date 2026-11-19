// Tracker store: the earned checklist and the spoiler setting, saved in
// localStorage at once on every change, with JSON export and import.
const EARNED_KEY = 'gta6-trophy-guide-v3-earned';
const SPOILER_KEY = 'gta6-trophy-guide-v3-spoiler';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const store = {
  earned: new Set(readJson(EARNED_KEY, [])),
  spoiler: readJson(SPOILER_KEY, true),

  isEarned(id) {
    return this.earned.has(id);
  },

  toggle(id) {
    if (this.earned.has(id)) this.earned.delete(id);
    else this.earned.add(id);
    this.saveEarned();
  },

  setEarned(id, value) {
    if (value) this.earned.add(id);
    else this.earned.delete(id);
    this.saveEarned();
  },

  saveEarned() {
    try {
      localStorage.setItem(EARNED_KEY, JSON.stringify([...this.earned].sort((a, b) => a - b)));
    } catch {
      // Storage full or unavailable: progress still works for this session.
    }
  },

  setSpoiler(value) {
    this.spoiler = value;
    try {
      localStorage.setItem(SPOILER_KEY, JSON.stringify(value));
    } catch {
      // Ignore: the setting still applies for this session.
    }
  },

  reset() {
    this.earned.clear();
    this.saveEarned();
  },

  exportJson() {
    return JSON.stringify({ app: 'gta6-trophy-guide', version: 3, earned: [...this.earned].sort((a, b) => a - b), spoiler: this.spoiler }, null, 2);
  },

  importJson(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.earned)) throw new Error('Not a progress file from this guide.');
    this.earned = new Set(data.earned.filter((id) => Number.isInteger(id)));
    if (typeof data.spoiler === 'boolean') this.spoiler = data.spoiler;
    this.saveEarned();
    this.setSpoiler(this.spoiler);
    return this.earned.size;
  },
};
