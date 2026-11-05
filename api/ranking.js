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

  // GET: Busca os top 10 maiores pontuações
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('pontuacao', { ascending: false })
        .limit(10);

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Salva uma nova pontuação
  if (req.method === 'POST') {
    const { nome, pontuacao } = req.body;

    if (!nome || pontuacao === undefined) {
      return res.status(400).json({ error: 'Nome e pontuação são obrigatórios.' });
    }

    try {
      const { data, error } = await supabase
        .from('ranking')
        .insert([{ nome, pontuacao }]);

      if (error) throw error;

      return res.status(201).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}