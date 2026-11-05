const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDifficulty, pickRandomQuestions } = require('../quiz-logic.js');

test('normaliza dificuldade em minúsculas sem acentos', () => {
  assert.equal(normalizeDifficulty('FÁCIL'), 'facil');
  assert.equal(normalizeDifficulty('Médio'), 'medio');
  assert.equal(normalizeDifficulty('Difícil'), 'dificil');
  assert.equal(normalizeDifficulty('todas'), 'todas');
});

test('seleciona no máximo 10 perguntas da dificuldade escolhida quando há material suficiente', () => {
  const questions = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    difficulty: 'facil'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 10);
  assert.ok(result.every((question) => question.difficulty === 'facil'));
});

test('mantém até 10 perguntas quando a dificuldade não foi escolhida', () => {
  const questions = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    difficulty: index % 2 === 0 ? 'facil' : 'medio'
  }));

  const result = pickRandomQuestions(questions, 'todas', 10);

  assert.equal(result.length, 10);
  assert.equal(result.length, Math.min(questions.length, 10));
});
