require('dotenv').config();

console.log('VARIAVEIS DISPONIVEIS:', Object.keys(process.env).join(', '));
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('./db');
const usuariosRouter = require('./routes/usuarios');
const produtosRouter = require('./routes/produtos');
const clientesRouter = require('./routes/clientes');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_padrao',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Nao autorizado. Faca login.' });
  }
  next();
}

app.post('/api/login', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ erro: 'Informe login e senha.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tb_usuarios WHERE login = ?',
      [login]
    );
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuario ou senha invalidos.' });
    }
    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Usuario ou senha invalidos.' });
    }
    req.session.usuario = {
      id: usuario.usuario_id,
      nome: usuario.nome,
      login: usuario.login,
    };
    res.json({ mensagem: 'Login realizado com sucesso.', usuario: req.session.usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ mensagem: 'Logout realizado.' });
});

app.get('/api/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ autenticado: false });
  }
  res.json({ autenticado: true, usuario: req.session.usuario });
});

app.use('/api', require('./routes/usuarios').router);
app.use('/api', produtosRouter);
app.use('/api', clientesRouter);

app.get('/cadastros/produtos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'produtos.html'));
});
app.get('/cadastros/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/cadastros/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});