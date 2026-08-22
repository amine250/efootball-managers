/**
 * eFootball Managers App
 * Handles filtering, sorting, and rendering of manager cards
 */

const PLAYSTYLE_LABELS = {
  possessionGame: 'Possession Game',
  longBallCounter: 'Long Ball Counter',
  quickCounter: 'Quick Counter',
  longBall: 'Long Ball',
  outWide: 'Out Wide',
  overload: 'Overload'
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

/**
 * Normalize link-up play data to an array.
 * Supports `linkUpPlays` (array, 0-2 items) and the legacy `linkUpPlay` (object or null).
 */
function normalizeManager(manager) {
  const source = manager.linkUpPlays !== undefined ? manager.linkUpPlays : manager.linkUpPlay;
  const linkUpPlays = source ? (Array.isArray(source) ? source.filter(Boolean) : [source]) : [];
  return { ...manager, linkUpPlays };
}

// DOM Elements
const elements = {
  grid: document.getElementById('managers-grid'),
  count: document.getElementById('managers-count'),
  empty: document.getElementById('managers-empty'),
  search: document.getElementById('search'),
  sortBy: document.getElementById('sort-by'),
  playstyleCheckboxes: document.querySelectorAll('.playstyle-checkbox'),
  boosterFilter: document.getElementById('booster-filter'),
  linkupFilter: document.getElementById('linkup-filter'),
  resetBtn: document.getElementById('reset-filters')
};

/**
 * Fetch managers data from JSON file
 */
async function loadManagers() {
  try {
    const response = await fetch('data/managers.json');
    managers = (await response.json()).map(normalizeManager);
    populateBoosterFilter();
    populateLinkupFilter();
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
 * Populate link-up play filter dropdown with unique link-up play names
 */
function populateLinkupFilter() {
  const linkups = new Set();
  managers.forEach(manager => {
    manager.linkUpPlays.forEach(linkup => {
      if (linkup.name) linkups.add(linkup.name);
    });
  });

  const sortedLinkups = Array.from(linkups).sort();
  sortedLinkups.forEach(linkup => {
    const option = document.createElement('option');
    option.value = linkup;
    option.textContent = linkup;
    elements.linkupFilter.appendChild(option);
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
  const linkupFilter = elements.linkupFilter.value;

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
    if (linkupFilter) {
      const linkupCount = manager.linkUpPlays.length;
      if (linkupFilter === 'none') {
        if (linkupCount > 0) return false;
      } else if (linkupFilter === 'has-linkup') {
        if (linkupCount === 0) return false;
      } else if (linkupFilter === 'multiple') {
        if (linkupCount < 2) return false;
      } else if (!manager.linkUpPlays.some(l => l.name === linkupFilter)) {
        return false;
      }
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
      // Sort by playstyle value (descending), N/A values last
      const valueA = a.teamPlaystyleProficiency[sortBy] ?? -1;
      const valueB = b.teamPlaystyleProficiency[sortBy] ?? -1;
      return valueB - valueA;
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

  const linkupCount = manager.linkUpPlays.length;
  const linkupTitle = `Link-Up Play${linkupCount > 1 ? 's' : ''}`;
  const linkupHtml = linkupCount > 0
    ? `<div class="linkups">${manager.linkUpPlays.map(createLinkupHtml).join('')}</div>`
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
        <h4 class="card__section-title">${linkupTitle}</h4>
        ${linkupHtml}
      </section>
    </article>
  `;
}

/**
 * Create HTML for a playstyle progress bar
 */
function createPlaystyleBar(name, value) {
  // Playstyles introduced after a manager's release have no rating yet
  if (value === null || value === undefined) {
    return `
      <div class="playstyle playstyle--na">
        <div class="playstyle__header">
          <span class="playstyle__name">${name}</span>
          <span class="playstyle__value">N/A</span>
        </div>
        <div class="playstyle__bar"></div>
      </div>
    `;
  }

  let fillClass = 'playstyle__fill--low';
  if (value >= 90) fillClass = 'playstyle__fill--elite';
  else if (value >= 80) fillClass = 'playstyle__fill--high';
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
  // Focus first: iOS Safari only raises the keyboard when focus() runs
  // inside the user gesture, and before the grid re-render.
  elements.search.focus();
  elements.search.value = '';
  elements.sortBy.value = 'releaseDate-desc';
  elements.playstyleCheckboxes.forEach(cb => cb.checked = false);
  elements.boosterFilter.value = '';
  elements.linkupFilter.value = '';
  applyFilters();
}

// Event Listeners
elements.search.addEventListener('input', applyFilters);

// Select existing text when the field is clicked/focused, but let a second
// click inside the field place the caret normally.
let searchSelectOnMouseUp = false;
elements.search.addEventListener('focus', () => {
  searchSelectOnMouseUp = true;
  elements.search.select();
});
elements.search.addEventListener('mouseup', (e) => {
  if (searchSelectOnMouseUp) {
    e.preventDefault();
    searchSelectOnMouseUp = false;
  }
});
elements.search.addEventListener('blur', () => {
  searchSelectOnMouseUp = false;
});

elements.sortBy.addEventListener('change', applyFilters);
elements.playstyleCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
elements.boosterFilter.addEventListener('change', applyFilters);
elements.linkupFilter.addEventListener('change', applyFilters);
// Keep the button from taking focus on tap/click, so the search field is the
// only thing focused when resetFilters() runs (iOS Safari otherwise refuses
// to show the keyboard). Cancelling pointerdown still lets click fire.
elements.resetBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  elements.search.focus();
});
elements.resetBtn.addEventListener('click', resetFilters);

// Playstyle Guide Popup
const playstyleGuideBtn = document.getElementById('playstyle-guide-btn');
const playstyleGuidePopup = document.getElementById('playstyle-guide-popup');
const playstyleGuideClose = document.getElementById('playstyle-guide-close');

playstyleGuideBtn.addEventListener('click', () => {
  playstyleGuidePopup.hidden = !playstyleGuidePopup.hidden;
});

playstyleGuideClose.addEventListener('click', () => {
  playstyleGuidePopup.hidden = true;
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
  if (!playstyleGuidePopup.hidden &&
      !playstyleGuidePopup.contains(e.target) &&
      !playstyleGuideBtn.contains(e.target)) {
    playstyleGuidePopup.hidden = true;
  }
});

// Initialize
loadManagers();
