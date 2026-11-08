import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
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

  // GET: Busca os top maiores pontuações na tabela correta do Supabase
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('tabela_ranking')
        .select('nome_jogador, pontuacao_jogador, total_acertos, data_jogado')
        .order('pontuacao_jogador', { ascending: false })
        .order('data_jogado', { ascending: true })
        .limit(8);

      if (error) throw error;

      // Mapeia para o formato esperado pelo front-end (nickname e score)
      const formatted = (data || []).map(item => ({
        nickname: item.nome_jogador,
        score: item.pontuacao_jogador,
        total_acertos: item.total_acertos,
        data_jogado: item.data_jogado
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error("Erro no ranking:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
