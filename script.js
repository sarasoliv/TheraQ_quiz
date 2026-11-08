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

    // Mapeia e normaliza os dados vindos da API com garantia da explicação e fonte
    const availableQuestions = dados
      .map((item) => {
        const justificativa = item.justificativa_resposta || item.explicacao || '';
        const referencia = item.referencia ? `Fonte: ${item.referencia}.` : 'Fonte: Material de referência oficial do TheraQ.';
        const textoExplicacao = justificativa ? `${justificativa} (${referencia})` : referencia;

        return {
          id: item.id,
          question: item.enunciado,
          options: item.alternativas,
          correctIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(String(item.resposta_correta || '').toUpperCase()),
          explanation: textoExplicacao,
          difficulty: String(item.dificuldade_nivel || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
        };
      })
      .filter((item) => item.question && item.options.length >= 2 && item.correctIndex >= 0);

    const perguntasDoNivelExato = availableQuestions.filter((item) => {
      return item.difficulty === dificuldadeEscolhida;
    });

    if (perguntasDoNivelExato.length < 10) {
      throw new Error(`O nível "${dificuldadeEscolhida}" possui apenas ${perguntasDoNivelExato.length} perguntas válidas. São necessárias pelo menos 10.`);
    }

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
  userAnswers: [],
  isSubmitting: false // Trava de segurança contra envios triplicados
};

const answerAudio = {
  correct: new Audio('./sounds/acerto.mp3'),
  wrong: new Audio('./sounds/errou.mp3')
};

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
      .filter(Boolean);
  } catch (error) {
    console.warn('Não foi possível carregar o ranking global. Usando cache local:', error);
    return [];
  }
}

async function renderSidebarRanking() {
  const globalRanking = await fetchGlobalRanking();
  const localRanking = getRanking()
    .map(normalizeRankingEntry)
    .filter(Boolean);

  const rankingList = globalRanking.length ? globalRanking : localRanking;
  const sortedRanking = [...rankingList].sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));
  const usingLocalFallback = globalRanking.length === 0 && localRanking.length > 0;

  els.sessionRankingList.innerHTML = '';

  if (!sortedRanking.length) {
    els.sessionRankingList.innerHTML = `
      <li>
        <span class="rank-number">0</span>
        <span class="player-name">Nenhum jogador</span>
        <span class="score">-</span>
      </li>
    `;
    return;
  }

  sortedRanking.slice(0, 8).forEach((entry, index) => {
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

  // Restaura a exibição correta da justificativa e fonte vinda do banco
  els.explanationText.textContent = question.explanation;
  els.explanationBox.classList.remove('hidden');
  els.confirmButton.textContent = state.currentQuestionIndex === questions.length - 1 ? 'Ver resultado' : 'Próxima questão';
}

function updateGlobalRanking() {
  const ranking = getRanking()
    .map(normalizeRankingEntry)
    .filter(Boolean)
    .concat({ nickname: state.playerName, score: state.score })
    .filter((entry, index, array) => array.findIndex((item) => item.nickname.toLowerCase() === entry.nickname.toLowerCase()) === index)
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  saveRanking(ranking);

  els.finalRankingList.innerHTML = '';
  ranking.slice(0, 5).forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${index + 1}. ${item.nickname}</span><strong>${item.score} pts</strong>`;
    els.finalRankingList.appendChild(li);
  });

  return ranking;
}

async function finishQuiz() {
  // Trava de segurança para impedir requisições duplicadas (envios triplicados)
  if (state.isSubmitting) return;
  state.isSubmitting = true;

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
      const data = await response.json().catch(() => ({}));
      if (response.status === 409 || (data.error && data.error.includes('já está em uso'))) {
        alert(`⚠️ O nome "${state.playerName}" já foi registrado no banco de dados por outro jogador!`);
      }
    }

    await renderSidebarRanking();
  } catch (error) {
    console.error('Não foi possível salvar o resultado no banco:', error);
    renderSidebarRanking();
  } finally {
    state.isSubmitting = false; // Libera após concluir
  }

  els.finalScore.textContent = `${state.score} / ${questions.length}`;
  showScreen('final');
}

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

async function startQuiz() {
  if (!questions.length) { 
    alert('As perguntas ainda não foram carregadas.'); 
    return; 
  }

  const nameInput = els.playerNameInput.value.trim();

  if (!nameInput) {
    els.playerNameInput.focus();
    els.playerNameInput.placeholder = 'Digite seu nickname antes de iniciar';
    return;
  }

  els.startQuizButton.disabled = true;
  els.startQuizButton.textContent = 'Verificando nome...';

  try {
    const resposta = await fetch(`/api/validar-nome?nome=${encodeURIComponent(nameInput)}`);
    if (resposta.ok) {
      const resultado = await resposta.json();
      if (resultado.existe) {
        alert(`⚠️ O nickname "${nameInput}" já está cadastrado no banco de dados por outro jogador!\nPor favor, digite um nome diferente para poder jogar.`);
        els.playerNameInput.focus();
        els.playerNameInput.select();
        els.startQuizButton.disabled = false;
        els.startQuizButton.textContent = 'Começar quiz';
        return;
      }
    }
  } catch (err) {
    console.warn('Erro ao checar nome existente no banco:', err);
  }

  els.startQuizButton.disabled = false;
  els.startQuizButton.textContent = 'Começar quiz';

  state.playerName = nameInput;
  state.currentQuestionIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  state.isSubmitting = false;
  renderQuestion();
  showScreen('quiz');
}

// ==========================================================
// Eventos e inicialização (Garantindo apenas 1 listener por evento)
// ==========================================================
els.difficultySelect.addEventListener('change', carregarPerguntasDoBanco);

// Remove event listeners duplicados antigos se existirem clonando o botão
const novoBotaoConfirmar = els.confirmButton.cloneNode(true);
els.confirmButton.parentNode.replaceChild(novoBotaoConfirmar, els.confirmButton);
els.confirmButton = novoBotaoConfirmar;

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
});

els.finalButton.addEventListener('click', () => {
  els.playerNameInput.value = '';
  els.playerNameInput.placeholder = 'Digite seu nickname';
  state.currentQuestionIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  state.playerName = '';
  state.isSubmitting = false;
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
