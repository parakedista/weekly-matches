const TEAM_COLORS = {
  amigos: { bg: "rgba(200,16,46,0.7)",  border: "#C8102E" },
  tunel:  { bg: "rgba(11,60,93,0.7)",   border: "#0B3C5D" },
};
const COLUMN_TOOLTIPS = {
  "J":         { title: "Jogos disputados",              desc: null },
  "Pts":       { title: "Pontos",             desc: null },
  "V":         { title: "Vitórias",           desc: null },
  "E":         { title: "Empates",            desc: null },
  "D":         { title: "Derrotas",           desc: null },
  "GM":        { title: "Golos Marcados",     desc: "Número de golos que esta equipa marcou." },
  "GS":        { title: "Golos Sofridos",     desc: "Número de golos que esta equipa sofreu." },
  "DG":        { title: "Diferença de Golos", desc: "Golos Marcados - Golos Sofridos." },
  "Últimos 5": { title: "Últimos 5 Jogos",    desc: null },
  "PPJ":       { title: "Pontos por Jogo",    desc: "Média de pontos ganhos por jogo ao longo da competição.<br/>Os números mais altos indicam a equipa mais forte.<br/>Max. <div class='form-badge--v' style='display: inline; padding: 0.1rem 0.2rem; border-radius: 4px;'>3.00</div> Pontos" },
  "MGJ":       { title: "Média de Golos por Jogo",     desc: "Média total de golos por jogo.<br/>Calculada ao longo da época." },
};

function applyTooltips(thead) {
  thead.querySelectorAll("th").forEach((th) => {
    const tip = COLUMN_TOOLTIPS[th.textContent.trim()];
    if (tip) {
      th.style.cursor = "pointer";
      const span = document.createElement("span");
      span.className = "th-tooltip";
      span.innerHTML = `<span class="th-tooltip__title">${tip.title}</span>${tip.desc ? `<span class="th-tooltip__desc">${tip.desc}</span>` : ""}`;
      th.appendChild(span);

      th.addEventListener("mousemove", (e) => {
        span.style.left = `${e.clientX + 12}px`;
        span.style.top  = `${e.clientY - 28}px`;
      });
    }
  });
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ---------- helpers ---------- */

function computeTeamStats(matches, teamName) {
  let wins = 0, draws = 0, defeats = 0, scored = 0, allowed = 0, points = 0;

  matches.forEach((m) => {
    const isHome = m.homeTeam === teamName;
    const gf = isHome ? m.homeGoals : m.awayGoals;
    const ga = isHome ? m.awayGoals : m.homeGoals;
    scored += gf;
    allowed += ga;
    if (gf > ga) {
      wins++;
      points += 3;
    } else if (gf === ga) {
      draws++;
      points += 1;
    }
    else defeats++;
  });

  return {
    played: matches.length,
    points,
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

  applyTooltips(document.querySelector("#stats-table thead"));

  const sortedTeams = [...teams]
    .map((team) => ({ team, s: computeTeamStats(matches, team.name) }))
    .sort((a, b) => b.s.points - a.s.points || b.s.scored - a.s.scored);

  sortedTeams.forEach(({ team, s }) => {
    const form = getLastFiveResults(matches, team.name);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:left;font-weight:600">${team.name}</td>
      <td>${s.played}</td>
      <td>${s.points}</td>
      <td>${s.wins}</td>
      <td>${s.draws}</td>
      <td>${s.defeats}</td>
      <td>${s.scored}</td>
      <td>${s.allowed}</td>
      <td>${s.diff > 0 ? "+" : ""}${s.diff}</td>
      <td class="form-cell">${renderFormBadges(form)}</td>
      <td>${(s.points/s.played).toFixed(2)}</td>
      <td>${(s.scored/s.played).toFixed(2)}</td>`;
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
      (p) => `<li><span class="player-dot player-dot--${m.home}"></span>${p}${m.motm === p ? ' <span class="motm-badge" title="Man of the Match">⭐ MOTM</span>' : ""}</li>`
    ).join("");
    const awayPlayers = (m.awayPlayers || []).map(
      (p) => `<li><span class="player-dot player-dot--${m.away}"></span>${p}${m.motm === p ? ' <span class="motm-badge" title="Man of the Match">⭐ MOTM</span>' : ""}</li>`
    ).join("");

    const motmBanner = m.motm
      ? `<div class="match-detail-motm">⭐ Man of the Match: <strong>${m.motm}</strong></div>`
      : "";

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
        ${motmBanner}
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
    const stats = teams
      .map((t) => ({ team: t.name, ...computeTeamStats(months[key], t.name) }))
      .sort((a, b) => b.points - a.points || b.scored - a.scored);

    wrapper.innerHTML = `
      <h3>${monthLabel(key)}</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Equipa</th><th>J</th><th>Pts</th><th>V</th><th>E</th><th>D</th>
              <th>GM</th><th>GS</th><th>DG</th><th>PPJ</th><th>MGJ</th>
            </tr>
          </thead>
          <tbody>
            ${stats
              .map(
                (s) => `<tr>
                  <td style="text-align:left;font-weight:600">${s.team}</td>
                  <td>${s.played}</td>
                  <td>${s.points}</td>
                  <td>${s.wins}</td>
                  <td>${s.draws}</td>
                  <td>${s.defeats}</td>
                  <td>${s.scored}</td>
                  <td>${s.allowed}</td>
                  <td>${s.diff > 0 ? "+" : ""}${s.diff}</td>
                  <td>${(s.points / s.played).toFixed(2)}</td>
                  <td>${(s.scored / s.played).toFixed(2)}</td>                  
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    tablesContainer.appendChild(wrapper);
    applyTooltips(wrapper.querySelector("thead"));
  });

  // Combined monthly goals chart – one line per team
  const goalsCard = document.createElement("div");
  goalsCard.className = "chart-card";
  const goalsCanvas = document.createElement("canvas");
  goalsCard.innerHTML = `<h3>Golos Marcados por Mês</h3>`;
  goalsCard.appendChild(goalsCanvas);
  chartsContainer.appendChild(goalsCard);

  const labels = sortedKeys.map(monthLabel);

  new Chart(goalsCanvas, {
    type: "line",
    data: {
      labels,
      datasets: teams.map((team) => {
        const colors = TEAM_COLORS[team.id] || { bg: "rgba(100,100,100,0.7)", border: "#666" };
        return {
          label: team.name,
          data: sortedKeys.map((k) => computeTeamStats(months[k], team.name).scored),
          borderColor: colors.border,
          backgroundColor: colors.bg,
          fill: false,
          tension: 0.3,
          pointRadius: 4,
        };
      }),
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });

  // Combined monthly results chart – wins per team + draws
  const resultsCard = document.createElement("div");
  resultsCard.className = "chart-card";
  const resultsCanvas = document.createElement("canvas");
  resultsCard.innerHTML = `<h3>Resultados Mensais</h3>`;
  resultsCard.appendChild(resultsCanvas);
  chartsContainer.appendChild(resultsCard);

  const drawsData = sortedKeys.map((k) => computeTeamStats(months[k], teams[0].name).draws);

  new Chart(resultsCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        ...teams.map((team) => {
          const colors = TEAM_COLORS[team.id] || { bg: "rgba(100,100,100,0.7)", border: "#666" };
          return {
            label: `Vitórias ${team.name}`,
            data: sortedKeys.map((k) => computeTeamStats(months[k], team.name).wins),
            borderColor: colors.border,
            backgroundColor: colors.bg,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
          };
        }),
        {
          label: "Empates",
          data: drawsData,
          borderColor: "#f39c12",
          backgroundColor: "rgba(243,156,18,0.15)",
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

/* ---------- rankings ---------- */

function renderRankings(matches) {
  const container = document.getElementById("rankings-grid");
  container.innerHTML = "";

  // --- Month rankings ---
  const months = groupByMonth(matches);
  const monthTotals = Object.entries(months).map(([key, ms]) => ({
    key,
    label: monthLabel(key),
    goals: ms.reduce((sum, m) => sum + m.homeGoals + m.awayGoals, 0),
    games: ms.length,
  }));

  const bestMonth  = monthTotals.reduce((a, b) => (b.goals > a.goals ? b : a));

  // Exclude current month from worst-month ranking (still in progress),
  // unless it's the only month available.
  const currentMonthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();
  const monthTotalsForWorst = monthTotals.filter((m) => m.key !== currentMonthKey);
  const worstMonthSource = monthTotalsForWorst.length > 0 ? monthTotalsForWorst : monthTotals;
  const worstMonth = worstMonthSource.reduce((a, b) => (b.goals < a.goals ? b : a));

  // --- Match rankings ---
  const matchTotals = matches.map((m) => ({
    total: m.homeGoals + m.awayGoals,
    label: `${m.homeTeam} ${m.homeGoals}–${m.awayGoals} ${m.awayTeam}`,
    date: new Date(m.date).toLocaleDateString("pt-PT", { year: "numeric", month: "short", day: "numeric" }),
  }));

  const bestMatch  = matchTotals.reduce((a, b) => (b.total > a.total ? b : a));
  const worstMatch = matchTotals.reduce((a, b) => (b.total < a.total ? b : a));

  // --- Biggest victory ---
  const victories = matches
    .map((m) => ({
      diff: Math.abs(m.homeGoals - m.awayGoals),
      winner: m.homeGoals > m.awayGoals ? m.homeTeam : m.awayTeam,
      label: `${m.homeTeam} ${m.homeGoals}–${m.awayGoals} ${m.awayTeam}`,
      date: new Date(m.date).toLocaleDateString("pt-PT", { year: "numeric", month: "short", day: "numeric" }),
    }))
    .filter((m) => m.diff > 0); // exclude draws

  const biggestVictory = victories.reduce((a, b) => (b.diff > a.diff ? b : a));

  // --- Best win streak per team ---
  const teamNames = [...new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]))];
  const bestStreak = teamNames.map((name) => {
    let maxStreak = 0, cur = 0, startIdx = 0, bestStart = 0, bestEnd = 0;
    matches.forEach((m, i) => {
      const isHome = m.homeTeam === name;
      if (m.homeTeam !== name && m.awayTeam !== name) return;
      const gf = isHome ? m.homeGoals : m.awayGoals;
      const ga = isHome ? m.awayGoals : m.homeGoals;
      if (gf > ga) {
        if (cur === 0) startIdx = i;
        cur++;
        if (cur > maxStreak) { maxStreak = cur; bestStart = startIdx; bestEnd = i; }
      } else {
        cur = 0;
      }
    });
    return { name, streak: maxStreak, from: matches[bestStart], to: matches[bestEnd] };
  });
  const topStreak = bestStreak.reduce((a, b) => (b.streak > a.streak ? b : a));
  const streakDateFmt = (m) => new Date(m.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });

  const totalGoals = matches.reduce((sum, m) => sum + m.homeGoals + m.awayGoals, 0);
  const avgGoals   = (totalGoals / matches.length).toFixed(1);

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
    {
      icon: "🥇",
      title: "Maior Vitória",
      highlight: biggestVictory.label,
      detail: `${biggestVictory.winner} ganhou por ${biggestVictory.diff} · ${biggestVictory.date}`,
      mod: "best",
    },
    {
      icon: "🔥",
      title: "Melhor sequência de vitórias",
      highlight: `${topStreak.name} — ${topStreak.streak} seguidas`,
      detail: topStreak.streak > 0
        ? `De ${streakDateFmt(topStreak.from)} a ${streakDateFmt(topStreak.to)}`
        : "Sem sequência ainda",
      mod: "best",
    },
    {
      icon: "📊",
      title: "Média de golos por jogo",
      highlight: avgGoals,
      detail: `${totalGoals} golos em ${matches.length} jogos`,
      mod: "avg",
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
          players[name] = { name, played: 0, wins: 0, draws: 0, losses: 0, motm: 0, teams: {} };
        }
        const p = players[name];
        p.played++;
        if (won)       p.wins++;
        else if (drew) p.draws++;
        else           p.losses++;
        p.teams[teamId] = (p.teams[teamId] || 0) + 1;
      });
    });

    // MOTM
    if (m.motm) {
      if (!players[m.motm]) {
        players[m.motm] = { name: m.motm, played: 0, wins: 0, draws: 0, losses: 0, motm: 0, teams: {} };
      }
      players[m.motm].motm++;
    }
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
      <td>${p.motm > 0 ? `<span class="motm-count">⭐ ${p.motm}</span>` : "—"}</td>
      <td>${p.wins}</td>
      <td>${p.draws}</td>
      <td>${p.losses}</td>
      <td>${winPct}%</td>`;
    tbody.appendChild(tr);
  });
}


/* ---------- season progress ---------- */

function computeSeasonProgress(matches, seasonStart, seasonEnd) {
  const [sy, sm, sd] = seasonStart.split("-").map(Number);
  const [ey, em, ed] = seasonEnd.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end   = new Date(ey, em - 1, ed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const playedDates = new Set(matches.map((m) => m.date));

  // Today as a YYYY-MM-DD string (local time, no timezone shift)
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Enumerate every Monday from start to end (inclusive) using local date arithmetic
  const allMondays = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  // Advance to the first Monday on or after seasonStart (0=Sun,1=Mon,...,6=Sat)
  const dayOfWeek = cur.getDay();
  if (dayOfWeek !== 1) {
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
    cur.setDate(cur.getDate() + daysUntilMonday);
  }
  const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= endLocal) {
    const ds = [
      cur.getFullYear(),
      String(cur.getMonth() + 1).padStart(2, "0"),
      String(cur.getDate()).padStart(2, "0"),
    ].join("-");
    allMondays.push(ds);
    cur.setDate(cur.getDate() + 7);
  }

  const total = allMondays.length;
  let played = 0, cancelled = 0, remaining = 0;

  allMondays.forEach((d) => {
    if (playedDates.has(d)) {
      played++;
    } else if (d < todayStr) {
      cancelled++;
    } else {
      remaining++;
    }
  });

  return { total, played, cancelled, remaining, allMondays, seasonStart, seasonEnd };
}

function renderSeasonProgress(matches, seasonStart, seasonEnd) {
  const { total, played, cancelled, remaining } = computeSeasonProgress(matches, seasonStart, seasonEnd);

  const pctPlayed    = (played    / total) * 100;
  const pctCancelled = (cancelled / total) * 100;
  const pctRemaining = (remaining / total) * 100;

  document.getElementById("sp-seg-played").style.width    = `${pctPlayed}%`;
  document.getElementById("sp-seg-cancelled").style.width = `${pctCancelled}%`;
  document.getElementById("sp-seg-remaining").style.width = `${pctRemaining}%`;

  const fmt = (d) => new Date(d).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  document.getElementById("sp-label-start").textContent = fmt(seasonStart);
  document.getElementById("sp-label-end").textContent   = fmt(seasonEnd);

  const statsEl = document.getElementById("sp-stats");
  const doneTotal = played + cancelled;
  const overallPct = Math.round((doneTotal / total) * 100);

  const pctPlayedStat    = Math.round((played    / total) * 100);
  const pctCancelledStat = Math.round((cancelled / total) * 100);
  const pctRemainingStat = Math.round((remaining / total) * 100);

  statsEl.innerHTML = `
    <div class="sp-stat sp-stat--played">
      <span class="sp-stat__value">${played}</span>
      <span class="sp-stat__label">${pctPlayedStat}% Jogados</span>
    </div>
    <div class="sp-stat sp-stat--cancelled">
      <span class="sp-stat__value">${cancelled}</span>
      <span class="sp-stat__label">${pctCancelledStat}% Cancelados</span>
    </div>
    <div class="sp-stat sp-stat--remaining">
      <span class="sp-stat__value">${remaining}</span>
      <span class="sp-stat__label">${pctRemainingStat}% Por Jogar</span>
    </div>
    <div class="sp-stat sp-stat--total">
      <span class="sp-stat__value">${total}</span>
      <span class="sp-stat__label">Total Segundas</span>
    </div>
    <div class="sp-stat sp-stat--pct">
      <span class="sp-stat__value">${overallPct}%</span>
      <span class="sp-stat__label">Época Decorrida</span>
    </div>`;
}

/* ---------- tabs ---------- */

function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels  = document.querySelectorAll(".tab-panel");

  function activateTab(tabId) {
    buttons.forEach((btn) => btn.classList.toggle("tab-btn--active", btn.dataset.tab === tabId));
    panels.forEach((panel) => { panel.hidden = panel.id !== tabId; });
    history.replaceState(null, "", `#${tabId}`);
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

  // Restore from URL hash on load
  const hash = location.hash.slice(1);
  if (hash && document.getElementById(hash)) activateTab(hash);
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
  renderSeasonProgress(matches, data.seasonStart, data.seasonEnd);
  renderOverallTable(matches, teams);
  renderMatchHistory(matches);
  renderOverallCharts(matches, teams);
  renderMonthlySection(matches, teams);
  renderRankings(matches);
  renderPlayersTable(matches, teams);
  initTabs();
}

document.addEventListener("DOMContentLoaded", init);
