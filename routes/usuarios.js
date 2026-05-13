const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

function isAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

router.get('/usuarios', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT usuario_id as id, nome, login, atualizado_em FROM tb_usuarios ORDER BY nome'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.get('/usuarios/:id', isAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT usuario_id as id, nome, login, atualizado_em FROM tb_usuarios WHERE usuario_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.post('/usuarios', isAuth, async (req, res) => {
  const { nome, login, senha } = req.body;
  if (!nome || !login || !senha) {
    return res.status(400).json({ error: 'Nome, login e senha são obrigatórios' });
  }
  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      'INSERT INTO tb_usuarios (nome, login, senha) VALUES (?, ?, ?)',
      [nome, login, hash]
    );
    res.status(201).json({ id: result.insertId, nome, login });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Login já existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

router.put('/usuarios/:id', isAuth, async (req, res) => {
  const { nome, login, senha } = req.body;
  if (!nome || !login) {
    return res.status(400).json({ error: 'Nome e login são obrigatórios' });
  }
  try {
    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      await db.query(
        'UPDATE tb_usuarios SET nome=?, login=?, senha=?, atualizado_em=NOW() WHERE usuario_id=?',
        [nome, login, hash, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE tb_usuarios SET nome=?, login=?, atualizado_em=NOW() WHERE usuario_id=?',
        [nome, login, req.params.id]
      );
    }
    res.json({ mensagem: 'Usuário atualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Login já existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

router.delete('/usuarios/:id', isAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_usuarios WHERE usuario_id = ?', [req.params.id]);
    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

module.exports = { router };