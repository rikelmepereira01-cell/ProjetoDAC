const express = require('express');
const router = express.Router();
const db = require('../../db');
function isAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'Não autenticado' });
} 
// Tipos de produto
router.get('/produto-tipos', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT material_tipo_id as id, descricao FROM tb_produto_tipo ORDER BY descricao');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tipos' });
  }
});
router.post('/produto-tipos', isAuth, async (req, res) => {
  const { descricao } = req.body;
  if (!descricao) return res.status(400).json({ error: 'Descrição obrigatória' });
  try {
    const [result] = await db.query('INSERT INTO tb_produto_tipo (descricao) VALUES (?)', [descricao]);
    res.status(201).json({ id: result.insertId, descricao });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Tipo já existe' });
    res.status(500).json({ error: 'Erro ao criar tipo' });
  }
});
router.delete('/produto-tipos/:id', isAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_produto_tipo WHERE material_tipo_id = ?', [req.params.id]);
    res.json({ mensagem: 'Tipo excluído' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir tipo' });
  }
});
// Produtos
router.get('/produtos', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.produto_id as id, p.descricao, p.produto_tipo_id,
             t.descricao as tipo_descricao, p.atualizado_em
      FROM tb_produtos p
      LEFT JOIN tb_produto_tipo t ON t.material_tipo_id = p.produto_tipo_id
      ORDER BY p.descricao
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});
router.post('/produtos', isAuth, async (req, res) => {
  const { descricao, produto_tipo_id } = req.body;
  if (!descricao || !produto_tipo_id) return res.status(400).json({ error: 'Descrição e tipo são obrigatórios' });
  try {
    const now = new Date().toTimeString().split(' ')[0];
    const [result] = await db.query(
      'INSERT INTO tb_produtos (descricao, produto_tipo_id, atualizado_em, atualizado_por) VALUES (?, ?, ?, ?)',
      [descricao, produto_tipo_id, now, req.session.usuario.id]
    );
    res.status(201).json({ id: result.insertId, descricao, produto_tipo_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Produto já existe' });
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});
router.put('/produtos/:id', isAuth, async (req, res) => {
  const { descricao, produto_tipo_id } = req.body;
  if (!descricao || !produto_tipo_id) return res.status(400).json({ error: 'Descrição e tipo são obrigatórios' });
  try {
    const now = new Date().toTimeString().split(' ')[0];
    await db.query(
      'UPDATE tb_produtos SET descricao=?, produto_tipo_id=?, atualizado_em=?, atualizado_por=? WHERE produto_id=?',
      [descricao, produto_tipo_id, now, req.session.usuario.id, req.params.id]
    );
    res.json({ mensagem: 'Produto atualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Produto já existe' });
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});
router.delete('/produtos/:id', isAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_produtos WHERE produto_id = ?', [req.params.id]);
    res.json({ mensagem: 'Produto excluído' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});
module.exports = router;