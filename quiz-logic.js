(function (globalScope) {
  function normalizeDifficulty(value) {
    if (typeof value !== 'string') return 'todas';

    const normalized = value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '');

    if (!normalized || normalized === 'todas') return 'todas';
    if (normalized === 'facil' || normalized === 'facil') return 'facil';
    if (['medio', 'media', 'medio'].includes(normalized)) return 'medio';
    if (['dificil', 'dificil'].includes(normalized)) return 'dificil';
    return normalized;
  }

  function pickRandomQuestions(items, difficulty, maxQuestions = 10) {
    const safeMax = Number.isInteger(maxQuestions) && maxQuestions > 0 ? maxQuestions : 10;
    const questions = Array.isArray(items) ? [...items] : [];
    const selectedDifficulty = normalizeDifficulty(difficulty);

    const filtered = questions.filter((item) => {
      if (selectedDifficulty === 'todas') return true;
      const itemDifficulty = normalizeDifficulty(
        item?.dificuldade_nivel || item?.difficulty || ''
      );
      return itemDifficulty === selectedDifficulty;
    });

    if (filtered.length <= safeMax) {
      return filtered;
    }

    const shuffled = [...filtered];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, safeMax);
  }

  const api = { normalizeDifficulty, pickRandomQuestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TheraQQuizLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
