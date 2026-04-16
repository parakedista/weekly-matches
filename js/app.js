const TEAM_COLORS = {
  amigos: { bg: "rgba(200,16,46,0.7)",  border: "#C8102E" },
  tunel:  { bg: "rgba(11,60,93,0.7)",   border: "#0B3C5D" },
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

/* ---------- next match ---------- */

function getNextMatchDate(matches) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a set of dates already played
  const played = new Set(matches.map((m) => m.date));

  // Find next Monday >= today that has no recorded match
  const day = today.getDay();
  const daysToMonday = (8 - day) % 7; // 0 if today is Monday
  const candidate = new Date(today);
  candidate.setDate(today.getDate() + daysToMonday);

  // If the candidate Monday already has a match, advance one more week
  const candidateStr = candidate.toISOString().slice(0, 10);
  if (played.has(candidateStr)) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

function renderNextMatch(matches, teams) {
  const nextDate = getNextMatchDate(matches);
  const countdown = document.getElementById("nm-countdown");
  const nextMatchDate = document.getElementById("nm-date");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((nextDate - today) / 86400000);

  const dateStr = nextDate.toLocaleDateString("pt-PT", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  let countdownLabel;
  if (daysUntil === 0)      countdownLabel = `<span class="nm-today">Hoje! 🎉</span>`;
  else if (daysUntil === 1) countdownLabel = `<span class="nm-soon">Amanhã</span>`;
  else                      countdownLabel = `<span class="nm-days"><strong>${daysUntil}</strong> dias</span>`;

  countdown.innerHTML = countdownLabel;
  nextMatchDate.innerHTML = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

/* ---------- rendering ---------- */

function getLastFiveResults(matches, teamName) {
  return matches
    .filter((m) => m.homeTeam === teamName || m.awayTeam === teamName)
    .slice(-5)
    .map((m) => {
      const isHome = m.homeTeam === teamName;
      const gf = isHome ? m.homeGoals : m.awayGoals;
      const ga = isHome ? m.awayGoals : m.homeGoals;
      if (gf > ga) return "V";
      if (gf === ga) return "E";
      return "D";
    });
}

function renderFormBadges(results) {
  return results
    .map((r) => `<span class="form-badge form-badge--${r.toLowerCase()}">${r}</span>`)
    .join("");
}

function renderOverallTable(matches, teams) {
  const tbody = document.querySelector("#stats-table tbody");
  tbody.innerHTML = "";

  teams.forEach((team) => {
    const s = computeTeamStats(matches, team.name);
    const form = getLastFiveResults(matches, team.name);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:left;font-weight:600">${team.name}</td>
      <td>${s.played}</td>
      <td>${s.wins}</td>
      <td>${s.draws}</td>
      <td>${s.defeats}</td>
      <td>${s.scored}</td>
      <td>${s.allowed}</td>
      <td>${s.diff > 0 ? "+" : ""}${s.diff}</td>
      <td class="form-cell">${renderFormBadges(form)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderMatchHistory(matches) {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";

  [...matches].reverse().forEach((m) => {
    const d = new Date(m.date);
    const dateStr = d.toLocaleDateString("pt-PT", {
      year: "numeric", month: "short", day: "numeric",
    });

    // Main match row
    const tr = document.createElement("tr");
    tr.className = "match-row";
    tr.setAttribute("aria-expanded", "false");
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${m.homeTeam}</td>
      <td class="score-cell">${m.homeGoals} – ${m.awayGoals}</td>
      <td>${m.awayTeam}</td>
      <td class="expand-toggle"><span class="chevron">▾</span></td>`;

    // Detail row
    const detail = document.createElement("tr");
    detail.className = "match-detail";
    detail.hidden = true;

    const homePlayers = (m.homePlayers || []).map(
      (p) => `<li><span class="player-dot player-dot--${m.home}"></span>${p}</li>`
    ).join("");
    const awayPlayers = (m.awayPlayers || []).map(
      (p) => `<li><span class="player-dot player-dot--${m.away}"></span>${p}</li>`
    ).join("");

    detail.innerHTML = `
      <td colspan="5">
        <div class="match-detail-inner">
          <div class="match-detail-team">
            <div class="match-detail-team-header team-badge team-badge--${m.home}">${m.homeTeam}</div>
            <ul class="player-list">${homePlayers || "<li>—</li>"}</ul>
          </div>
          <div class="match-detail-team">
            <div class="match-detail-team-header team-badge team-badge--${m.away}">${m.awayTeam}</div>
            <ul class="player-list">${awayPlayers || "<li>—</li>"}</ul>
          </div>
        </div>
      </td>`;

    tr.addEventListener("click", () => {
      const expanded = tr.getAttribute("aria-expanded") === "true";
      tr.setAttribute("aria-expanded", String(!expanded));
      tr.classList.toggle("match-row--open", !expanded);
      detail.hidden = expanded;
    });

    tbody.appendChild(tr);
    tbody.appendChild(detail);
  });
}

/* ---------- charts ---------- */

function renderOverallCharts(matches, teams) {
  const stats = teams.map((t) => computeTeamStats(matches, t.name));
  const colors = teams.map((t) => TEAM_COLORS[t.id] || { bg: "rgba(100,100,100,0.7)", border: "#666" });

  // Results bar chart: one bar per team win + one bar for draws
  const resultsLabels = [teams[0].name, "Empates", teams[1].name];
  const resultsData = [stats[0].wins, stats[0].draws, stats[1].wins];
  const resultsBg = [colors[0].bg, "rgba(243,156,18,0.7)", colors[1].bg];
  const resultsBorder = [colors[0].border, "#f39c12", colors[1].border];

  new Chart(document.getElementById("results-chart"), {
    type: "bar",
    data: {
      labels: resultsLabels,
      datasets: [
        {
          data: resultsData,
          backgroundColor: resultsBg,
          borderColor: resultsBorder,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });

  // Goals bar chart: only scored goals per team, in team colors
  new Chart(document.getElementById("goals-chart"), {
    type: "bar",
    data: {
      labels: teams.map((t) => t.name),
      datasets: [
        {
          data: stats.map((s) => s.scored),
          backgroundColor: colors.map((c) => c.bg),
          borderColor: colors.map((c) => c.border),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
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
              <th>Equipa</th><th>J</th><th>V</th><th>E</th><th>D</th>
              <th>GM</th><th>GS</th><th>DG</th>
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

  // Monthly trend charts per team, split by result trends and goal trends
  teams.forEach((team) => {
    const resultsCard = document.createElement("div");
    resultsCard.className = "chart-card";
    const resultsCanvas = document.createElement("canvas");
    resultsCard.innerHTML = `<h3>${team.name} – Resultados Mensais</h3>`;
    resultsCard.appendChild(resultsCanvas);
    chartsContainer.appendChild(resultsCard);

    const goalsCard = document.createElement("div");
    goalsCard.className = "chart-card";
    const goalsCanvas = document.createElement("canvas");
    goalsCard.innerHTML = `<h3>${team.name} – Golos Mensais</h3>`;
    goalsCard.appendChild(goalsCanvas);
    chartsContainer.appendChild(goalsCard);

    const labels = sortedKeys.map(monthLabel);
    const winsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).wins);
    const drawsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).draws);
    const defeatsData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).defeats);
    const scoredData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).scored);
    const allowedData = sortedKeys.map((k) => computeTeamStats(months[k], team.name).allowed);

    const colors = TEAM_COLORS[team.id] || { bg: "rgba(100,100,100,0.7)", border: "#666" };

    new Chart(resultsCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Vitórias", data: winsData, borderColor: "#27ae60", backgroundColor: "rgba(39,174,96,0.15)", fill: false, tension: 0.3 },
          { label: "Empates", data: drawsData, borderColor: "#f39c12", backgroundColor: "rgba(243,156,18,0.15)", fill: false, tension: 0.3 },
          { label: "Derrotas", data: defeatsData, borderColor: "#e74c3c", backgroundColor: "rgba(231,76,60,0.15)", fill: false, tension: 0.3 },
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

    new Chart(goalsCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Golos Marcados", data: scoredData, borderColor: colors.border, backgroundColor: colors.bg, fill: false, tension: 0.3 },
          { label: "Golos Sofridos", data: allowedData, borderColor: "#999", backgroundColor: "rgba(153,153,153,0.15)", fill: false, tension: 0.3 },
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

/* ---------- rankings ---------- */

function renderRankings(matches) {
  const container = document.getElementById("rankings-grid");
  container.innerHTML = "";

  // --- Month rankings ---
  const months = groupByMonth(matches);
  const monthTotals = Object.entries(months).map(([key, ms]) => ({
    label: monthLabel(key),
    goals: ms.reduce((sum, m) => sum + m.homeGoals + m.awayGoals, 0),
    games: ms.length,
  }));

  const bestMonth  = monthTotals.reduce((a, b) => (b.goals > a.goals ? b : a));
  const worstMonth = monthTotals.reduce((a, b) => (b.goals < a.goals ? b : a));

  // --- Match rankings ---
  const matchTotals = matches.map((m) => ({
    total: m.homeGoals + m.awayGoals,
    label: `${m.homeTeam} ${m.homeGoals}–${m.awayGoals} ${m.awayTeam}`,
    date: new Date(m.date).toLocaleDateString("pt-PT", { year: "numeric", month: "short", day: "numeric" }),
  }));

  const bestMatch  = matchTotals.reduce((a, b) => (b.total > a.total ? b : a));
  const worstMatch = matchTotals.reduce((a, b) => (b.total < a.total ? b : a));

  const cards = [
    {
      icon: "🏆",
      title: "Mês com mais golos",
      highlight: bestMonth.label,
      detail: `${bestMonth.goals} golos em ${bestMonth.games} jogo${bestMonth.games !== 1 ? "s" : ""}`,
      mod: "best",
    },
    {
      icon: "📉",
      title: "Mês com menos golos",
      highlight: worstMonth.label,
      detail: `${worstMonth.goals} golos em ${worstMonth.games} jogo${worstMonth.games !== 1 ? "s" : ""}`,
      mod: "worst",
    },
    {
      icon: "⚽",
      title: "Jogo com mais golos",
      highlight: bestMatch.label,
      detail: `${bestMatch.total} golos · ${bestMatch.date}`,
      mod: "best",
    },
    {
      icon: "🔒",
      title: "Jogo com menos golos",
      highlight: worstMatch.label,
      detail: `${worstMatch.total} golos · ${worstMatch.date}`,
      mod: "worst",
    },
  ];

  cards.forEach(({ icon, title, highlight, detail, mod }) => {
    const card = document.createElement("div");
    card.className = `ranking-card ranking-card--${mod}`;
    card.innerHTML = `
      <div class="ranking-icon">${icon}</div>
      <div class="ranking-title">${title}</div>
      <div class="ranking-highlight">${highlight}</div>
      <div class="ranking-detail">${detail}</div>`;
    container.appendChild(card);
  });
}

/* ---------- player stats ---------- */

function computePlayerStats(matches) {
  const players = {};

  matches.forEach((m) => {
    const homeWon = m.homeGoals > m.awayGoals;
    const draw    = m.homeGoals === m.awayGoals;

    [
      { list: m.homePlayers, teamId: m.home, won: homeWon, drew: draw },
      { list: m.awayPlayers, teamId: m.away, won: !homeWon && !draw, drew: draw },
    ].forEach(({ list, teamId, won, drew }) => {
      if (!list) return;
      list.forEach((name) => {
        if (!players[name]) {
          players[name] = { name, played: 0, wins: 0, draws: 0, losses: 0, teams: {} };
        }
        const p = players[name];
        p.played++;
        if (won)       p.wins++;
        else if (drew) p.draws++;
        else           p.losses++;
        p.teams[teamId] = (p.teams[teamId] || 0) + 1;
      });
    });
  });

  return Object.values(players).sort(
    (a, b) => b.played - a.played || a.name.localeCompare(b.name)
  );
}

function renderPlayersTable(matches, teams) {
  const stats = computePlayerStats(matches);
  const tbody = document.querySelector("#players-table tbody");
  const playersTotal = document.querySelector("#players-total");
  playersTotal.innerHTML = stats.length.toString();
  tbody.innerHTML = "";

  stats.forEach((p) => {
    const winPct = p.played ? Math.round((p.wins / p.played) * 100) : 0;
    const teamBadges = Object.entries(p.teams)
      .map(([id, count]) => {
        const team = teams.find((t) => t.id === id);
        return `<span class="team-badge team-badge--${id}" title="${team ? team.name : id}">${team ? team.name : id} (${count})</span>`;
      })
      .join(" ");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:left;font-weight:600">${p.name}</td>
      <td>${p.played}</td>
      <td class="team-badges-cell">${teamBadges}</td>
      <td>${p.wins}</td>
      <td>${p.draws}</td>
      <td>${p.losses}</td>
      <td>${winPct}%</td>`;
    tbody.appendChild(tr);
  });
}


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

  renderNextMatch(matches, teams);
  renderOverallTable(matches, teams);
  renderMatchHistory(matches);
  renderOverallCharts(matches, teams);
  renderMonthlySection(matches, teams);
  renderRankings(matches);
  renderPlayersTable(matches, teams);
}

document.addEventListener("DOMContentLoaded", init);
