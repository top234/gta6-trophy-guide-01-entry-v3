// Roadmap planner: the 8 stages to the platinum in optimal play order,
// each rendered as a card with its own progress bar, hours and checkable
// trophy chips. Checking a chip anywhere updates every bar and the dashboard.
export const STAGES = [
  { n: 1, title: 'Story: Chapters 1–2', hours: '~8 h', blurb: 'Play the opening chapters and the early story missions. Start every stranger strand you pass — they take a while to finish.' },
  { n: 2, title: 'Story: Chapters 3–4', hours: '~12 h', blurb: 'The story moves into Vice City with bigger set pieces. Stock armour before Operation Savage Glory, the hardest mission before the finale.' },
  { n: 3, title: 'Point of no return — missables first', hours: '~4 h', blurb: 'Before the final mission, earn every missable trophy: partner moments, Cal\'s fishing challenge, the story choices and the one-off events. Do not start the finale until this stage is done.', ponr: true },
  { n: 4, title: 'The final mission', hours: '~2 h', blurb: 'Play the finale and take the gold. Save first, and only start once Stage 3 is fully checked off.' },
  { n: 5, title: 'Strangers & side missions', hours: '~14 h', blurb: 'Finish the eight stranger strands — Andy, Kenton, Billy, Randy, Tyrone and three more — plus Bret\'s hunt.' },
  { n: 6, title: 'Collectibles sweep', hours: '~18 h', blurb: 'Cards, WAiNK photos, meditation spots, vehicles, Scooter Bros registrations and exploring all 52 areas of Leonida.' },
  { n: 7, title: 'Activities & challenges', hours: '~22 h', blurb: 'Stunts, the 42 Shooting Range golds, drone races, races, challenges, arcade, bowling and the one-off stunt trophies.' },
  { n: 8, title: 'Cleanup & the platinum', hours: '~8 h', blurb: 'Bank vaults, gang operations, laundering, spending and garages — then 100% completion and the platinum pops.' },
];

export function stageTrophies(trophies, stageNumber) {
  return trophies.filter((t) => t.stage === stageNumber);
}

export function renderRoadmap(container, trophies, earned, onToggle, onOpen) {
  container.innerHTML = '';
  for (const stage of STAGES) {
    const members = stageTrophies(trophies, stage.n);
    const done = members.filter((t) => earned.has(t.id)).length;
    const pct = members.length ? Math.round((done / members.length) * 100) : 0;
    const card = document.createElement('section');
    card.className = 'stage' + (stage.ponr ? ' ponr' : '');
    card.innerHTML =
      '<div class="stage-top"><h3>Stage ' + stage.n + ' — ' + stage.title + '</h3>' +
      '<span class="stage-hours">' + stage.hours + '</span></div>' +
      '<p>' + stage.blurb + '</p>' +
      '<div class="stage-bar"><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span>' + done + ' / ' + members.length + ' earned</span></div>' +
      '<div class="stage-chips"></div>';
    const chips = card.querySelector('.stage-chips');
    for (const t of members) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'trophy-chip' + (earned.has(t.id) ? ' done' : '') + (t.missable ? ' miss' : '');
      chip.textContent = (earned.has(t.id) ? '✓ ' : '') + t.name;
      chip.title = t.missable ? 'Missable — ' + t.ponr : t.description;
      chip.addEventListener('click', (event) => {
        if (event.shiftKey || event.altKey) onOpen(t);
        else onToggle(t.id);
      });
      chip.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        onOpen(t);
      });
      chips.appendChild(chip);
    }
    container.appendChild(card);
  }
}
