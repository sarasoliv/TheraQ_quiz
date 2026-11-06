export function criarPergunta({ id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta }) {
  return { id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta };
}

export function criarConfigQuiz({ dificuldade = 'f', quantidade_perguntas = 5 } = {}) {
  return { dificuldade, quantidade_perguntas, pontuacao_atual: 0 };
}

export function criarResultadoQuiz({ nome_usuario = '', total_acertos = 0, pontuacao_final = 0 } = {}) {
  return { nome_usuario, total_acertos, pontuacao_final };
}
