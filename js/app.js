const TEAM_COLORS = {
  amigos: { bg: "rgba(15,52,96,0.7)", border: "#0f3460" },
  tunel:  { bg: "rgba(226,55,68,0.7)", border: "#e23744" },
};
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ---------- helpers ---------- */

function computeTeamStats(matches, teamName) {
  let wins = 0, draws = 0, defeats = 0, scored = 0, allowed = 0;

  matches.forEach((m) => {
    const isHome = m.homeTeam === teamName;
    const gf = isHome ? m.homeGoals : m.awayGoals;
    const ga = isHome ? m.awayGoals : m.homeGoals;
    scored += gf;
    allowed += ga;
    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else defeats++;
  });

  return {
    played: matches.length,
    wins,
    draws,
    defeats,
    scored,
    allowed,
    diff: scored - allowed,
  };
}

function groupByMonth(matches) {
  const months = {};
  matches.forEach((m) => {
    const d = new Date(m.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) months[key] = [];
    months[key].push(m);
  });
  return months;
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

/* ---------- rendering ---------- */

function renderOverallTable(matches, teams) {
  const tbody = document.querySelector("#stats-table tbody");
  tbody.innerHTML = "";

  teams.forEach((team) => {
    const s = computeTeamStats(matches, team.name);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:left;font-weight:600">${team.name}</td>
      <td>${s.played}</td>
      <td>${s.wins}</td>
      <td>${s.draws}</td>
      <td>${s.defeats}</td>
      <td>${s.scored}</td>
      <td>${s.allowed}</td>
      <td>${s.diff > 0 ? "+" : ""}${s.diff}</td>`;
    tbody.appendChild(tr);
  });
}

function renderMatchHistory(matches) {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";

  [...matches].reverse().forEach((m) => {
    const d = new Date(m.date);
    const dateStr = d.toLocaleDateString("en-GB", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td style="text-align:right">${m.homeTeam}</td>
      <td class="score-cell">${m.homeGoals} – ${m.awayGoals}</td>
      <td style="text-align:left">${m.awayTeam}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- charts ---------- */

function renderOverallCharts(matches, teams) {
  const teamNames = teams.map((t) => t.name);
  const stats = teamNames.map((t) => computeTeamStats(matches, t));

  // Results bar chart
  new Chart(document.getElementById("results-chart"), {
    type: "bar",
    data: {
      labels: teamNames,
      datasets: [
        { label: "Vitórias", data: stats.map((s) => s.wins), backgroundColor: "#27ae60" },
        { label: "Empates", data: stats.map((s) => s.draws), backgroundColor: "#f39c12" },
        { label: "Derrotas", data: stats.map((s) => s.defeats), backgroundColor: "#e74c3c" },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });

  // Goals bar chart
  new Chart(document.getElementById("goals-chart"), {
    type: "bar",
    data: {
      labels: teamNames,
      datasets: [
        { label: "Golos Marcados", data: stats.map((s) => s.scored), backgroundColor: "#0f3460" },
        { label: "Golos Sofridos", data: stats.map((s) => s.allowed), backgroundColor: "#e23744" },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function renderMonthlySection(matches, teams) {
  const months = groupByMonth(matches);
  const sortedKeys = Object.keys(months).sort();

  const tablesContainer = document.getElementById("monthly-tables");
  const chartsContainer = document.getElementById("monthly-charts");
  tablesContainer.innerHTML = "";
  chartsContainer.innerHTML = "";

  // Monthly tables
  sortedKeys.forEach((key) => {
    const wrapper = document.createElement("div");
    wrapper.className = "monthly-table-wrapper";
    const stats = teams.map((t) => ({ team: t.name, ...computeTeamStats(months[key], t.name) }));

    wrapper.innerHTML = `
      <h3>${monthLabel(key)}</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Team</th><th>P</th><th>V</th><th>E</th><th>D</th>
              <th>GM</th><th>GS</th><th>GD</th>
            </tr>
          </thead>
          <tbody>
            ${stats
              .map(
                (s) => `<tr>
                  <td style="text-align:left;font-weight:600">${s.team}</td>
                  <td>${s.played}</td><td>${s.wins}</td><td>${s.draws}</td>
                  <td>${s.defeats}</td><td>${s.scored}</td><td>${s.allowed}</td>
                  <td>${s.diff > 0 ? "+" : ""}${s.diff}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    tablesContainer.appendChild(wrapper);
  });

  // Monthly trend line chart per team
  teams.forEach((team) => {
    const card = document.createElement("div");
    card.className = "chart-card";
    const canvas = document.createElement("canvas");
    card.innerHTML = `<h3>${team.name} – Monthly Trends</h3>`;
    card.appendChild(canvas);
    chartsContainer.appendChild(card);

    const labels = sortedKeys.map(monthLabel);
    const winsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).wins);
    const drawsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).draws);
    const defeatsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).defeats);
    const scoredData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).scored);
    const allowedData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).allowed);

    const colors = TEAM_COLORS[team.id] || { bg: "rgba(100,100,100,0.7)", border: "#666" };

    new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Vitórias", data: winsData, borderColor: "#27ae60", backgroundColor: "rgba(39,174,96,0.15)", fill: false, tension: 0.3 },
          { label: "Empates", data: drawsData, borderColor: "#f39c12", backgroundColor: "rgba(243,156,18,0.15)", fill: false, tension: 0.3 },
          { label: "Derrotas", data: defeatsData, borderColor: "#e74c3c", backgroundColor: "rgba(231,76,60,0.15)", fill: false, tension: 0.3 },
          { label: "Golos Marcados", data: scoredData, borderColor: colors.border, backgroundColor: colors.bg, fill: false, tension: 0.3, borderDash: [5, 5] },
          { label: "Golos Sofridos", data: allowedData, borderColor: "#999", backgroundColor: "rgba(153,153,153,0.15)", fill: false, tension: 0.3, borderDash: [5, 5] },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
  });
}

/* ---------- init ---------- */

async function init() {
  const response = await fetch("data/matches.json");
  const data = await response.json();

  const teams = data.teams;
  const teamMap = {};
  teams.forEach((t) => { teamMap[t.id] = t.name; });

  // Resolve team IDs to full names so downstream code works with names
  const matches = data.matches.map((m) => ({
    ...m,
    homeTeam: teamMap[m.home],
    awayTeam: teamMap[m.away],
  }));

  renderOverallTable(matches, teams);
  renderMatchHistory(matches);
  renderOverallCharts(matches, teams);
  renderMonthlySection(matches, teams);
}

document.addEventListener("DOMContentLoaded", init);
