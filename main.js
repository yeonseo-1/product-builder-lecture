var LOTTO_MIN = 1;
var LOTTO_MAX = 45;
var PICK_COUNT = 6;
var THEME_STORAGE_KEY = 'lotto-lab-theme';

var excludedNumbersInput = document.querySelector('#excludedNumbers');
var ticketCountInput = document.querySelector('#ticketCount');
var simulationCountInput = document.querySelector('#simulationCount');
var generateButton = document.querySelector('#generateButton');
var simulateButton = document.querySelector('#simulateButton');
var themeToggleButton = document.querySelector('#themeToggle');
var ticketsElement = document.querySelector('#tickets');
var selectionSummaryElement = document.querySelector('#selectionSummary');
var simulationResultElement = document.querySelector('#simulationResult');

var currentTickets = [];

// Tab Logic
var tabButtons = document.querySelectorAll('.tab-button');
var tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    var tabId = button.getAttribute('data-tab');
    
    tabButtons.forEach(function(btn) { btn.classList.remove('active'); });
    tabContents.forEach(function(content) { content.classList.remove('active'); });
    
    button.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  });
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (theme === 'dark') {
    themeToggleButton.textContent = '화이트모드';
  } else {
    themeToggleButton.textContent = '다크모드';
  }
}

function initializeTheme() {
  var savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var nextTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(nextTheme);
}

function toggleTheme() {
  var currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

function parseExcludedNumbers() {
  var raw = excludedNumbersInput.value.trim();
  if (raw === '') return [];
  var values = raw.split(',').map(function(v) { return Number.parseInt(v.trim(), 10); }).filter(function(v) { return !Number.isNaN(v); });
  var invalidValue = values.find(function(v) { return v < LOTTO_MIN || v > LOTTO_MAX; });
  if (invalidValue) throw new Error('제외 번호는 1-45까지만 가능합니다.');
  return Array.from(new Set(values)).sort(function(a, b) { return a - b; });
}

function createPool(excludedNumbers) {
  var excludedSet = new Set(excludedNumbers);
  var pool = [];
  for (var i = LOTTO_MIN; i <= LOTTO_MAX; i++) {
    if (!excludedSet.has(i)) pool.push(i);
  }
  if (pool.length < PICK_COUNT) throw new Error('제외 번호가 너무 많습니다.');
  return pool;
}

function shuffle(array) {
  var next = array.slice();
  for (var i = next.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function generateTicket(pool) {
  return shuffle(pool).slice(0, PICK_COUNT).sort(function(a, b) { return a - b; });
}

function generateTickets(count, excludedNumbers) {
  var pool = createPool(excludedNumbers);
  var tickets = [];
  for (var i = 0; i < count; i++) {
    tickets.push(generateTicket(pool));
  }
  return tickets;
}

function renderTickets(tickets, excludedNumbers) {
  ticketsElement.innerHTML = '';
  tickets.forEach(function(ticket, index) {
    var card = document.createElement('div');
    card.className = 'ticket-card';
    var title = document.createElement('div');
    title.className = 'ticket-title';
    title.textContent = '조합 ' + (index + 1);
    var balls = document.createElement('div');
    balls.className = 'ball-row';
    ticket.forEach(function(num) {
      var ball = document.createElement('div');
      ball.className = 'ball band-' + Math.floor((num - 1) / 10);
      ball.textContent = num;
      balls.appendChild(ball);
    });
    card.appendChild(title);
    card.appendChild(balls);
    ticketsElement.appendChild(card);
  });
  var label = excludedNumbers.length > 0 ? excludedNumbers.join(', ') : '없음';
  selectionSummaryElement.textContent = '제외 번호: ' + label;
}

function drawWinningNumbers() {
  var pool = [];
  for (var i = LOTTO_MIN; i <= LOTTO_MAX; i++) pool.push(i);
  return generateTicket(pool);
}

function countMatches(ticket, winning) {
  var winningSet = new Set(winning);
  return ticket.filter(function(n) { return winningSet.has(n); }).length;
}

function handleGenerate() {
  try {
    var excluded = parseExcludedNumbers();
    var count = Math.min(Math.max(Number.parseInt(ticketCountInput.value, 10) || 1, 1), 10);
    currentTickets = generateTickets(count, excluded);
    renderTickets(currentTickets, excluded);
    simulationResultElement.className = 'simulation-card empty';
    simulationResultElement.textContent = '번호 생성 완료. 시뮬레이션을 실행하세요.';
  } catch (e) {
    simulationResultElement.className = 'simulation-card error';
    simulationResultElement.textContent = e.message;
  }
}

function handleSimulate() {
  try {
    if (currentTickets.length === 0) handleGenerate();
    var iterations = Number.parseInt(simulationCountInput.value, 10) || 10000;
    var ticket = currentTickets[0];
    var best = 0;
    for (var i = 0; i < iterations; i++) {
      best = Math.max(best, countMatches(ticket, drawWinningNumbers()));
    }
    simulationResultElement.className = 'simulation-card';
    simulationResultElement.innerHTML = '<div class="result-head">' + ticket.join(' / ') + '</div>' +
      '<p>' + iterations.toLocaleString() + '회 시뮬레이션 결과</p>' +
      '<p>최고 일치 개수: <strong>' + best + '개</strong></p>';
  } catch (e) {
    simulationResultElement.className = 'simulation-card error';
    simulationResultElement.textContent = e.message;
  }
}

themeToggleButton.addEventListener('click', toggleTheme);
generateButton.addEventListener('click', handleGenerate);
simulateButton.addEventListener('click', handleSimulate);

initializeTheme();
handleGenerate();
