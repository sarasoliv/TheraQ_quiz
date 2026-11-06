import { criarConfigQuiz, criarResultadoQuiz } from './struct.js';

export function validarConfiguracaoQuiz({ nome, quantidade, dificuldade }) {
  const nome_usuario = String(nome ?? '').trim();
  const quantidade_perguntas = Number(quantidade);
  const nivel = String(dificuldade ?? '').trim().toLowerCase();

  if (!nome_usuario) throw new Error('Digite seu nome.');
  if (!Number.isInteger(quantidade_perguntas) || quantidade_perguntas < 5 || quantidade_perguntas > 10) {
    throw new Error('Escolha entre 5 e 10 perguntas.');
  }
  if (!['f', 'm', 'd'].includes(nivel)) {
    throw new Error('Escolha uma dificuldade: fácil (f), média (m) ou difícil (d).');
  }

  const config = criarConfigQuiz({ dificuldade: nivel, quantidade_perguntas });
  const resultado = criarResultadoQuiz({ nome_usuario });
  return { config, resultado };
}

export function nomeDificuldade(codigo) {
  return ({ f: 'fácil', m: 'média', d: 'difícil' })[String(codigo).toLowerCase()] ?? 'inválida';
}
