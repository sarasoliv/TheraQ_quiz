// Persistência PostgreSQL reutilizável pelo back-end.
async function salvarResultadoQuiz(db, resultado) {
  if (!db || typeof db.query !== 'function') throw new TypeError('Forneça uma conexão PostgreSQL com query().');
  const nome = String(resultado?.nome_usuario ?? '').trim().slice(0, 50);
  const acertos = Number(resultado?.total_acertos);
  const pontuacao = Number(resultado?.pontuacao_final);
  if (!nome) throw new Error('O nome do usuário é obrigatório.');
  if (!Number.isInteger(acertos) || acertos < 0 || !Number.isInteger(pontuacao) || pontuacao < 0) {
    throw new TypeError('Acertos e pontuação devem ser inteiros não negativos.');
  }
  const client = typeof db.connect === 'function' ? await db.connect() : db;
  try {
    await client.query('BEGIN');
    const user = await client.query(
      'INSERT INTO cadastro_usuario (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id_usuario',
      [nome]
    );
    const result = await client.query(
      'INSERT INTO tabela_ranking (usuario_id, nome_jogador, pontuacao_jogador, total_acertos) VALUES ($1, $2, $3, $4) RETURNING id_jogador',
      [user.rows[0].id_usuario, nome, pontuacao, acertos]
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client !== db && typeof client.release === 'function') client.release();
  }
}
module.exports = { salvarResultadoQuiz };
