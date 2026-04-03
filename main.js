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

  if (raw === '') {
    return [];
  }

  var values = raw
    .split(',')
    .map(function (value) {
      return Number.parseInt(value.trim(), 10);
    })
    .filter(function (value) {
      return Number.isNaN(value) === false;
    });

  var invalidValue = values.find(function (value) {
    return value < LOTTO_MIN || value > LOTTO_MAX;
  });

  if (invalidValue) {
    throw new Error('제외 번호는 ' + LOTTO_MIN + '부터 ' + LOTTO_MAX + '까지만 가능합니다.');
  }

  return Array.from(new Set(values)).sort(function (a, b) {
    return a - b;
  });
}

function createPool(excludedNumbers) {
  var excludedSet = new Set(excludedNumbers);
  var pool = [];
  var number;

  for (number = LOTTO_MIN; number <= LOTTO_MAX; number += 1) {
    if (excludedSet.has(number) === false) {
      pool.push(number);
    }
  }

  if (pool.length < PICK_COUNT) {
    throw new Error('제외 번호가 너무 많아서 6개 조합을 만들 수 없습니다.');
  }

  return pool;
}

function shuffle(array) {
  var next = array.slice();
  var index;

  for (index = next.length - 1; index > 0; index -= 1) {
    var randomIndex = Math.floor(Math.random() * (index + 1));
    var temp = next[index];
    next[index] = next[randomIndex];
    next[randomIndex] = temp;
  }

  return next;
}

function generateTicket(pool) {
  return shuffle(pool)
    .slice(0, PICK_COUNT)
    .sort(function (a, b) {
      return a - b;
    });
}

function generateTickets(count, excludedNumbers) {
  var pool = createPool(excludedNumbers);
  var uniqueTickets = new Set();

  while (uniqueTickets.size < count) {
    uniqueTickets.add(generateTicket(pool).join('-'));
  }

  return Array.from(uniqueTickets).map(function (ticket) {
    return ticket.split('-').map(Number);
  });
}

function renderTickets(tickets, excludedNumbers) {
  ticketsElement.innerHTML = '';

  tickets.forEach(function (ticket, index) {
    var article = document.createElement('article');
    article.className = 'ticket-card';

    var title = document.createElement('p');
    title.className = 'ticket-title';
    title.textContent = '조합 ' + (index + 1);

    var balls = document.createElement('div');
    balls.className = 'ball-row';

    ticket.forEach(function (number) {
      var ball = document.createElement('span');
      ball.className = 'ball band-' + Math.floor((number - 1) / 10);
      ball.textContent = String(number);
      balls.appendChild(ball);
    });

    article.appendChild(title);
    article.appendChild(balls);
    ticketsElement.appendChild(article);
  });

  var excludedLabel = excludedNumbers.length > 0 ? excludedNumbers.join(', ') : '없음';
  selectionSummaryElement.textContent = '제외 번호: ' + excludedLabel;
}

function countMatches(ticket, winningNumbers) {
  var winningSet = new Set(winningNumbers);
  return ticket.filter(function (number) {
    return winningSet.has(number);
  }).length;
}

function getRankLabel(matchCount) {
  if (matchCount === 6) {
    return '1등';
  }

  if (matchCount === 5) {
    return '3등 수준';
  }

  if (matchCount === 4) {
    return '4등 수준';
  }

  if (matchCount === 3) {
    return '5등 수준';
  }

  return '낙첨';
}

function renderSimulation(result) {
  simulationResultElement.className = 'simulation-card';
  simulationResultElement.innerHTML = '' +
    '<p class="result-head">' + result.ticket.join(' / ') + '</p>' +
    '<p>' + result.iterations.toLocaleString() + '회 추첨 기준 평균 일치 개수는 <strong>' + result.averageMatches.toFixed(2) + '개</strong>입니다.</p>' +
    '<p>최고 기록은 <strong>' + result.bestMatchCount + '개 일치</strong>였고, 체감 등수로는 <strong>' + getRankLabel(result.bestMatchCount) + '</strong>입니다.</p>' +
    '<p class="subtle">3개 이상 일치한 횟수: ' + result.hit3.toLocaleString() + '회</p>' +
    '<p class="subtle">4개 이상 일치한 횟수: ' + result.hit4.toLocaleString() + '회</p>' +
    '<p class="subtle">5개 이상 일치한 횟수: ' + result.hit5.toLocaleString() + '회</p>' +
    '<p class="subtle">6개 일치한 횟수: ' + result.hit6.toLocaleString() + '회</p>';
}

function showError(message) {
  simulationResultElement.className = 'simulation-card error';
  simulationResultElement.textContent = message;
}

function handleGenerate() {
  try {
    var excludedNumbers = parseExcludedNumbers();
    var ticketCount = Number.parseInt(ticketCountInput.value, 10) || 1;

    currentTickets = generateTickets(Math.min(Math.max(ticketCount, 1), 10), excludedNumbers);
    renderTickets(currentTickets, excludedNumbers);

    simulationResultElement.className = 'simulation-card empty';
    simulationResultElement.textContent = '새 조합이 생성되었습니다. 이제 확률 시뮬레이션을 실행할 수 있습니다.';
  } catch (error) {
    showError(error.message);
  }
}

function drawWinningNumbers() {
  var pool = [];
  var number;

  for (number = LOTTO_MIN; number <= LOTTO_MAX; number += 1) {
    pool.push(number);
  }

  return generateTicket(pool);
}

function handleSimulate() {
  try {
    if (currentTickets.length === 0) {
      handleGenerate();
    }

    var iterations = Number.parseInt(simulationCountInput.value, 10) || 10000;
    var ticket = currentTickets[0];
    var totalMatches = 0;
    var bestMatchCount = 0;
    var hit3 = 0;
    var hit4 = 0;
    var hit5 = 0;
    var hit6 = 0;
    var index;

    for (index = 0; index < iterations; index += 1) {
      var winningNumbers = drawWinningNumbers();
      var matches = countMatches(ticket, winningNumbers);

      totalMatches += matches;
      bestMatchCount = Math.max(bestMatchCount, matches);

      if (matches >= 3) {
        hit3 += 1;
      }
      if (matches >= 4) {
        hit4 += 1;
      }
      if (matches >= 5) {
        hit5 += 1;
      }
      if (matches === 6) {
        hit6 += 1;
      }
    }

    renderSimulation({
      ticket: ticket,
      iterations: iterations,
      averageMatches: totalMatches / iterations,
      bestMatchCount: bestMatchCount,
      hit3: hit3,
      hit4: hit4,
      hit5: hit5,
      hit6: hit6
    });
  } catch (error) {
    showError(error.message);
  }
}

themeToggleButton.addEventListener('click', toggleTheme);
generateButton.addEventListener('click', handleGenerate);
simulateButton.addEventListener('click', handleSimulate);

initializeTheme();
handleGenerate();
