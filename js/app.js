/**
 * eFootball Managers App
 * Handles filtering, sorting, and rendering of manager cards
 */

const PLAYSTYLE_LABELS = {
  possessionGame: 'Possession Game',
  longBallCounter: 'Long Ball Counter',
  quickCounter: 'Quick Counter',
  longBall: 'Long Ball',
  outWide: 'Out Wide'
};

/**
 * Format release date for display
 */
function formatReleaseDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

let managers = [];
let filteredManagers = [];

// DOM Elements
const elements = {
  grid: document.getElementById('managers-grid'),
  count: document.getElementById('managers-count'),
  empty: document.getElementById('managers-empty'),
  search: document.getElementById('search'),
  sortBy: document.getElementById('sort-by'),
  playstyleCheckboxes: document.querySelectorAll('.playstyle-checkbox'),
  boosterFilter: document.getElementById('booster-filter'),
  hasLinkup: document.getElementById('has-linkup'),
  resetBtn: document.getElementById('reset-filters')
};

/**
 * Fetch managers data from JSON file
 */
async function loadManagers() {
  try {
    const response = await fetch('data/managers.json');
    managers = await response.json();
    populateBoosterFilter();
    applyFilters();
  } catch (error) {
    console.error('Failed to load managers:', error);
    elements.empty.hidden = false;
    elements.empty.querySelector('p').textContent = 'Failed to load managers data.';
  }
}

/**
 * Populate booster filter dropdown with unique booster stats
 */
function populateBoosterFilter() {
  const boosters = new Set();
  managers.forEach(manager => {
    manager.boosterEffects.forEach(effect => {
      boosters.add(effect.stat);
    });
  });

  const sortedBoosters = Array.from(boosters).sort();
  sortedBoosters.forEach(booster => {
    const option = document.createElement('option');
    option.value = booster;
    option.textContent = booster;
    elements.boosterFilter.appendChild(option);
  });
}

/**
 * Apply all filters and sorting to managers
 */
function applyFilters() {
  const searchTerm = elements.search.value.toLowerCase().trim();
  const sortBy = elements.sortBy.value;
  const selectedPlaystyles = Array.from(elements.playstyleCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  const boosterFilter = elements.boosterFilter.value;
  const hasLinkup = elements.hasLinkup.checked;

  // Filter
  filteredManagers = managers.filter(manager => {
    // Search filter
    if (searchTerm && !manager.name.toLowerCase().includes(searchTerm)) {
      return false;
    }

    // Playstyle checkbox filter (80+)
    if (selectedPlaystyles.length > 0) {
      const hasAllSelectedPlaystyles = selectedPlaystyles.every(
        playstyle => manager.teamPlaystyleProficiency[playstyle] >= 80
      );
      if (!hasAllSelectedPlaystyles) {
        return false;
      }
    }

    // Booster filter
    if (boosterFilter) {
      const hasBooster = manager.boosterEffects.some(e => e.stat === boosterFilter);
      if (!hasBooster) {
        return false;
      }
    }

    // Link-up play filter
    if (hasLinkup && !manager.linkUpPlay) {
      return false;
    }

    return true;
  });

  // Sort
  filteredManagers.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'releaseDate' || sortBy === 'releaseDate-desc') {
      // Handle null release dates - treat as oldest (far past)
      const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
      const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
      return sortBy === 'releaseDate-desc' ? dateB - dateA : dateA - dateB;
    } else {
      // Sort by playstyle value (descending)
      return b.teamPlaystyleProficiency[sortBy] - a.teamPlaystyleProficiency[sortBy];
    }
  });

  renderManagers();
}

/**
 * Render manager cards to the grid
 */
function renderManagers() {
  elements.count.textContent = `${filteredManagers.length} manager${filteredManagers.length !== 1 ? 's' : ''}`;

  if (filteredManagers.length === 0) {
    elements.grid.innerHTML = '';
    elements.empty.hidden = false;
    return;
  }

  elements.empty.hidden = true;
  elements.grid.innerHTML = filteredManagers.map(createManagerCard).join('');
}

/**
 * Create HTML for a manager card
 */
function createManagerCard(manager) {
  const boostersHtml = manager.boosterEffects
    .map(e => `<span class="card__booster">${e.stat} ${e.value}</span>`)
    .join('');

  const playstylesHtml = Object.entries(manager.teamPlaystyleProficiency)
    .map(([key, value]) => createPlaystyleBar(PLAYSTYLE_LABELS[key], value))
    .join('');

  const linkupHtml = manager.linkUpPlay
    ? createLinkupHtml(manager.linkUpPlay)
    : '<div class="linkup--none">No Link-Up Play</div>';

  const releaseDateHtml = `<div class="card__release-date">Released: ${formatReleaseDate(manager.releaseDate)}</div>`;

  return `
    <article class="card">
      <header class="card__header">
        <img src="${manager.photo}" alt="${manager.name}" class="card__photo" loading="lazy">
        <div class="card__info">
          <h3 class="card__name">${manager.name}</h3>
          ${releaseDateHtml}
          <div class="card__boosters">${boostersHtml}</div>
        </div>
      </header>

      <section class="card__section">
        <h4 class="card__section-title">Team Playstyle Proficiency</h4>
        ${playstylesHtml}
      </section>

      <section class="card__section">
        <h4 class="card__section-title">Link-Up Play</h4>
        ${linkupHtml}
      </section>
    </article>
  `;
}

/**
 * Create HTML for a playstyle progress bar
 */
function createPlaystyleBar(name, value) {
  let fillClass = 'playstyle__fill--low';
  if (value >= 80) fillClass = 'playstyle__fill--high';
  else if (value >= 70) fillClass = 'playstyle__fill--medium';

  return `
    <div class="playstyle">
      <div class="playstyle__header">
        <span class="playstyle__name">${name}</span>
        <span class="playstyle__value">${value}</span>
      </div>
      <div class="playstyle__bar">
        <div class="playstyle__fill ${fillClass}" style="width: ${value}%"></div>
      </div>
    </div>
  `;
}

/**
 * Create HTML for link-up play section
 */
function createLinkupHtml(linkup) {
  return `
    <div class="linkup">
      <div class="linkup__name">${linkup.name}</div>
      <div class="linkup__roles">
        <div class="linkup__role">
          <div class="linkup__role-title">Center Piece</div>
          <div class="linkup__role-style">${linkup.centerPiece.playingStyle}</div>
          <div class="linkup__role-positions">
            ${linkup.centerPiece.positions.map(p => `<span class="linkup__position">${p}</span>`).join('')}
          </div>
        </div>
        <div class="linkup__role">
          <div class="linkup__role-title">Key Man</div>
          <div class="linkup__role-style">${linkup.keyMan.playingStyle}</div>
          <div class="linkup__role-positions">
            ${linkup.keyMan.positions.map(p => `<span class="linkup__position">${p}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
  elements.search.value = '';
  elements.sortBy.value = 'releaseDate-desc';
  elements.playstyleCheckboxes.forEach(cb => cb.checked = false);
  elements.boosterFilter.value = '';
  elements.hasLinkup.checked = false;
  applyFilters();
}

// Event Listeners
elements.search.addEventListener('input', applyFilters);
elements.sortBy.addEventListener('change', applyFilters);
elements.playstyleCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
elements.boosterFilter.addEventListener('change', applyFilters);
elements.hasLinkup.addEventListener('change', applyFilters);
elements.resetBtn.addEventListener('click', resetFilters);

// Initialize
loadManagers();
