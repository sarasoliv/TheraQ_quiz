const { Pool } = require("pg");
let pool;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { nome } = req.query || {};

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome não fornecido.' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'DATABASE_URL não configurada.' });
  }

  try {
    pool ||= new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const nomeFormatado = nome.trim().toLowerCase();

    // Consulta direta na tabela de cadastro ignorando maiúsculas e minúsculas
    const query = `
      SELECT id_usuario 
      FROM cadastro_usuario 
      WHERE LOWER(nome) = $1 
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [nomeFormatado]);

    return res.status(200).json({ existe: rows.length > 0 });
  } catch (error) {
    console.error('Erro ao verificar cadastro no banco:', error.message);
    return res.status(500).json({ error: error.message });
  }
};