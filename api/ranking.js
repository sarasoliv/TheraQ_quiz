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

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "DATABASE_URL não configurada." });
  }

  try {
    pool ||= new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    if (req.method === 'GET') {
      const queryText = `
        SELECT nome_jogador AS nickname, pontuacao_jogador AS score, total_acertos, data_jogado 
        FROM tabela_ranking 
        ORDER BY pontuacao_jogador DESC, data_jogado ASC 
        LIMIT 8
      `;
      const { rows } = await pool.query(queryText);
      return res.status(200).json(rows);
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error("Erro no ranking:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
