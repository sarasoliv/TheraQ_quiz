// Handler compatível com plataformas serverless que fornecem DATABASE_URL.
const { Pool } = require("pg");
let pool;

module.exports = async function handler(request, response) {
  if (!process.env.DATABASE_URL) {
    return response.status(503).json({ error: "DATABASE_URL não configurada." });
  }

  try {
    pool ||= new Pool({ 
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    });

    const queryText = `
      SELECT q.id, q.enunciado, q.resposta_correta, q.dificuldade_nivel,
             f.referencia, o.opcao_a, o.opcao_b, o.opcao_c, o.opcao_d, o.opcao_e
      FROM questoes q 
      JOIN opcao_questoes o ON o.id_opcao = q.opcao_id
      LEFT JOIN fonte f ON f.id = q.fonte_id 
      ORDER BY q.id
    `;

    const { rows } = await pool.query(queryText);
    
    const formattedRows = rows.map(q => ({
      ...q,
      alternativas: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e]
    }));

    return response.status(200).json(formattedRows);
  } catch (error) {
    console.error("Erro ao consultar perguntas:", error.message);
    return response.status(500).json({ error: "Erro ao carregar perguntas: " + error.message });
  }
};
