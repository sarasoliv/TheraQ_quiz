// ==========================================================
// TheraQ - Configuração e elementos da interface
// ==========================================================
const RANKING_KEY = 'techq-rank';
const { pickRandomQuestions, normalizeDifficulty } = window.TheraQQuizLogic || {};
const els = {
  introScreen: document.querySelector('.screen-intro'),
  quizScreen: document.querySelector('.screen-quiz'),
  finalScreen: document.querySelector('.screen-final'),
  sidebar: document.querySelector('.sidebar'),
  mainLayout: document.querySelector('.main-layout'),
  startQuizButton: document.getElementById('start-quiz-btn'),
  confirmButton: document.getElementById('confirm-answer'),
  finalButton: document.getElementById('play-again'),
  playerNameInput: document.getElementById('player-name'),
  difficultySelect: document.getElementById('difficulty-select'),
  questionText: document.getElementById('question-text'),
  topbarStatus: document.getElementById('topbar-status'),
  answersContainer: document.getElementById('answers-container'),
  explanationBox: document.getElementById('explanation-box'),
  explanationText: document.getElementById('explanation-text'),
  finalScore: document.getElementById('final-score'),
  finalRankingList: document.getElementById('final-ranking-list'),
  sessionRankingList: document.getElementById('session-ranking-list'),
  statusPill: document.getElementById('status-pill'),
  themeButtons: document.querySelectorAll('[data-theme]'),
  fontButtons: document.querySelectorAll('[data-font]'),
  highContrastToggle: document.getElementById('high-contrast-toggle'),
  daltonismControl: document.getElementById('daltonism-control'),
  volumeControl: document.getElementById('volume-control')
};

// ==========================================================
// Banco de questões do quiz
// ==========================================================
let questions = [];

// Função para buscar as perguntas do banco de dados
async function carregarPerguntasDoBanco() {
  // Pega a dificuldade selecionada e normaliza (ex: "Médio" vira "medio")
  const dificuldadeSelecionada = (els.difficultySelect.value || 'facil')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  els.startQuizButton.disabled = true;
  els.startQuizButton.textContent = 'Carregando perguntas...';

  try {
    const resposta = await fetch('/api/perguntas');
    if (!resposta.ok) {
      throw new Error('O servidor respondeu com erro: ' + resposta.status);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados) || dados.length === 0) {
      throw new Error('A API retornou uma lista vazia de perguntas.');
    }

    // Mapeia os dados do banco para o formato do quiz
    const todasPerguntas = dados.map(function (item) {
      // Pega o nível de dificuldade vindo do banco e normaliza
      const nivelBanco = (item.dificuldade_nivel || item.difficulty || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return {
        id: item.id,
        question: item.enunciado || item.question,
        options: item.alternativas || [item.opcao_a, item.opcao_b, item.opcao_c, item.opcao_d, item.opcao_e],
        correctIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(String(item.resposta_correta || '').toUpperCase()),
        explanation: item.justificativa_resposta || item.explicacao || 'Sem explicação disponível.',
        difficulty: nivelBanco
      };
    });

    // Filtra estritamente pelas perguntas que pertencem à dificuldade escolhida
    const perguntasFiltradas = todasPerguntas.filter(function (item) {
      return item.difficulty === dificuldadeSelecionada;
    });

    // Envia para o logic ou embaralha diretamente
    questions = window.TheraQQuizLogic.pickRandomQuestions(
      perguntasFiltradas,
      dificuldadeSelecionada,
      10
    );

    if (!Array.isArray(questions) || questions.length < 10) {
      throw new Error(`Encontradas apenas ${perguntasFiltradas.length} perguntas para o nível "${dificuldadeSelecionada}". São necessárias pelo menos 10.`);
    }

    els.startQuizButton.disabled = false;
    els.startQuizButton.textContent = 'Começar quiz';
    updateTopbar();
  } catch (erro) {
    console.error('Erro detalhado ao carregar perguntas:', erro);
    els.startQuizButton.textContent = 'Tentar carregar novamente';
    els.startQuizButton.disabled = false;
    alert(erro.message || 'Erro ao carregar as perguntas do banco de dados.');
  }
}

window.addEventListener('DOMContentLoaded', carregarPerguntasDoBanco);
els.difficultySelect.addEventListener('change', carregarPerguntasDoBanco);
// ==========================================================
// Estado atual da partida
// ==========================================================
const state = {
  currentQuestionIndex: 0,
  selectedAnswerIndex: null,
  answered: false,
  playerName: '',
  score: 0
};

const answerAudio = {
  correct: new Audio('./sounds/acerto.mp3'),
  wrong: new Audio('./sounds/errou.mp3')
};

const MAX_QUIZ_QUESTIONS = 10;

function getSelectedDifficulty() {
  return normalizeDifficulty(els.difficultySelect?.value || 'medio');
}

function shuffleQuestions(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getAudioVolume() {
  const value = Number(els.volumeControl?.value ?? 0.7);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.7;
}

function playAnswerSound(isCorrect) {
  const audio = isCorrect ? answerAudio.correct : answerAudio.wrong;
  audio.volume = getAudioVolume();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ==========================================================
// Armazenamento local do ranking
// ==========================================================
const readStorage = (key) => {
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getRanking = () => readStorage(RANKING_KEY);
const saveRanking = (ranking) => writeStorage(RANKING_KEY, ranking);
const updateTopbar = () => {
  els.topbarStatus.textContent = `${state.currentQuestionIndex + 1} / ${questions.length}`;
};

// ==========================================================
// Navegação entre telas
// ==========================================================

function showScreen(screenName) {
  Object.entries({ intro: els.introScreen, quiz: els.quizScreen, final: els.finalScreen })
    .forEach(([name, el]) => el.classList.toggle('active', name === screenName));

  els.sidebar.classList.remove('hidden');
  els.mainLayout.classList.remove('single-column');

  if (screenName === 'quiz') {
    els.sidebar.classList.add('hidden');
    els.mainLayout.classList.add('single-column');
    els.statusPill.classList.remove('hidden');
    updateTopbar();
  } else {
    els.statusPill.classList.add('hidden');
  }
}

// ==========================================================
// Ranking e renderização da interface
// ==========================================================
async function renderSidebarRanking() {
  let rankingFromDatabase = [];
  try {
    const response = await fetch('/api/ranking');
    if (response.ok) rankingFromDatabase = await response.json();
  } catch (error) {
    console.warn('Usando ranking local:', error);
  }
  const ranking = (rankingFromDatabase.length ? rankingFromDatabase : getRanking())
    .filter((entry) => entry && entry.nickname)
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  els.sessionRankingList.innerHTML = '';

  if (!ranking.length) {
    els.sessionRankingList.innerHTML = `
      <li>
        <span class="rank-number">0</span>
        <span class="player-name">Nenhum jogador</span>
        <span class="score">-</span>
      </li>
    `;
    return;
  }

  ranking.slice(0, 8).forEach((entry, index) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <span class="rank-number">${index + 1}</span>
      <span class="player-name">${entry.nickname}</span>
      <span class="score">${entry.score}</span>
    `;
    els.sessionRankingList.appendChild(item);
  });
}

function renderQuestion() {
  const question = questions[state.currentQuestionIndex];
  state.selectedAnswerIndex = null;
  state.answered = false;

  els.questionText.textContent = question.question;
  updateTopbar();
  els.explanationBox.classList.add('hidden');
  els.explanationText.textContent = '';
  els.confirmButton.textContent = 'Confirmar resposta';
  els.confirmButton.disabled = false;
  els.answersContainer.innerHTML = '';

  question.options.forEach((option, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const mark = document.createElement('span');
    const text = document.createElement('span');
    const status = document.createElement('span');

    label.className = 'option-item';
    input.type = 'radio';
    input.name = 'answer';
    input.value = index;
    input.addEventListener('change', ({ target }) => {
      state.selectedAnswerIndex = Number(target.value);
      document.querySelectorAll('.option-item').forEach((item) => {
        item.classList.toggle('selected', item.querySelector('input').checked);
      });
    });

    mark.className = 'radio-mark';
    text.className = 'option-text';
    text.textContent = option;
    status.className = 'option-status';

    label.append(input, mark, text, status);
    els.answersContainer.appendChild(label);
  });
}

// ==========================================================
// Feedback da resposta e explicação
// ==========================================================
function showAnswerFeedback() {
  const question = questions[state.currentQuestionIndex];
  document.querySelectorAll('.option-item').forEach((item, index) => {
    const input = item.querySelector('input');
    const status = item.querySelector('.option-status');
    input.disabled = true;
    item.classList.remove('selected', 'correct', 'wrong');

    if (Number(input.value) === state.selectedAnswerIndex) item.classList.add('selected');
    if (index === question.correctIndex) {
      item.classList.add('correct');
      status.textContent = 'Correta';
    }
    if (index === state.selectedAnswerIndex && index !== question.correctIndex) {
      item.classList.add('wrong');
      status.textContent = 'Incorreta';
    }
  });

  els.explanationText.textContent = question.explanation;
  els.explanationBox.classList.remove('hidden');
  els.confirmButton.textContent = state.currentQuestionIndex === questions.length - 1 ? 'Ver resultado' : 'Próxima questão';
}

function updateGlobalRanking() {
  const ranking = getRanking()
    .filter((entry) => entry && entry.nickname)
    .concat({ nickname: state.playerName, score: state.score })
    .filter((entry, index, array) => array.findIndex((item) => item.nickname.toLowerCase() === entry.nickname.toLowerCase()) === index)
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  saveRanking(ranking);
  renderSidebarRanking();

  els.finalRankingList.innerHTML = '';
  ranking.slice(0, 5).forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${index + 1}. ${item.nickname}</span><strong>${item.score} pts</strong>`;
    els.finalRankingList.appendChild(li);
  });
}

async function finishQuiz() {
  updateGlobalRanking();
  try {
    const response = await fetch('/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_usuario: state.playerName, total_acertos: state.score, pontuacao_final: state.score })
    });
    if (!response.ok) console.error('O servidor não conseguiu salvar o resultado.');
  } catch (error) {
    console.error('Não foi possível salvar o resultado no banco:', error);
  }
  els.finalScore.textContent = `${state.score} / ${questions.length}`;
  showScreen('final');
}

// ==========================================================
// Fluxo do quiz
// ==========================================================
function nextStep() {
  if (!state.answered) {
    alert('Selecione uma alternativa antes de confirmar.');
    return;
  }

  state.currentQuestionIndex += 1;
  if (state.currentQuestionIndex < questions.length) {
    renderQuestion();
    showScreen('quiz');
    return;
  }

  finishQuiz();
}

function startQuiz() {
  if (!questions.length) { alert('As perguntas ainda não foram carregadas.'); return; }
  const name = els.playerNameInput.value.trim();

  if (!name) {
    els.playerNameInput.focus();
    els.playerNameInput.placeholder = 'Digite seu nickname antes de iniciar';
    return;
  }

  state.playerName = name;
  state.currentQuestionIndex = 0;
  state.score = 0;
  renderQuestion();
  showScreen('quiz');
}

// ==========================================================
// Eventos e inicialização
// ==========================================================
els.difficultySelect.addEventListener('change', carregarPerguntasDoBanco);
els.startQuizButton.addEventListener('click', startQuiz);
els.confirmButton.addEventListener('click', () => {
  if (state.selectedAnswerIndex === null) {
    alert('Selecione uma alternativa antes de confirmar.');
    return;
  }

  if (state.answered) {
    nextStep();
    return;
  }

  const isCorrectAnswer = state.selectedAnswerIndex === questions[state.currentQuestionIndex].correctIndex;
  if (isCorrectAnswer) {
    state.score += 1;
    playAnswerSound(true);
  } else {
    playAnswerSound(false);
  }

  state.answered = true;
  showAnswerFeedback();
});
els.finalButton.addEventListener('click', () => {
  els.playerNameInput.value = '';
  els.playerNameInput.placeholder = 'Digite seu nickname';
  state.currentQuestionIndex = 0;
  state.score = 0;
  state.playerName = '';
  renderSidebarRanking();
  showScreen('intro');
});

function initializeAccessibilityControls() {
  const body = document.body;
  let fontScale = 1;

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    body.classList.toggle('theme-light', isLight);
    els.themeButtons.forEach((button) => {
      const active = button.dataset.theme === theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const applyContrast = (enabled) => {
    body.classList.toggle('high-contrast', enabled);
    els.highContrastToggle.classList.toggle('is-active', enabled);
    els.highContrastToggle.setAttribute('aria-pressed', String(enabled));
  };

  const applyDaltonism = (mode) => {
    body.classList.remove('daltonism-protanopia', 'daltonism-deuteranopia', 'daltonism-tritanopia');
    if (mode !== 'none') {
      body.classList.add(`daltonism-${mode}`);
    }
  };

  els.themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.theme));
  });

  els.fontButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.font;
      fontScale = direction === 'increase' ? Math.min(1.25, fontScale + 0.1) : Math.max(0.85, fontScale - 0.1);
      document.documentElement.style.setProperty('--font-scale', fontScale.toFixed(2));
    });
  });

  els.highContrastToggle.addEventListener('click', () => {
    const enabled = !body.classList.contains('high-contrast');
    applyContrast(enabled);
  });

  els.daltonismControl.addEventListener('change', (event) => {
    applyDaltonism(event.target.value);
  });

  els.volumeControl.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    event.target.style.setProperty('--volume', String(value));
    document.body.style.setProperty('--volume-level', value.toFixed(2));
    answerAudio.correct.volume = value;
    answerAudio.wrong.volume = value;
  });

  applyTheme('dark');
  applyContrast(false);
  applyDaltonism('none');
}

showScreen('intro');
renderSidebarRanking();
updateTopbar();
initializeAccessibilityControls();

els.playerNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    startQuiz();
  }
});
