const express = require('express');
const router = express.Router();
const db = require('../db');

function isAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

router.get('/feedback', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.feedback_id as id, f.datahora, f.observacao, f.atualizado_por,
             p.nome as cliente_nome, pr.descricao as produto_descricao,
             f.cliente_id, f.produto_id
      FROM tb_feedback f
      LEFT JOIN tb_pessoas p   ON p.pessoa_id   = f.cliente_id
      LEFT JOIN tb_produtos pr ON pr.produto_id  = f.produto_id
      ORDER BY f.feedback_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar feedbacks' });
  }
});

router.post('/feedback', isAuth, async (req, res) => {
  const { cliente_id, produto_id, observacao } = req.body;
  if (!observacao) return res.status(400).json({ error: 'Observação é obrigatória' });
  try {
    const agora = new Date().toTimeString().split(' ')[0];
    const [result] = await db.query(
      'INSERT INTO tb_feedback (datahora, cliente_id, produto_id, observacao, atualizado_por) VALUES (?, ?, ?, ?, ?)',
      [agora, cliente_id || null, produto_id || null, observacao, req.session.usuario.id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar feedback' });
  }
});

router.put('/feedback/:id', isAuth, async (req, res) => {
  const { cliente_id, produto_id, observacao } = req.body;
  if (!observacao) return res.status(400).json({ error: 'Observação é obrigatória' });
  try {
    await db.query(
      'UPDATE tb_feedback SET cliente_id=?, produto_id=?, observacao=?, atualizado_por=? WHERE feedback_id=?',
      [cliente_id || null, produto_id || null, observacao, req.session.usuario.id, req.params.id]
    );
    res.json({ mensagem: 'Feedback atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar feedback' });
  }
});

router.delete('/feedback/:id', isAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_feedback WHERE feedback_id = ?', [req.params.id]);
    res.json({ mensagem: 'Feedback excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir feedback' });
  }
});

module.exports = router;