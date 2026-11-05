import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase usando as variáveis configuradas no painel da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Define cabeçalhos de CORS caso a requisição venha do frontend
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
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const { nome, email } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'O campo nome é obrigatório.' });
  }

  try {
    const { data, error } = await supabase
      .from('cadastro_usuario')
      .insert([{ nome, email }]);

    if (error) {
      throw error;
    }

    return res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}