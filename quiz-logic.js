(function (globalScope) {
  function pickRandomQuestions(listaFiltrada, dificuldadeOuQuantidade, quantidadeOpcional) {
    if (!Array.isArray(listaFiltrada) || listaFiltrada.length === 0) {
      return [];
    }

    const totalDesejado = (() => {
      const explicitQuantity = Number(typeof dificuldadeOuQuantidade === 'number'
        ? dificuldadeOuQuantidade
        : Number(dificuldadeOuQuantidade));

      if (Number.isFinite(explicitQuantity) && explicitQuantity > 0) {
        return Math.floor(explicitQuantity);
      }

      const fallbackQuantity = Number(quantidadeOpcional);
      if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
        return Math.floor(fallbackQuantity);
      }

      return 10;
    })();

    const nivelDesejado = typeof dificuldadeOuQuantidade === 'string'
      ? normalizeDifficulty(dificuldadeOuQuantidade)
      : null;

    const listaParaSortear = nivelDesejado
      ? listaFiltrada.filter((item) => normalizeDifficulty(item?.difficulty ?? item?.dificuldade ?? item?.dificuldade_nivel ?? '') === nivelDesejado)
      : listaFiltrada;

    if (listaParaSortear.length < totalDesejado) {
      return [];
    }

    // Embaralha as perguntas usando algoritmo simples de ordenação randômica
    const embaralhadas = [...listaParaSortear];
    for (let i = embaralhadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = embaralhadas[i];
      embaralhadas[i] = embaralhadas[j];
      embaralhadas[j] = temp;
    }

    // Retorna exatamente a quantidade desejada (ex.: 10 perguntas)
    return embaralhadas.slice(0, totalDesejado);
  }

  function normalizeDifficulty(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '')
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
