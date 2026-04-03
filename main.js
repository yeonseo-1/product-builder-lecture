var LOTTO_MIN = 1;
var LOTTO_MAX = 45;
var PICK_COUNT = 6;
var THEME_STORAGE_KEY = 'lotto-lab-theme';
var NOTE_STORAGE_KEY = 'lotto-lab-strategy-note';

var excludedNumbersInput = document.querySelector('#excludedNumbers');
var ticketCountInput = document.querySelector('#ticketCount');
var simulationCountInput = document.querySelector('#simulationCount');
var generateButton = document.querySelector('#generateButton');
var simulateButton = document.querySelector('#simulateButton');
var themeToggleButton = document.querySelector('#themeToggle');
var ticketsElement = document.querySelector('#tickets');
var simulationResultElement = document.querySelector('#simulationResult');

var currentTickets = [];

// Tab Logic
var tabButtons = document.querySelectorAll('.tab-button');
var tabContents = document.querySelectorAll('.tab-content');
var footerLinks = document.querySelectorAll('.footer-link');

function switchTab(tabId) {
  tabButtons.forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  tabContents.forEach(function(content) {
    content.classList.toggle('active', content.id === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    switchTab(button.getAttribute('data-tab'));
  });
});

footerLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    switchTab(link.getAttribute('data-tab'));
  });
});

// Strategy Note Logic
var strategyNote = document.querySelector('#strategyNote');
var saveNoteButton = document.querySelector('#saveNoteButton');
var saveStatus = document.querySelector('#saveStatus');

saveNoteButton.addEventListener('click', function() {
  localStorage.setItem(NOTE_STORAGE_KEY, strategyNote.value);
  saveStatus.style.display = 'inline';
  setTimeout(function() { saveStatus.style.display = 'none'; }, 2000);
});

strategyNote.value = localStorage.getItem(NOTE_STORAGE_KEY) || '';

// Modal Logic
var modal = document.querySelector('#policyModal');
var modalBody = document.querySelector('#modalBody');
var closeModal = document.querySelector('.close-modal');
var openPrivacy = document.querySelector('#openPrivacy');
var openTerms = document.querySelector('#openTerms');

var policies = {
  privacy: '<h2>개인정보처리방침</h2><p>Lotto Lab은 사용자의 개인정보를 서버에 저장하지 않습니다. 모든 설정과 메모는 사용자의 브라우저(Local Storage)에만 저장됩니다.</p>',
  terms: '<h2>이용약관</h2><p>본 서비스는 통계적 데이터를 바탕으로 번호를 생성하며, 실제 당첨 결과를 보장하지 않습니다. 모든 구매 결정은 사용자 본인의 책임입니다.</p>'
};

openPrivacy.addEventListener('click', function(e) {
  e.preventDefault();
  modalBody.innerHTML = policies.privacy;
  modal.style.display = 'block';
});

openTerms.addEventListener('click', function(e) {
  e.preventDefault();
  modalBody.innerHTML = policies.terms;
  modal.style.display = 'block';
});

closeModal.onclick = function() { modal.style.display = 'none'; };
window.onclick = function(e) { if (e.target == modal) modal.style.display = 'none'; };

// Lotto Logic (Same as before)
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggleButton.textContent = theme === 'dark' ? '화이트모드' : '다크모드';
  if (typeof DISQUS !== 'undefined') {
    setTimeout(function() { DISQUS.reset({ reload: true }); }, 350);
  }
}

function initializeTheme() {
  var savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  var nextTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(nextTheme);
}

function toggleTheme() {
  var nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

function parseExcludedNumbers() {
  var raw = excludedNumbersInput.value.trim();
  if (!raw) return [];
  return Array.from(new Set(raw.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v >= 1 && v <= 45))).sort((a,b) => a-b);
}

function generateTickets(count, excluded) {
  var pool = [];
  for (var i = 1; i <= 45; i++) if (!excluded.includes(i)) pool.push(i);
  if (pool.length < 6) throw new Error('제외 번호가 너무 많습니다.');
  
  var results = [];
  for (var i = 0; i < count; i++) {
    var ticket = [];
    var tempPool = [...pool];
    for (var j = 0; j < 6; j++) {
      var idx = Math.floor(Math.random() * tempPool.length);
      ticket.push(tempPool.splice(idx, 1)[0]);
    }
    results.push(ticket.sort((a,b) => a-b));
  }
  return results;
}

function renderTickets(tickets) {
  ticketsElement.innerHTML = '';
  tickets.forEach((t, i) => {
    var card = document.createElement('div');
    card.className = 'ticket-card';
    card.innerHTML = `<div class="ticket-title">조합 ${i+1}</div><div class="ball-row">${t.map(n => `<div class="ball band-${Math.floor((n-1)/10)}">${n}</div>`).join('')}</div>`;
    ticketsElement.appendChild(card);
  });
}

function handleGenerate() {
  try {
    var excluded = parseExcludedNumbers();
    currentTickets = generateTickets(parseInt(ticketCountInput.value) || 5, excluded);
    renderTickets(currentTickets);
    simulationResultElement.className = 'simulation-card empty';
    simulationResultElement.textContent = '번호 생성 완료. 시뮬레이션을 실행해 보세요.';
  } catch(e) {
    simulationResultElement.className = 'simulation-card error';
    simulationResultElement.textContent = e.message;
  }
}

function handleSimulate() {
  if (!currentTickets.length) handleGenerate();
  var iterations = parseInt(simulationCountInput.value) || 10000;
  var ticket = currentTickets[0];
  var best = 0;
  for (var i = 0; i < iterations; i++) {
    var win = generateTickets(1, [])[0];
    var matches = ticket.filter(n => win.includes(n)).length;
    best = Math.max(best, matches);
  }
  simulationResultElement.className = 'simulation-card';
  simulationResultElement.innerHTML = `<div class="result-head">${ticket.join(' / ')}</div><p>${iterations.toLocaleString()}회 가상 추첨 결과</p><p>최고 일치 개수: <strong>${best}개</strong></p>`;
}

themeToggleButton.addEventListener('click', toggleTheme);
generateButton.addEventListener('click', handleGenerate);
simulateButton.addEventListener('click', handleSimulate);

initializeTheme();
handleGenerate();
