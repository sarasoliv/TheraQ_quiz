const { Pool } = require("pg");
let pool;

module.exports = async function handler(req, res) {
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
      
      // 1. Insere ou atualiza o utilizador
      const resUser = await client.query(
        "INSERT INTO cadastro_usuario (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id_usuario",
        [nome_usuario.trim().slice(0, 50)]
      );
      
      const usuarioId = resUser.rows[0].id_usuario;

      // 2. Insere a pontuação no ranking
      await client.query(
        "INSERT INTO tabela_ranking (usuario_id, nome_jogador, pontuacao_jogador, total_acertos) VALUES ($1, $2, $3, $4)",
        [usuarioId, nome_usuario.trim().slice(0, 50), Number(pontuacao_final), Number(total_acertos)]
      );

      // 3. Insere as questões respondidas (caso venham do front-end)
      if (Array.isArray(questoes_respondidas) && questoes_respondidas.length > 0) {
        for (const q of questoes_respondidas) {
          // q deve conter: questao_id, resposta_usuario, acerto
          if (q.questao_id && q.resposta_usuario !== undefined) {
            await client.query(
              `INSERT INTO questoes_respondidas (usuario_id, questao_id, resposta_usuario, acerto) 
               VALUES ($1, $2, $3, $4)`,
              [usuarioId, q.questao_id, q.resposta_usuario, Boolean(q.acerto)]
            );
          }
        }
      }
      
      await client.query("COMMIT");
      client.release();
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }

    return res.status(201).json({ success: true, saved: true });
  } catch (error) {
    console.error('Erro ao salvar no banco:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
