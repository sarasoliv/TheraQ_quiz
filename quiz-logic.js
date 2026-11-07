(function (globalScope) {
  function pickRandomQuestions(listaFiltrada, quantidade) {
    const totalDesejado = quantidade || 10;

    if (!Array.isArray(listaFiltrada) || listaFiltrada.length < totalDesejado) {
      return [];
    }

    // Embaralha as perguntas usando algoritmo simples de ordenação randômica
    const embaralhadas = [...listaFiltrada];
    for (let i = embaralhadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = embaralhadas[i];
      embaralhadas[i] = embaralhadas[j];
      embaralhadas[j] = temp;
    }

    // Retorna exatamente a quantidade desejada (10 perguntas)
    return embaralhadas.slice(0, totalDesejado);
  }

  function normalizeDifficulty(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  const api = {
    pickRandomQuestions: pickRandomQuestions,
    normalizeDifficulty: normalizeDifficulty
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TheraQQuizLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
