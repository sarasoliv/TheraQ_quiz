const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDifficulty, pickRandomQuestions } = require('../quiz-logic.js');

test('normaliza dificuldade em minúsculas sem acentos', () => {
  assert.equal(normalizeDifficulty('FÁCIL'), 'facil');
  assert.equal(normalizeDifficulty('Médio'), 'medio');
  assert.equal(normalizeDifficulty('Difícil'), 'dificil');
  assert.equal(normalizeDifficulty('todas'), '');
});

test('seleciona exatamente 10 perguntas da dificuldade escolhida quando há material suficiente', () => {
  const questions = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    difficulty: 'facil'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 10);
  assert.ok(result.every((question) => question.difficulty === 'facil'));
});

test('faz fallback para o conjunto atual quando a dificuldade escolhida não tem material suficiente', () => {
  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    difficulty: index < 3 ? 'facil' : 'medio'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 10);
  assert.ok(result.every((question) => ['facil', 'medio'].includes(question.difficulty)));
});

test('não retorna menos de 10 perguntas quando a base atual não possui material suficiente', () => {
  const questions = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    difficulty: 'facil'
  }));

  const result = pickRandomQuestions(questions, 'facil', 10);

  assert.equal(result.length, 0);
});
