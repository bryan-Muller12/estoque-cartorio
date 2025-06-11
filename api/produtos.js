// Dentro do arquivo: /api/produtos.js

const { Pool } = require('pg');

// A mágica acontece aqui! A Vercel fornece a URL do banco
// na variável de ambiente POSTGRES_URL.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões na Vercel
  }
});

// Esta é a função da nossa API
module.exports = async (req, res) => {
  // Por enquanto, vamos lidar apenas com a busca de dados (GET)
  if (req.method === 'GET') {
    let client;
    try {
      // Pega uma conexão do pool
      client = await pool.connect();
      
      // Executa a query para buscar todos os produtos
      const { rows } = await client.query('SELECT * FROM produtos ORDER BY nome ASC;');
      
      // Retorna os produtos como JSON
      res.status(200).json(rows);

    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
      // Libera a conexão de volta para o pool (MUITO IMPORTANTE)
      if (client) {
        client.release();
      }
    }
  } else {
    // Se o método não for GET, retorna um erro.
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} não permitido.`);
  }
};