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

    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const paramDificuldade = requestUrl.searchParams.get("dificuldade") || "facil";
    const dificuldade = normalizarDificuldade(paramDificuldade);

    const queryText = `
      SELECT
        q.id,
        q.enunciado,
        q.resposta_correta,
        q.dificuldade_nivel,
        q.justificativa_resposta,
        f.referencia,
        f.url AS fonte_url,
        o.opcao_a,
        o.opcao_b,
        o.opcao_c,
        o.opcao_d,
        o.opcao_e
      FROM questoes q
      JOIN opcao_questoes o ON o.id_opcao = q.opcao_id
      LEFT JOIN fonte f ON f.id = q.fonte_id
      WHERE translate(lower(trim(q.dificuldade_nivel)), 'áéíóúãõâêîôûàèìòùç', 'aeiouaoaeiouaeiouc') =
            translate(lower(trim($1)), 'áéíóúãõâêîôûàèìòùç', 'aeiouaoaeiouaeiouc')
      ORDER BY RANDOM()
      LIMIT 10
    `;

    const { rows } = await pool.query(queryText, [dificuldade]);

    const formattedRows = rows.map((q) => ({
      id: q.id,
      enunciado: q.enunciado,
      resposta_correta: q.resposta_correta,
      dificuldade_nivel: q.dificuldade_nivel,
      justificativa: q.justificativa_resposta,
      fonte: q.referencia,
      fonte_url: q.fonte_url,
      alternativas: [
        q.opcao_a,
        q.opcao_b,
        q.opcao_c,
        q.opcao_d,
        q.opcao_e
      ].filter(Boolean) // Remove opções nulas caso alguma pergunta tenha menos de 5 opções
    }));

    return response.status(200).json(formattedRows);
  } catch (error) {
    console.error("Erro ao consultar perguntas:", error.message);
    return response.status(500).json({
      error: "Erro ao carregar perguntas: " + error.message
    });
  }
};

function normalizarDificuldade(value) {
  if (typeof value !== "string") return "facil";

  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (!normalized || normalized === "todas") return "facil";
  if (normalized.includes("facil")) return "facil";
  if (normalized.includes("med") || normalized.includes("medio")) return "medio";
  if (normalized.includes("dif")) return "dificil";

  return normalized;
}
