// Data loader: fetches the trophy list (a file under app/, never the network)
// and exposes the shared grade order and kind labels.
export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side mission',
  collectible: 'Collectible',
  activity: 'Activity',
  exploration: 'Exploration',
};

export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load the trophy list.');
  const data = await response.json();
  const list = Array.isArray(data) ? data : data.trophies;
  return list.slice().sort((a, b) => a.id - b.id);
}
