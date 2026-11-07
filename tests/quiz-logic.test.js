const test = require('node:test');
const assert = require('node:assert/strict');
const { pickRandomQuestions, normalizeDifficulty } = require('../quiz-logic.js');

test('retorna exatamente 10 perguntas embaralhadas quando a lista tem 10 ou mais itens do mesmo nível', function () {
  const listaPerguntas = [];

  for (let i = 1; i <= 12; i++) {
    listaPerguntas.push({ id: i, difficulty: 'facil' });
  }

  const resultado = pickRandomQuestions(listaPerguntas, 'facil', 10);

  assert.equal(resultado.length, 10);
  assert.ok(resultado.every((pergunta) => normalizeDifficulty(pergunta.difficulty) === 'facil'));
});

test('retorna array vazio se a lista fornecida tiver menos de 10 perguntas do nível solicitado', function () {
  const listaPerguntas = [
    { id: 1, difficulty: 'medio' },
    { id: 2, difficulty: 'medio' }
  ];

  const resultado = pickRandomQuestions(listaPerguntas, 'medio', 10);

  assert.equal(resultado.length, 0);
});

test('não mistura perguntas de níveis diferentes quando o filtro de dificuldade é aplicado', function () {
  const listaPerguntas = [
    { id: 1, difficulty: 'facil' },
    { id: 2, difficulty: 'facil' },
    { id: 3, difficulty: 'medio' },
    { id: 4, difficulty: 'dificil' }
  ];

  const resultado = pickRandomQuestions(listaPerguntas, 'facil', 2);

  assert.equal(resultado.length, 2);
  assert.ok(resultado.every((pergunta) => normalizeDifficulty(pergunta.difficulty) === 'facil'));
});
