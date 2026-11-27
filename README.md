# eFootball Managers

A web application for browsing and filtering eFootball managers to help you make the best tactical decisions.

## Features

- **Search** - Find managers by name
- **Sorting** - Sort by release date, name, or playstyle proficiency
- **Playstyle Filtering** - Filter managers with 80+ proficiency in specific playstyles:
  - Possession Game
  - Quick Counter
  - Long Ball Counter
  - Out Wide
  - Long Ball
- **Booster Effect Filter** - Find managers by their stat boosts
- **Link-Up Play Filter** - Filter by link-up play availability
- **Playstyle Guide** - Quick reference for counter-tactics against opponent playstyles

## Project Structure

```
efootball-managers/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Styles with CSS custom properties
├── js/
│   └── app.js          # Application logic
├── data/
│   ├── managers.json   # Manager database
│   ├── link-up-plays.json # Shared link-up play definitions
│   └── photos/         # Manager photos
└── README.md
```

## Data Model

Each manager has the following properties:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Display name |
| `photo` | Path to a `.webp` file in `data/photos/` (see CLAUDE.md for converting new photos) |
| `releaseDate` | Release date (YYYY-MM-DD) |
| `boosterEffects` | Array of stat boosts (e.g., `{ "stat": "Speed", "value": "+1" }`) |
| `teamPlaystyleProficiency` | Proficiency values (10-99) for each playstyle |
| `linkUpPlays` | 0-2 link-up play names, defined in `data/link-up-plays.json` |

### Playstyle Proficiency

```json
{
  "possessionGame": 89,
  "quickCounter": 65,
  "longBallCounter": 56,
  "outWide": 68,
  "longBall": 57
}
```

### Link-Up Play (optional)

```json
{
  "name": "Over-the-Top Pass A",
  "centerPiece": {
    "playingStyle": "Orchestrator",
    "positions": ["DMF"]
  },
  "keyMan": {
    "playingStyle": "Goal Poacher",
    "positions": ["CF"]
  }
}
```

## Development

No build step required. Run a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve
```

Then open `http://localhost:8000` in your browser.

## Adding Managers

Edit `data/managers.json` to add or modify managers. Follow the existing data structure.
Link-up plays are defined once in `data/link-up-plays.json` and referenced by name.

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS Custom Properties for theming
- No external dependencies
