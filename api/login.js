import { supabase } from './lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  // A função signInWithPassword cuida da validação e retorna uma sessão
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Supabase login error:', error.message);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Se o login for bem-sucedido, a 'data' contém a sessão do usuário e o token.
  res.status(200).json({ 
      message: 'Login successful', 
      token: data.session.access_token 
  });
}