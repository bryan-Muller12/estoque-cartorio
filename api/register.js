import { supabase } from './lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  // A função signUp do Supabase cuida de tudo!
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Supabase error:', error.message);
    return res.status(400).json({ error: error.message });
  }

  // Por padrão, o Supabase pode exigir confirmação de e-mail.
  // Se você desativou isso, o usuário já estará criado e logado.
  res.status(200).json({ message: 'Registro bem-sucedido!', user: data.user });
}