const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  const client = await pool.connect();
  try {
    // MÉTODO GET: Listar todos os produtos
    if (req.method === 'GET') {
      const { rows } = await client.query('SELECT * FROM produtos ORDER BY id ASC;');
      return res.status(200).json(rows);
    } 
    
    // MÉTODO POST: Adicionar um novo produto
    else if (req.method === 'POST') {
      const { nome, quantidade, minQuantidade } = req.body;
      if (!nome || quantidade === undefined || minQuantidade === undefined) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      }
      const query = 'INSERT INTO produtos (nome, quantidade, min_quantidade) VALUES ($1, $2, $3) RETURNING *;';
      const values = [nome, parseInt(quantidade), parseInt(minQuantidade)];
      const { rows } = await client.query(query, values);
      return res.status(201).json(rows[0]);
    } 
    
    // MÉTODO PUT: Atualizar um produto existente
    else if (req.method === 'PUT') {
      const { id } = req.query; // Pegamos o ID da URL, ex: /api/produtos?id=1
      const { nome, quantidade, min_quantidade } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'O ID do produto é obrigatório.' });
      }
      const query = 'UPDATE produtos SET nome = $1, quantidade = $2, min_quantidade = $3 WHERE id = $4 RETURNING *;';
      const values = [nome, parseInt(quantidade), parseInt(min_quantidade), id];
      const { rows } = await client.query(query, values);
      return res.status(200).json(rows[0]);
    } 
    
    // MÉTODO DELETE: Excluir um produto
    else if (req.method === 'DELETE') {
      const { id } = req.query; // Pegamos o ID da URL
      if (!id) {
        return res.status(400).json({ error: 'O ID do produto é obrigatório.' });
      }
      await client.query('DELETE FROM produtos WHERE id = $1;', [id]);
      return res.status(204).send(); // 204 No Content - sucesso, sem corpo de resposta
    } 
    
    // Se for outro método
    else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};