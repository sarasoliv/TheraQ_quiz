const test = require('node:test');
const assert = require('node:assert/strict');
const { pickRandomQuestions } = require('../quiz-logic.js');

test('retorna exatamente 10 perguntas embaralhadas da dificuldade selecionada', function() {
  const perguntasExemplo = [];
  
  // Criando 15 perguntas fáceis para o teste
  for (let i = 1; i <= 15; i++) {
    perguntasExemplo.push({ id: i, difficulty: 'facil' });
  }

  const resultado = pickRandomQuestions(perguntasExemplo, 'facil');

  assert.equal(resultado.length, 10);
  assert.ok(resultado.every(function(q) { return q.difficulty === 'facil'; }));
});

test('retorna array vazio se tiver menos de 10 perguntas da dificuldade', function() {
  const perguntasExemplo = [
    { id: 1, difficulty: 'facil' },
    { id: 2, difficulty: 'facil' }
  ];

  const resultado = pickRandomQuestions(perguntasExemplo, 'facil');

  assert.equal(resultado.length, 0);
});
