test('seleciona exatamente 10 perguntas da dificuldade escolhida quando há exatamente 10 itens', () => {
  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    difficulty: 'facil'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 10);
  assert.ok(result.every((question) => question.difficulty === 'facil'));
});
