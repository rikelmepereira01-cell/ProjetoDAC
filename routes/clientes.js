const express = require('express');
const router = express.Router();
const db = require('../db');

function isAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

router.get('/clientes', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pessoa_id as id, nome, cpf, nascimento, telefone, atualizado_em
      FROM tb_pessoas ORDER BY nome
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

router.post('/clientes', isAuth, async (req, res) => {
  const { nome, cpf, nascimento, telefone } = req.body;
  if (!nome || !cpf || !nascimento || !telefone) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      'INSERT INTO tb_pessoas (nome, cpf, nascimento, telefone, atualizado_por, atualizado_em) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, cpf, nascimento, telefone, req.session.usuario.id, hoje]
    );
    res.status(201).json({ id: result.insertId, nome, cpf, nascimento, telefone });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'CPF já cadastrado' });
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

router.put('/clientes/:id', isAuth, async (req, res) => {
  const { nome, cpf, nascimento, telefone } = req.body;
  if (!nome || !cpf || !nascimento || !telefone) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  try {
    const hoje = new Date().toISOString().split('T')[0];
    await db.query(
      'UPDATE tb_pessoas SET nome=?, cpf=?, nascimento=?, telefone=?, atualizado_por=?, atualizado_em=? WHERE pessoa_id=?',
      [nome, cpf, nascimento, telefone, req.session.usuario.id, hoje, req.params.id]
    );
    res.json({ mensagem: 'Cliente atualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'CPF já cadastrado' });
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

router.delete('/clientes/:id', isAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_pessoas WHERE pessoa_id = ?', [req.params.id]);
    res.json({ mensagem: 'Cliente excluído' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

module.exports = router;