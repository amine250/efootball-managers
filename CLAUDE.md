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
│   └── managers.json   # Manager data
└── CLAUDE.md           # This file
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
  teamPlaystyleProficiency: {           // All values: 10-99
    possessionGame: 95,
    longBallCounter: 45,
    quickCounter: 60,
    longBall: 40,
    outWide: 75
  },
  linkUpPlays: [                        // 0-2 link-up plays (omit or [] for none)
    {
      name: "False Nine",
      centerPiece: {
        playingStyle: "Creative Playmaker",
        positions: ["CF", "SS"]
      },
      keyMan: {
        playingStyle: "Roaming Flank",
        positions: ["LWF", "RWF"]
      }
    }
  ]
}
```

The legacy `linkUpPlay` field (a single object, or `null` for none) is still accepted and
normalized into `linkUpPlays` at load time, so older entries need no migration. Use
`linkUpPlays` for new managers.

### Field Constraints

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Unique, kebab-case |
| name | string | Required |
| photo | string | Valid URL |
| boosterEffects | array | 1-2 items, each has `stat` (string) and `value` ("+1") |
| teamPlaystyleProficiency | object | 5 fixed keys, values 10-99 |
| linkUpPlays | array | 0-2 items, each has name, centerPiece, keyMan |
| linkUpPlay | object/null | Legacy single-play form; normalized to `linkUpPlays` |

## Adding/Editing Managers

Edit `data/managers.json` directly. The file contains an array of manager objects.

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
