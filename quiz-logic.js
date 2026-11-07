(function (globalScope) {

  // Função simples para filtrar e embaralhar 10 perguntas
  function pickRandomQuestions(listaPerguntas, dificuldadeDesejada) {
    // Filtra estritamente pela dificuldade igual à escolhida
    const filtradas = listaPerguntas.filter(function(item) {
      const dif = item.dificuldade_nivel || item.difficulty;
      return dif === dificuldadeDesejada;
    });

    // Se tiver menos de 10, retorna array vazio
    if (filtradas.length < 10) {
      return [];
    }

    // Embaralha usando Math.random()
    filtradas.sort(function() {
      return Math.random() - 0.5;
    });

    // Retorna exatamente 10 perguntas
    return filtradas.slice(0, 10);
  }

  const api = {
    pickRandomQuestions: pickRandomQuestions
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TheraQQuizLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
