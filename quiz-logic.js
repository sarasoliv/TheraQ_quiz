function pickRandomQuestions(items, difficulty, maxQuestions = 10) {
    const safeMax = Number.isInteger(maxQuestions) && maxQuestions > 0 ? maxQuestions : 10;
    const questions = Array.isArray(items) ? [...items] : [];
    const selectedDifficulty = normalizeDifficulty(difficulty);

    if (!questions.length || !selectedDifficulty) {
      return [];
    }

    const filtered = questions.filter((item) => {
      const itemDifficulty = normalizeDifficulty(
        item?.dificuldade_nivel || item?.difficulty || ''
      );
      return itemDifficulty === selectedDifficulty;
    });

    // Permitir exatamente ou mais que o limite desejado
    if (filtered.length < safeMax) {
      return [];
    }

    const shuffled = [...filtered];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, safeMax);
  }
