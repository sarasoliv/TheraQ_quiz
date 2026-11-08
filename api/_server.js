const { Pool } = require("pg");
let pool;

module.exports = async function handler(req, res) {
  // Configuração de CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "DATABASE_URL não configurada." });
  }

  const { nome_usuario, total_acertos, pontuacao_final, questoes_respondidas } = req.body || {};

  if (!nome_usuario) {
    return res.status(400).json({ error: 'O nome do usuário é obrigatório.' });
  }

  try {
    pool ||= new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // 1. Insere ou atualiza o usuário no banco
      const resUser = await client.query(
        "INSERT INTO cadastro_usuario (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id_usuario",
        [nome_usuario.trim().slice(0, 50)]
      );

      const usuarioId = resUser.rows[0].id_usuario;

      // 2. Insere a pontuação final no ranking
      await client.query(
        "INSERT INTO tabela_ranking (usuario_id, nome_jogador, pontuacao_jogador, total_acertos) VALUES ($1, $2, $3, $4)",
        [usuarioId, nome_usuario.trim().slice(0, 50), Number(pontuacao_final || 0), Number(total_acertos || 0)]
      );

      // 3. Insere o histórico de questões respondidas (Bulk Insert otimizado)
      if (Array.isArray(questoes_respondidas) && questoes_respondidas.length > 0) {
        const validQuestions = questoes_respondidas.filter(
          q => q.questao_id && q.resposta_usuario !== undefined
        );

        if (validQuestions.length > 0) {
          const values = [];
          const valueClauses = validQuestions.map((q, index) => {
            const offset = index * 4;
            values.push(usuarioId, q.questao_id, q.resposta_usuario, Boolean(q.acerto));
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
          });

          const bulkQuery = `
            INSERT INTO questoes_respondidas (usuario_id, questao_id, resposta_usuario, acerto)
            VALUES ${valueClauses.join(", ")}
          `;

          await client.query(bulkQuery, values);
        }
      }

      await client.query("COMMIT");
      return res.status(201).json({ success: true, saved: true });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao salvar no banco:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
