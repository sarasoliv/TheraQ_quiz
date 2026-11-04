const http = require("node:http");
const fs = require("node:fs");
const { Pool } = require("pg");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const maximumQuestionCount = 10;

loadEnvFile();

// Conexão PostgreSQL (Pool) para as consultas complexas e ranking
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
}) : null;

const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      return sendJson(response, 200, {
        status: "ok",
        groqConfigured: Boolean(process.env.GROQ_API_KEY), 
        databaseConfigured: Boolean(process.env.DATABASE_URL || process.env.SUPABASE_URL)
      });
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/ranking") {
      if (!pool) return sendJson(response, 503, { error: "Configure DATABASE_URL no arquivo api/.env." });
      const { rows } = await pool.query(
        "SELECT nome_jogador AS nickname, pontuacao_jogador AS score, total_acertos, data_jogado FROM tabela_ranking ORDER BY pontuacao_jogador DESC, data_jogado ASC LIMIT 8"
      );
      return sendJson(response, 200, rows);
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/perguntas") {
      if (!pool) return sendJson(response, 503, { error: "Configure DATABASE_URL no arquivo api/.env." });
      const dificuldade = normalizarDificuldade(requestUrl.searchParams.get("dificuldade"));

      let query = `
        SELECT q.id, q.enunciado, q.resposta_correta, q.dificuldade_nivel,
               f.referencia, o.opcao_a, o.opcao_b, o.opcao_c, o.opcao_d, o.opcao_e
        FROM questoes q
        JOIN opcao_questoes o ON o.id_opcao = q.opcao_id
        LEFT JOIN fonte f ON f.id = q.fonte_id
      `;
      const params = [];

      if (dificuldade) {
        query += " WHERE lower(trim(q.dificuldade_nivel)) = lower($1)";
        params.push(dificuldade);
      }

      query += " ORDER BY q.id";

      const { rows } = await pool.query(query, params);
      return sendJson(response, 200, rows.map(q => ({
        ...q,
        alternativas: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e]
      })));
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/resultados") {
      let body;
      try { body = await readJsonBody(request); }
      catch (error) { return sendJson(response, error.statusCode || 400, { error: error.message }); }
      
      const nome = typeof body?.nome_usuario === "string" ? body.nome_usuario.trim().slice(0, 50) : "";
      const acertos = Number(body?.total_acertos);
      const pontuacao = Number(body?.pontuacao_final);
      
      if (!nome || !Number.isInteger(acertos) || acertos < 0 || !Number.isInteger(pontuacao) || pontuacao < 0) {
        return sendJson(response, 400, { error: "Nome, acertos e pontuação são obrigatórios e devem ser válidos." });
      }

      if (!pool) return sendJson(response, 503, { error: "Configure DATABASE_URL no arquivo api/.env." });

      if (pool) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const resUser = await client.query(
            "INSERT INTO cadastro_usuario (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id_usuario",
            [nome]
          );
          await client.query(
            "INSERT INTO tabela_ranking (usuario_id, nome_jogador, pontuacao_jogador, total_acertos) VALUES ($1, $2, $3, $4)",
            [resUser.rows[0].id_usuario, nome, pontuacao, acertos]
          );
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally { client.release(); }
      }

      return sendJson(response, 201, { saved: true });
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/questions") {
      return await generateQuestions(request, response);
    }

    if (request.method === "GET") {
      return serveFrontend(requestUrl.pathname, response);
    }

    return sendJson(response, 405, { error: "Método não permitido." });
  } catch (error) {
    console.error("Erro no servidor:", error.message);
    if (!response.headersSent) sendJson(response, 500, { error: "Ocorreu um erro no servidor." });
  }
});

async function generateQuestions(request, response) {
  if (!process.env.GROQ_API_KEY) {
    return sendJson(response, 503, { error: "A API da Groq não está configurada no servidor." });
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return sendJson(response, error.statusCode || 400, { error: error.message });
  }

  const count = Number.isInteger(body?.quantidade)
    ? Math.min(Math.max(body.quantidade, 1), maximumQuestionCount)
    : 5;
  const topic = typeof body?.tema === "string" ? body.tema.trim().slice(0, 100) : "";
  const difficulty = typeof body?.dificuldade === "string"
    ? body.dificuldade.trim().slice(0, 30)
    : "média";

  if (!topic) return sendJson(response, 400, { error: "Informe um tema para gerar as perguntas." });

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Você cria perguntas educativas de quiz em português do Brasil. Retorne somente um objeto JSON válido, sem markdown."
          },
          {
            role: "user",
            content: `Crie exatamente ${count} perguntas de múltipla escolha sobre "${topic}" com dificuldade ${difficulty}. Cada pergunta deve ter quatro alternativas plausíveis e uma explicação educativa. Use exatamente este formato: {"perguntas":[{"pergunta":"...","alternativas":["...","...","...","..."],"respostaCorreta":0,"explicacao":"..."}]}. respostaCorreta deve ser o índice numérico da alternativa correta, de 0 a 3.`
          }
        ]
      })
    });

    if (!groqResponse.ok) {
      console.error(`A Groq respondeu com status ${groqResponse.status}.`);
      return sendJson(response, 502, { error: "A Groq não conseguiu gerar perguntas agora. Verifique a chave e tente novamente." });
    }

    const result = await groqResponse.json();
    const content = result.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    const questions = parsed.perguntas;

    if (!Array.isArray(questions) || questions.length !== count || !questions.every(isValidQuestion)) {
      return sendJson(response, 502, { error: "A IA retornou perguntas em um formato inválido. Tente novamente." });
    }

    return sendJson(response, 200, { perguntas: questions });
  } catch (error) {
    console.error("Falha ao solicitar perguntas à Groq:", error.message);
    return sendJson(response, 502, { error: "Não foi possível gerar perguntas agora. Tente novamente." });
  }
}

function isValidQuestion(question) {
  return question
    && typeof question.pergunta === "string"
    && question.pergunta.trim().length > 0
    && Array.isArray(question.alternativas)
    && question.alternativas.length === 4
    && question.alternativas.every((option) => typeof option === "string" && option.trim().length > 0)
    && Number.isInteger(question.respostaCorreta)
    && question.respostaCorreta >= 0
    && question.respostaCorreta < 4
    && typeof question.explicacao === "string"
    && question.explicacao.trim().length > 0;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8192) {
      const error = new Error("A requisição é muito grande.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("O corpo da requisição deve ser um JSON válido.");
  }
}

function serveFrontend(pathname, response) {
  const files = {
    "/": "index.html",
    "/index.html": "index.html",
    "/script.js": "script.js",
    "/styles.css": "styles.css",
    "/logo-theraq.png": "logo-theraq.png",
    "/acertou.mp3": "acertou.mp3",
    "/errou.mp3": "errou.mp3"
  };
  const fileName = files[pathname];

  if (!fileName) return sendJson(response, 404, { error: "Página não encontrada." });

  const filePath = path.join(projectRoot, fileName);
  const contentTypes = {
    "index.html": "text/html; charset=utf-8",
    "script.js": "text/javascript; charset=utf-8",
    "styles.css": "text/css; charset=utf-8",
    "logo-theraq.png": "image/png",
    "acertou.mp3": "audio/mpeg",
    "errou.mp3": "audio/mpeg"
  };

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(response, 404, { error: "Arquivo não encontrado." });
    response.writeHead(200, { "Content-Type": contentTypes[fileName] });
    response.end(content);
  });
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function normalizarDificuldade(value) {
  if (typeof value !== "string") return "";
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (!normalized || normalized === "todas") return "";
  if (["facil", "fácil"].includes(normalized)) return "facil";
  if (["medio", "media", "médio", "média"].includes(normalized)) return "medio";
  if (["dificil", "difícil"].includes(normalized)) return "dificil";
  return normalized;
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

server.listen(port, () => {
  console.log(`TheraQ disponível em http://localhost:${port}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY não configurada. O site usará as perguntas locais.");
  }
});
