/* ── Constants ─────────────────────────────────────────────── */
const DATA_URL = 'data/matches.json';

const TEAM_COLORS = {
  amigos: { bg: '#1a6b3a', light: 'rgba(26,107,58,.4)' },
  tunel:  { bg: '#1a3a6b', light: 'rgba(26,58,107,.4)' },
};

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

/* ── Data loading ──────────────────────────────────────────── */
async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ── Stats computation ─────────────────────────────────────── */
function computeTeamStats(teamId, matches) {
  const stats = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
  for (const m of matches) {
    const isHome = m.home === teamId;
    const gf = isHome ? m.homeGoals : m.awayGoals;
    const ga = isHome ? m.awayGoals : m.homeGoals;
    stats.goalsFor     += gf;
    stats.goalsAgainst += ga;
    if (gf > ga)      stats.wins++;
    else if (gf < ga) stats.losses++;
    else              stats.draws++;
  }
  stats.played = stats.wins + stats.draws + stats.losses;
  stats.points = stats.wins * 3 + stats.draws;
  stats.goalDiff = stats.goalsFor - stats.goalsAgainst;
  return stats;
}

/* group matches by "YYYY-MM" */
function groupByMonth(matches) {
  const map = {};
  for (const m of matches) {
    const key = m.date.slice(0, 7);
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  return map;
}

/* ── Render helpers ────────────────────────────────────────── */
function formatDate(iso) {
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

function monthLabel(key) {
  const [, mo] = key.split('-');
  return MONTH_NAMES[parseInt(mo, 10) - 1];
}

/* ── Overall stats table ───────────────────────────────────── */
function renderOverallTable(teams, allMatches) {
  const tbody = document.querySelector('#overall-table tbody');
  tbody.innerHTML = '';
  for (const team of teams) {
    const s = computeTeamStats(team.id, allMatches);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="team-badge badge-${team.id}"></span>${team.name}</td>
      <td>${s.played}</td>
      <td class="win">${s.wins}</td>
      <td class="draw">${s.draws}</td>
      <td class="loss">${s.losses}</td>
      <td>${s.goalsFor}</td>
      <td>${s.goalsAgainst}</td>
      <td>${s.goalDiff > 0 ? '+' : ''}${s.goalDiff}</td>
      <td><strong>${s.points}</strong></td>
    `;
    tbody.appendChild(tr);
  }
}

/* ── Charts ────────────────────────────────────────────────── */
function renderResultsChart(teams, allMatches) {
  const labels  = teams.map(t => t.name);
  const wins    = teams.map(t => computeTeamStats(t.id, allMatches).wins);
  const draws   = teams.map(t => computeTeamStats(t.id, allMatches).draws);
  const losses  = teams.map(t => computeTeamStats(t.id, allMatches).losses);

  new Chart(document.getElementById('chart-results'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Vitórias',  data: wins,   backgroundColor: '#198754' },
        { label: 'Empates',   data: draws,  backgroundColor: '#fd7e14' },
        { label: 'Derrotas',  data: losses, backgroundColor: '#dc3545' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, title: { display: false } },
      scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

function renderGoalsChart(teams, allMatches) {
  const labels   = teams.map(t => t.name);
  const goalsFor = teams.map(t => computeTeamStats(t.id, allMatches).goalsFor);
  const goalsAg  = teams.map(t => computeTeamStats(t.id, allMatches).goalsAgainst);

  new Chart(document.getElementById('chart-goals'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Golos Marcados', data: goalsFor, backgroundColor: teams.map(t => TEAM_COLORS[t.id].bg) },
        { label: 'Golos Sofridos', data: goalsAg,  backgroundColor: teams.map(t => TEAM_COLORS[t.id].light) },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

function renderGoalsTrendChart(teams, allMatches) {
  const sorted   = [...allMatches].sort((a, b) => a.date.localeCompare(b.date));
  const labels   = sorted.map(m => formatDate(m.date));
  const datasets = teams.map(t => {
    let cumulative = 0;
    return {
      label: t.name,
      data: sorted.map(m => {
        cumulative += m.home === t.id ? m.homeGoals : m.awayGoals;
        return cumulative;
      }),
      borderColor: TEAM_COLORS[t.id].bg,
      backgroundColor: TEAM_COLORS[t.id].light,
      fill: true,
      tension: .3,
      pointRadius: 4,
    };
  });

  new Chart(document.getElementById('chart-trend'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Golos Acumulados por Jornada' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

/* ── Monthly stats ─────────────────────────────────────────── */
function renderMonthlyStats(teams, allMatches) {
  const byMonth = groupByMonth(allMatches);
  const container = document.getElementById('monthly-container');
  container.innerHTML = '';

  for (const key of Object.keys(byMonth).sort()) {
    const monthMatches = byMonth[key];
    const block = document.createElement('div');
    block.className = 'month-block card';

    const title = document.createElement('h3');
    title.textContent = monthLabel(key);
    block.appendChild(title);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-responsive';
    tableWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Equipa</th><th>J</th><th>V</th><th>E</th><th>D</th>
            <th>GM</th><th>GS</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map(t => {
            const s = computeTeamStats(t.id, monthMatches);
            return `<tr>
              <td><span class="team-badge badge-${t.id}"></span>${t.name}</td>
              <td>${s.played}</td>
              <td class="win">${s.wins}</td>
              <td class="draw">${s.draws}</td>
              <td class="loss">${s.losses}</td>
              <td>${s.goalsFor}</td>
              <td>${s.goalsAgainst}</td>
              <td><strong>${s.points}</strong></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    block.appendChild(tableWrap);
    container.appendChild(block);
  }
}

/* ── Recent matches ────────────────────────────────────────── */
function renderRecentMatches(teams, allMatches) {
  const sorted = [...allMatches].sort((a, b) => b.date.localeCompare(a.date));
  const teamName = id => teams.find(t => t.id === id)?.name ?? id;
  const ul = document.getElementById('matches-list');
  ul.innerHTML = '';

  for (const m of sorted) {
    const li = document.createElement('li');
    li.className = 'match-item';
    li.innerHTML = `
      <span class="match-date">${formatDate(m.date)}</span>
      <span class="match-teams">
        <span class="team-badge badge-${m.home}"></span>${teamName(m.home)}
        &nbsp;vs&nbsp;
        <span class="team-badge badge-${m.away}"></span>${teamName(m.away)}
      </span>
      <span class="match-score">${m.homeGoals} – ${m.awayGoals}</span>
    `;
    ul.appendChild(li);
  }
}

/* ── Bootstrap ─────────────────────────────────────────────── */
async function main() {
  const loading = document.getElementById('loading');
  try {
    const data = await loadData();
    loading.remove();

    renderOverallTable(data.teams, data.matches);
    renderResultsChart(data.teams, data.matches);
    renderGoalsChart(data.teams, data.matches);
    renderGoalsTrendChart(data.teams, data.matches);
    renderMonthlyStats(data.teams, data.matches);
    renderRecentMatches(data.teams, data.matches);

    document.getElementById('app').style.display = '';
  } catch (err) {
    loading.innerHTML = `<div class="error-msg">Erro ao carregar os dados: ${err.message}</div>`;
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', main);
