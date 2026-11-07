(function (globalScope) {
  // Função para normalizar caso venha algo com espaços ou letras maiúsculas
  function normalizeDifficulty(valor) {
    if (!valor) return '';
    return String(valor).trim().toLowerCase();
  }

  // Função simples para filtrar, embaralhar e pegar 10 perguntas
  function pickRandomQuestions(listaPerguntas, dificuldadeDesejada, quantidade) {
    const totalDesejado = quantidade || 10;
    const difBuscada = normalizeDifficulty(dificuldadeDesejada);

    if (!Array.isArray(listaPerguntas)) {
      return [];
    }

    // 1. Filtra estritamente apenas a dificuldade selecionada
    const perguntasFiltradas = listaPerguntas.filter(function (item) {
      const difItem = normalizeDifficulty(item.dificuldade_nivel || item.difficulty);
      return difItem === difBuscada;
    });

    // 2. Se houver menos que o total desejado (ex: 10), impede o início do quiz
    if (perguntasFiltradas.length < totalDesejado) {
      return [];
    }

    // 3. Embaralha a lista de perguntas da dificuldade escolhida
    const embaralhadas = [...perguntasFiltradas];
    for (let i = embaralhadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = embaralhadas[i];
      embaralhadas[i] = embaralhadas[j];
      embaralhadas[j] = temp;
    }

    // 4. Retorna exatamente as 10 primeiras do grupo embaralhado
    return embaralhadas.slice(0, totalDesejado);
  }

  const api = {
    normalizeDifficulty: normalizeDifficulty,
    pickRandomQuestions: pickRandomQuestions
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TheraQQuizLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
