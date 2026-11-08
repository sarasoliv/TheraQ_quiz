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
  questionSource: document.getElementById('question-source'),
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

async function carregarPerguntasDoBanco() {
  const rawDifficulty = els.difficultySelect?.value || 'facil';
  
  const dificuldadeEscolhida = String(rawDifficulty)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  els.startQuizButton.disabled = true;
  els.startQuizButton.textContent = 'Carregando perguntas...';
  
  questions = [];

  try {
    const url = new URL('/api/perguntas', window.location.origin);
    url.searchParams.set('dificuldade', dificuldadeEscolhida);

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao carregar perguntas do banco.');
    
    const dados = await resposta.json();

    if (!Array.isArray(dados) || dados.length === 0) {
      throw new Error(`Nenhuma pergunta encontrada para o nível "${dificuldadeEscolhida}".`);
    }

    // Mapeia e normaliza os dados vindos da API
    const availableQuestions = dados
      .map((item) => ({
        id: item.id,
        question: item.enunciado,
        options: item.alternativas,
        correctIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(String(item.resposta_correta || '').toUpperCase()),
        explanation: item.justificativa_pergunta || item.justificativa_resposta || item.explicacao || 'Justificativa não cadastrada.',
        source: item.referencia || item.fonte || 'Fonte não cadastrada',
        sourceUrl: item.fonte_url || null,
        difficulty: String(item.dificuldade_nivel || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
      }))
      .filter((item) => item.question && item.options.length >= 2 && item.correctIndex >= 0);

    // 🔒 BLOQUEIO ABSOLUTO: Garante de forma estrita que NENHUMA pergunta de outro nível passe
    const perguntasDoNivelExato = availableQuestions.filter((item) => {
      return item.difficulty === dificuldadeEscolhida;
    });

    // Valida se o bloco atual tem o mínimo necessário (exatamente 10 perguntas)
    if (perguntasDoNivelExato.length < 10) {
      throw new Error(`O nível "${dificuldadeEscolhida}" possui apenas ${perguntasDoNivelExato.length} perguntas válidas. São necessárias pelo menos 10.`);
    }

    // Sorteia estritamente 10 perguntas únicas e exclusivas do respectivo nível
    questions = window.TheraQQuizLogic?.pickRandomQuestions
      ? window.TheraQQuizLogic.pickRandomQuestions(perguntasDoNivelExato, 10)
      : perguntasDoNivelExato.sort(() => Math.random() - 0.5).slice(0, 10);

    els.startQuizButton.disabled = false;
    els.startQuizButton.textContent = 'Começar quiz';
    updateTopbar();
  } catch (erro) {
    console.error('Erro ao buscar perguntas:', erro);
    els.startQuizButton.textContent = 'Tentar carregar novamente';
    els.startQuizButton.disabled = false;
    questions = [];
    alert(erro.message || 'A dificuldade selecionada precisa ter pelo menos 10 perguntas válidas no banco para iniciar o quiz.');
  }
}

// ==========================================================
// Estado atual da partida
// ==========================================================
const state = {
  currentQuestionIndex: 0,
  selectedAnswerIndex: null,
  answered: false,
  playerName: '',
  score: 0,
  userAnswers: []
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
  if (els.topbarStatus) {
    els.topbarStatus.textContent = `${state.currentQuestionIndex + 1} / ${questions.length || 10}`;
  }
};

// ==========================================================
// Navegação entre telas
// ==========================================================
function showScreen(screenName) {
  Object.entries({ intro: els.introScreen, quiz: els.quizScreen, final: els.finalScreen })
    .forEach(([name, el]) => el?.classList.toggle('active', name === screenName));

  els.sidebar?.classList.remove('hidden');
  els.mainLayout?.classList.remove('single-column');

  if (screenName === 'quiz') {
    els.sidebar?.classList.add('hidden');
    els.mainLayout?.classList.add('single-column');
    els.statusPill?.classList.remove('hidden');
    updateTopbar();
  } else {
    els.statusPill?.classList.add('hidden');
  }
}

// ==========================================================
// Ranking e renderização da interface
// ==========================================================
function normalizeRankingEntry(entry) {
  const nickname = typeof entry?.nickname === 'string'
    ? entry.nickname.trim()
    : typeof entry?.nome_jogador === 'string'
      ? entry.nome_jogador.trim()
      : '';

  const scoreValue = Number(entry?.score ?? entry?.pontuacao_jogador ?? 0);
  const score = Number.isFinite(scoreValue) ? scoreValue : 0;

  if (!nickname || !Number.isFinite(score)) {
    return null;
  }

  return { nickname, score };
}

async function fetchGlobalRanking() {
  try {
    const response = await fetch('/api/ranking', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }

    const data = await response.json();
    return (Array.isArray(data) ? data : [])
      .map(normalizeRankingEntry)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));
  } catch (error) {
    console.warn('Não foi possível carregar o ranking global. Usando cache local apenas:', error);
    return [];
  }
}

async function renderSidebarRanking() {
  if (!els.sessionRankingList) return;

  const globalRanking = await fetchGlobalRanking();
  const localRanking = getRanking()
    .map(normalizeRankingEntry)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  const ranking = globalRanking.length ? globalRanking : localRanking;
  const usingLocalFallback = globalRanking.length === 0 && localRanking.length > 0;

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

  if (usingLocalFallback) {
    const notice = document.createElement('li');
    notice.className = 'local-ranking-warning';
    notice.textContent = 'Ranking local: servidor indisponível';
    notice.style.fontSize = '0.72rem';
    notice.style.opacity = '0.8';
    els.sessionRankingList.appendChild(notice);
  }
}

function renderQuestion() {
  const question = questions[state.currentQuestionIndex];
  state.selectedAnswerIndex = null;
  state.answered = false;

  els.questionText.textContent = question.question;
  updateTopbar();

  els.explanationBox.classList.add('hidden');
  els.explanationText.textContent = '';
  if (els.questionSource) els.questionSource.replaceChildren();

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

    if (Number(input.value) === state.selectedAnswerIndex) {
      item.classList.add('selected');
    }

    if (index === question.correctIndex) {
      item.classList.add('correct');
      status.textContent = 'Correta';
    }

    if (index === state.selectedAnswerIndex && index !== question.correctIndex) {
      item.classList.add('wrong');
      status.textContent = 'Incorreta';
    }
  });

  // Exibe a justificativa da resposta
  els.explanationText.textContent = question.explanation;

  // Exibe a fonte bibliográfica separada
  if (els.questionSource) {
    els.questionSource.replaceChildren();

    if (question.sourceUrl) {
      const link = document.createElement('a');
      link.href = question.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = question.source;
      els.questionSource.appendChild(link);
    } else {
      els.questionSource.textContent = question.source;
    }
  }

  // Mostra a caixa de explicação e fonte na interface
  els.explanationBox.classList.remove('hidden');
}

function updateGlobalRanking() {
  const ranking = getRanking()
    .map(normalizeRankingEntry)
    .filter(Boolean)
    .concat({ nickname: state.playerName, score: state.score })
    .filter((entry, index, array) => array.findIndex((item) => item.nickname.toLowerCase() === entry.nickname.toLowerCase()) === index)
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  saveRanking(ranking);

  if (els.finalRankingList) {
    els.finalRankingList.innerHTML = '';
    ranking.slice(0, 5).forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${index + 1}. ${item.nickname}</span><strong>${item.score} pts</strong>`;
      els.finalRankingList.appendChild(li);
    });
  }

  return ranking;
}

async function finishQuiz() {
  updateGlobalRanking();

  try {
    const response = await fetch('/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: state.playerName,
        total_acertos: state.score,
        pontuacao_final: state.score,
        questoes_respondidas: state.userAnswers
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `status ${response.status}`);
    }

    await renderSidebarRanking();
  } catch (error) {
    console.warn('Não foi possível salvar o resultado no banco:', error);
    renderSidebarRanking();
  }

  if (els.finalScore) {
    els.finalScore.textContent = `${state.score} / ${questions.length}`;
  }
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
  if (!questions.length) { 
    alert('As perguntas ainda não foram carregadas.'); 
    return; 
  }
  const name = els.playerNameInput?.value.trim();

  if (!name) {
    els.playerNameInput.focus();
    els.playerNameInput.placeholder = 'Digite seu nickname antes de iniciar';
    return;
  }

  state.playerName = name;
  state.currentQuestionIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  renderQuestion();
  showScreen('quiz');
}

// ==========================================================
// Eventos e inicialização
// ==========================================================
if (els.difficultySelect) {
  els.difficultySelect.addEventListener('change', carregarPerguntasDoBanco);
}

if (els.startQuizButton) {
  els.startQuizButton.addEventListener('click', startQuiz);
}

if (els.confirmButton) {
  els.confirmButton.addEventListener('click', () => {
    if (state.selectedAnswerIndex === null) {
      alert('Selecione uma alternativa antes de confirmar.');
      return;
    }

    if (state.answered) {
      nextStep();
      return;
    }

    const currentQ = questions[state.currentQuestionIndex];
    const isCorrectAnswer = state.selectedAnswerIndex === currentQ.correctIndex;
    
    const letras = ['A', 'B', 'C', 'D', 'E'];
    const respostaLetra = letras[state.selectedAnswerIndex] || 'A';

    state.userAnswers.push({
      questao_id: currentQ.id,
      resposta_usuario: respostaLetra,
      acerto: isCorrectAnswer
    });

    if (isCorrectAnswer) {
      state.score += 1;
      playAnswerSound(true);
    } else {
      playAnswerSound(false);
    }

    state.answered = true;
    showAnswerFeedback();
    els.confirmButton.textContent = 'Próxima pergunta';
  });
}

if (els.finalButton) {
  els.finalButton.addEventListener('click', () => {
    if (els.playerNameInput) {
      els.playerNameInput.value = '';
      els.playerNameInput.placeholder = 'Digite seu nickname';
    }
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.userAnswers = [];
    state.playerName = '';
    renderSidebarRanking();
    showScreen('intro');
  });
}

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
    if (els.highContrastToggle) {
      els.highContrastToggle.classList.toggle('is-active', enabled);
      els.highContrastToggle.setAttribute('aria-pressed', String(enabled));
    }
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

  if (els.highContrastToggle) {
    els.highContrastToggle.addEventListener('click', () => {
      const enabled = !body.classList.contains('high-contrast');
      applyContrast(enabled);
    });
  }

  if (els.daltonismControl) {
    els.daltonismControl.addEventListener('change', (event) => {
      applyDaltonism(event.target.value);
    });
  }

  if (els.volumeControl) {
    els.volumeControl.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      event.target.style.setProperty('--volume', String(value));
      document.body.style.setProperty('--volume-level', value.toFixed(2));
      answerAudio.correct.volume = value;
      answerAudio.wrong.volume = value;
    });
  }

  applyTheme('dark');
  applyContrast(false);
  applyDaltonism('none');
}

// Carrega as perguntas e inicializa o app ao carregar o script
carregarPerguntasDoBanco();
showScreen('intro');
renderSidebarRanking();
initializeAccessibilityControls();

if (els.playerNameInput) {
  els.playerNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      startQuiz();
    }
  });
}
