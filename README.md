# ⚽ Segundas Mágicas

A static website that tracks weekly Monday football matches between **SL Amigos do Chiti** and **Túnel do Grilo FC**.

## Features

- **Overall statistics table** – wins, draws, defeats, goals scored, goals allowed, goal difference and last-5-match form for each team.
- **Overall charts** – bar charts comparing results (wins / draws) and total goals scored, displayed two per row on desktop.
- **Monthly statistics** – per-month tables and two separate line-chart trends per team:
  - *Resultados Mensais* – wins, draws and defeats over time.
  - *Golos Mensais* – goals scored vs. goals allowed over time.
- **Rankings** – four highlight cards surfacing key records:
  - 🏆 Month with the most goals scored
  - 📉 Month with the fewest goals scored
  - ⚽ Match with the most goals scored
  - 🔒 Match with the fewest goals scored
- **Player statistics** – per-player table showing games played, team(s) represented, wins, draws, defeats and win percentage, with a styled total-players badge.
- **Match history** – reverse-chronological list of all played matches with score.

## Data

Match data is stored in [`data/matches.json`](data/matches.json). The file contains a `teams` array (with short IDs and full names) and a `matches` array that references teams by ID:

```json
{
  "teams": [
    { "id": "amigos", "name": "SL Amigos do Chiti" },
    { "id": "tunel",  "name": "Túnel do Grilo FC"  }
  ],
  "matches": [
    {
      "date": "2026-01-05",
      "home": "amigos", "away": "tunel",
      "homeGoals": 6,   "awayGoals": 8,
      "homePlayers": ["Player A", "Player B"],
      "awayPlayers":  ["Player C", "Player D"]
    }
  ]
}
```

To add a new match, append a new object to the `matches` array with:

| Field | Type | Description |
|---|---|---|
| `date` | `string` | Match date in `YYYY-MM-DD` format (always a Monday) |
| `home` / `away` | `string` | Team ID (`"amigos"` or `"tunel"`) |
| `homeGoals` / `awayGoals` | `number` | Final score |
| `homePlayers` / `awayPlayers` | `string[]` | Roster for each side (optional but needed for player stats) |

## Design

- **Team colours** – SL Amigos do Chiti `#C8102E` (red) · Túnel do Grilo FC `#0B3C5D` (navy).
- **Header gradient** – built from the *Segundas Mágicas* logo palette: `#0A0A0A → #0F3D1E → #2E7D32`, with `#6BDB2B` used as the accent colour throughout (section underlines, player-total badge).
- **Responsive layout** – charts display in a two-column grid on desktop and collapse to a single column on mobile (≤ 600 px).

## Project structure

```
weekly-matches/
├── index.html
├── css/
│   └── styles.css
├── data/
│   └── matches.json
├── img/
│   └── segundas.png      # Logo
└── js/
    ├── app.js
    └── chart.min.js      # Chart.js (vendored)
```

## Running locally

The site is purely static HTML/CSS/JS. Because `app.js` loads data via `fetch()`, it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

Serve the root directory with any HTTP server:

```bash
# Python (built-in on macOS)
python3 -m http.server 8080

# Node.js
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080) (or the port shown by your server).

## Technologies

- Vanilla HTML / CSS / JavaScript
- [Chart.js](https://www.chartjs.org/) (vendored locally in `js/chart.min.js`) for data visualisation