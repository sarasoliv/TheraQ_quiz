const test = require('node:test');
const assert = require('node:assert/strict');
const { pickRandomQuestions } = require('../quiz-logic.js');

test('retorna exatamente 10 perguntas embaralhadas quando a lista tem 10 ou mais itens', function () {
  const listaPerguntas = [];
  
  // Cria 12 perguntas de exemplo
  for (let i = 1; i <= 12; i++) {
    listaPerguntas.push({ id: i, difficulty: 'facil' });
  }

  const resultado = pickRandomQuestions(listaPerguntas, 'facil', 10);

  assert.equal(resultado.length, 10);
});

test('retorna array vazio se a lista fornecida tiver menos de 10 perguntas', function () {
  const listaPerguntas = [
    { id: 1, difficulty: 'medio' },
    { id: 2, difficulty: 'medio' }
  ];

  const resultado = pickRandomQuestions(listaPerguntas, 'medio', 10);

  assert.equal(resultado.length, 0);
});
