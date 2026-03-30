const TEAMS = ["SL Amigos do Chiti", "Túnel do Grilo FC"];
const TEAM_COLORS = {
  "SL Amigos do Chiti": { bg: "rgba(15,52,96,0.7)", border: "#0f3460" },
  "Túnel do Grilo FC": { bg: "rgba(226,55,68,0.7)", border: "#e23744" },
};
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

function renderOverallTable(matches) {
  const tbody = document.querySelector("#stats-table tbody");
  tbody.innerHTML = "";

  TEAMS.forEach((team) => {
    const s = computeTeamStats(matches, team);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:left;font-weight:600">${team}</td>
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

function renderOverallCharts(matches) {
  const stats = TEAMS.map((t) => computeTeamStats(matches, t));

  // Results bar chart
  new Chart(document.getElementById("results-chart"), {
    type: "bar",
    data: {
      labels: TEAMS,
      datasets: [
        { label: "Wins", data: stats.map((s) => s.wins), backgroundColor: "#27ae60" },
        { label: "Draws", data: stats.map((s) => s.draws), backgroundColor: "#f39c12" },
        { label: "Defeats", data: stats.map((s) => s.defeats), backgroundColor: "#e74c3c" },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });

  // Goals bar chart
  new Chart(document.getElementById("goals-chart"), {
    type: "bar",
    data: {
      labels: TEAMS,
      datasets: [
        { label: "Goals Scored", data: stats.map((s) => s.scored), backgroundColor: "#0f3460" },
        { label: "Goals Allowed", data: stats.map((s) => s.allowed), backgroundColor: "#e23744" },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function renderMonthlySection(matches) {
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
    const stats = TEAMS.map((t) => ({ team: t, ...computeTeamStats(months[key], t) }));

    wrapper.innerHTML = `
      <h3>${monthLabel(key)}</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
              <th>GS</th><th>GA</th><th>GD</th>
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
  TEAMS.forEach((team) => {
    const card = document.createElement("div");
    card.className = "chart-card";
    const canvas = document.createElement("canvas");
    card.innerHTML = `<h3>${team} – Monthly Trends</h3>`;
    card.appendChild(canvas);
    chartsContainer.appendChild(card);

    const labels = sortedKeys.map(monthLabel);
    const winsData = sortedKeys.map((k) => computeTeamStats(months[k], team).wins);
    const drawsData = sortedKeys.map((k) => computeTeamStats(months[k], team).draws);
    const defeatsData = sortedKeys.map((k) => computeTeamStats(months[k], team).defeats);
    const scoredData = sortedKeys.map((k) => computeTeamStats(months[k], team).scored);
    const allowedData = sortedKeys.map((k) => computeTeamStats(months[k], team).allowed);

    const colors = TEAM_COLORS[team];

    new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Wins", data: winsData, borderColor: "#27ae60", backgroundColor: "rgba(39,174,96,0.15)", fill: false, tension: 0.3 },
          { label: "Draws", data: drawsData, borderColor: "#f39c12", backgroundColor: "rgba(243,156,18,0.15)", fill: false, tension: 0.3 },
          { label: "Defeats", data: defeatsData, borderColor: "#e74c3c", backgroundColor: "rgba(231,76,60,0.15)", fill: false, tension: 0.3 },
          { label: "Goals Scored", data: scoredData, borderColor: colors.border, backgroundColor: colors.bg, fill: false, tension: 0.3, borderDash: [5, 5] },
          { label: "Goals Allowed", data: allowedData, borderColor: "#999", backgroundColor: "rgba(153,153,153,0.15)", fill: false, tension: 0.3, borderDash: [5, 5] },
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
  const matches = await response.json();

  renderOverallTable(matches);
  renderMatchHistory(matches);
  renderOverallCharts(matches);
  renderMonthlySection(matches);
}

document.addEventListener("DOMContentLoaded", init);
