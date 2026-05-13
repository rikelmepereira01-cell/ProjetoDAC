let idParaExcluir = null;

async function carregarUsuarios() {
  const tbody = document.getElementById('tbody-usuarios');
  try {
    const res = await fetch('/api/usuarios', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/login.html'; return; }
    const usuarios = await res.json();
    if (!usuarios.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum usuário encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = usuarios.map((u, i) => `
      <tr>
        <td class="ps-4">${i + 1}</td>
        <td>${u.nome}</td>
        <td>${u.login}</td>
        <td>${u.atualizado_em ? new Date(u.atualizado_em).toLocaleString('pt-BR') : '-'}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-action me-1" onclick="abrirModalEditar(${u.id}, '${u.nome}', '${u.login}')">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-outline-danger btn-action" onclick="abrirModalExcluir(${u.id}, '${u.nome}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Erro ao carregar usuários.</td></tr>';
  }
}

function abrirModalNovo() {
  document.getElementById('usuario-id').value = '';
  document.getElementById('usuario-nome').value = '';
  document.getElementById('usuario-login').value = '';
  document.getElementById('usuario-senha').value = '';
  document.getElementById('modal-titulo').innerHTML = '<i class="fas fa-user-plus me-2"></i>Novo Usuário';
  document.getElementById('senha-hint').style.display = 'none';
  new bootstrap.Modal(document.getElementById('modalUsuario')).show();
}

function abrirModalEditar(id, nome, login) {
  document.getElementById('usuario-id').value = id;
  document.getElementById('usuario-nome').value = nome;
  document.getElementById('usuario-login').value = login;
  document.getElementById('usuario-senha').value = '';
  document.getElementById('modal-titulo').innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Usuário';
  document.getElementById('senha-hint').style.display = 'block';
  new bootstrap.Modal(document.getElementById('modalUsuario')).show();
}

async function salvarUsuario() {
  const id = document.getElementById('usuario-id').value;
  const nome = document.getElementById('usuario-nome').value.trim();
  const login = document.getElementById('usuario-login').value.trim();
  const senha = document.getElementById('usuario-senha').value;

  if (!nome || !login) { mostrarToast('Preencha nome e login.', 'bg-warning'); return; }
  if (!id && !senha) { mostrarToast('Informe uma senha para o novo usuário.', 'bg-warning'); return; }

  const body = { nome, login };
  if (senha) body.senha = senha;

  const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Erro ao salvar.', 'bg-danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
    mostrarToast(id ? 'Usuário atualizado!' : 'Usuário criado!', 'bg-success');
    carregarUsuarios();
  } catch (e) {
    mostrarToast('Erro de conexão.', 'bg-danger');
  }
}

function abrirModalExcluir(id, nome) {
  idParaExcluir = id;
  document.getElementById('nome-excluir').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalExcluir')).show();
}

async function confirmarExclusao() {
  try {
    const res = await fetch(`/api/usuarios/${idParaExcluir}`, {
      method: 'DELETE', credentials: 'include'
    });
    bootstrap.Modal.getInstance(document.getElementById('modalExcluir')).hide();
    if (res.ok) {
      mostrarToast('Usuário excluído!', 'bg-success');
      carregarUsuarios();
    } else {
      mostrarToast('Erro ao excluir.', 'bg-danger');
    }
  } catch (e) {
    mostrarToast('Erro de conexão.', 'bg-danger');
  }
}

function mostrarToast(msg, bgClass) {
  const toast = document.getElementById('toast');
  toast.className = `toast align-items-center text-white border-0 ${bgClass}`;
  document.getElementById('toast-msg').textContent = msg;
  new bootstrap.Toast(toast, { delay: 3000 }).show();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login.html';
}

carregarUsuarios();