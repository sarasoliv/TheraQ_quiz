const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDifficulty, pickRandomQuestions } = require('../quiz-logic.js');

test('normaliza corretamente as palavras de dificuldade', () => {
  assert.equal(normalizeDifficulty('facil'), 'facil');
  assert.equal(normalizeDifficulty('médio'), 'medio');
  assert.equal(normalizeDifficulty('difícil'), 'dificil');
});

test('seleciona exatamente 10 perguntas quando há mais de 10 itens disponíveis', () => {
  const questions = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    difficulty: 'facil'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 10);
  assert.ok(result.every((question) => question.difficulty === 'facil'));
});
