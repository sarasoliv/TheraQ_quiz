const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDifficulty, pickRandomQuestions } = require('../quiz-logic.js');

test('normaliza a palavra da dificuldade', function () {
  assert.equal(normalizeDifficulty('FACIL'), 'facil');
  assert.equal(normalizeDifficulty('medio '), 'medio');
  assert.equal(normalizeDifficulty('dificil'), 'dificil');
});

test('retorna exatamente 10 perguntas embaralhadas da mesma dificuldade', function () {
  const listaPerguntas = [];

  // Cria 12 perguntas fáceis para o teste
  for (let i = 1; i <= 12; i++) {
    listaPerguntas.push({
      id: 'fact-' + i,
      difficulty: 'facil'
    });
  }

  const resultado = pickRandomQuestions(listaPerguntas, 'facil', 10);

  assert.equal(resultado.length, 10);
  assert.ok(
    resultado.every(function (item) {
      return item.difficulty === 'facil';
    })
  );
});

test('retorna lista vazia se a quantidade de perguntas for menor que 10', function () {
  const listaPerguntas = [
    { id: 1, difficulty: 'facil' },
    { id: 2, difficulty: 'facil' }
  ];

  const resultado = pickRandomQuestions(listaPerguntas, 'facil', 10);

  assert.equal(resultado.length, 0);
});
