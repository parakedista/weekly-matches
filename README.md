# ⚽ Weekly Matches

A static website that tracks weekly Monday football matches between **SL Amigos do Chiti** and **Túnel do Grilo FC**.

## Features

- **Overall statistics table** – wins, draws, defeats, goals scored, goals allowed and goal difference for each team.
- **Overall charts** – bar charts comparing results and goals.
- **Monthly statistics** – per-month tables and line-chart trends (wins, draws, defeats, goals scored/allowed) for each team.
- **Match history** – chronological list of all played matches.

## Data

Match data is stored in [`data/matches.json`](data/matches.json). Each entry has the following structure:

```json
{
  "date": "2025-01-06",
  "homeTeam": "SL Amigos do Chiti",
  "awayTeam": "Túnel do Grilo FC",
  "homeGoals": 3,
  "awayGoals": 1
}
```

To add a new match, append a new object to the JSON array with the match date (always a Monday), the home/away teams and goal counts.

## Running locally

The site is purely static HTML/CSS/JS. Serve the root directory with any HTTP server:

```bash
# Python
python3 -m http.server

# Node.js (npx)
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000) (or the port shown by your server).

## Technologies

- Vanilla HTML / CSS / JavaScript
- [Chart.js](https://www.chartjs.org/) (vendored locally in `js/chart.min.js`) for data visualisation