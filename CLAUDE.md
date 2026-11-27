# eFootball Managers

A static webpage that lists eFootball managers with filtering and sorting capabilities. Hosted on GitHub Pages.

## Project Structure

```
efootball-managers/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles (CSS custom properties for theming)
├── js/
│   └── app.js          # Application logic (filtering, sorting, rendering)
├── data/
│   ├── managers.json       # Manager data
│   ├── link-up-plays.json  # Shared link-up play definitions (keyed by play name)
│   └── photos/             # Manager photos
└── CLAUDE.md               # This file
```

## Data Model

### Manager Object Structure

```javascript
{
  id: "p-guardiola",                    // Unique identifier (kebab-case)
  name: "P. Guardiola",                 // Manager display name
  photo: "https://example.com/photo.png", // URL to photo
  boosterEffects: [                     // Array of 1-2 booster effects
    { stat: "Tight Possession", value: "+1" }
  ],
  teamPlaystyleProficiency: {           // All values: 10-99 (or null for "N/A")
    possessionGame: 95,
    longBallCounter: 45,
    quickCounter: 60,
    longBall: 40,
    outWide: 75,
    overload: 82                        // null on managers released before Overload existed
  },
  linkUpPlays: ["False Nine"]           // 0-2 play names, resolved from data/link-up-plays.json (omit or [] for none)
}
```

`overload` is the newest playstyle. Managers released before it was introduced carry
`overload: null`, which renders as an "N/A" bar, never matches the 80+ playstyle filter, and
sorts last under "Overload (Highest)". Give new managers a real 10-99 value.

### Link-Up Play Definitions

Link-up plays are defined once in `data/link-up-plays.json`, keyed by play name, and
referenced by name from `managers.json`. This avoids repeating the same play definition
across managers that share it.

```json
{
  "False Nine": {
    "centerPiece": {
      "playingStyle": "Creative Playmaker",
      "positions": ["CF", "SS"]
    },
    "keyMan": {
      "playingStyle": "Roaming Flank",
      "positions": ["LWF", "RWF"]
    }
  }
}
```

The play name is the reference key and must be unique. `app.js` resolves each
`linkUpPlays` name to its full definition at load time and warns in the console if a
referenced play is missing from `data/link-up-plays.json`.

### Field Constraints

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Unique, kebab-case |
| name | string | Required |
| photo | string | Valid URL |
| boosterEffects | array | 1-2 items, each has `stat` (string) and `value` ("+1") |
| teamPlaystyleProficiency | object | 6 fixed keys, values 10-99, or `null` for an unrated playstyle |
| linkUpPlays | array | 0-2 play names, each must exist in `data/link-up-plays.json` |

## Adding/Editing Managers

Edit `data/managers.json` directly. The file contains an array of manager objects.
If a manager uses a link-up play that doesn't exist in `data/link-up-plays.json` yet,
add it there first (keyed by play name), then reference it from the manager.

## Development

No build step required. Open `index.html` in a browser or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js (if npx available)
npx serve
```

## Deployment

Push to GitHub and enable GitHub Pages from repository settings. Point to the `main` branch root.

## Styling Guidelines

- CSS custom properties defined in `:root` for easy theming
- Mobile-first responsive design
- Color scheme uses CSS variables for dark/light mode support

## Code Conventions

- Vanilla JavaScript (ES6+)
- No external dependencies
- Data is immutable; filtering/sorting creates new arrays
