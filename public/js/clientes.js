let idParaExcluir = null;

async function carregarClientes() {
  const tbody = document.getElementById('tbody-clientes');
  try {
    const res = await fetch('/api/clientes', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/'; return; }
    const clientes = await res.json();
    if (!clientes.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum cliente cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = clientes.map((c, i) => `
      <tr>
        <td class="ps-4">${i + 1}</td>
        <td>${c.nome}</td>
        <td>${c.cpf}</td>
        <td>${c.nascimento ? new Date(c.nascimento).toLocaleDateString('pt-BR') : '-'}</td>
        <td>${c.telefone}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1"
            onclick="abrirModalEditar(${c.id}, '${c.nome}', '${c.cpf}', '${c.nascimento ? c.nascimento.split('T')[0] : ''}', '${c.telefone}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="abrirModalExcluir(${c.id}, '${c.nome}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Erro ao carregar clientes.</td></tr>';
  }
}

function abrirModalNovo() {
  document.getElementById('cliente-id').value = '';
  document.getElementById('cliente-nome').value = '';
  document.getElementById('cliente-cpf').value = '';
  document.getElementById('cliente-nascimento').value = '';
  document.getElementById('cliente-telefone').value = '';
  document.getElementById('modal-titulo').innerHTML = '<i class="bi bi-person-plus me-2"></i>Novo Cliente';
  new bootstrap.Modal(document.getElementById('modalCliente')).show();
}

function abrirModalEditar(id, nome, cpf, nascimento, telefone) {
  document.getElementById('cliente-id').value = id;
  document.getElementById('cliente-nome').value = nome;
  document.getElementById('cliente-cpf').value = cpf;
  document.getElementById('cliente-nascimento').value = nascimento;
  document.getElementById('cliente-telefone').value = telefone;
  document.getElementById('modal-titulo').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Cliente';
  new bootstrap.Modal(document.getElementById('modalCliente')).show();
}

async function salvarCliente() {
  const id = document.getElementById('cliente-id').value;
  const nome = document.getElementById('cliente-nome').value.trim();
  const cpf = document.getElementById('cliente-cpf').value.trim();
  const nascimento = document.getElementById('cliente-nascimento').value;
  const telefone = document.getElementById('cliente-telefone').value.trim();

  if (!nome || !cpf || !nascimento || !telefone) {
    mostrarToast('Preencha todos os campos.', 'bg-warning'); return;
  }

  const url = id ? `/api/clientes/${id}` : '/api/clientes';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, cpf, nascimento, telefone })
    });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Erro ao salvar.', 'bg-danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
    mostrarToast(id ? 'Cliente atualizado!' : 'Cliente criado!', 'bg-success');
    carregarClientes();
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
    const res = await fetch(`/api/clientes/${idParaExcluir}`, {
      method: 'DELETE', credentials: 'include'
    });
    bootstrap.Modal.getInstance(document.getElementById('modalExcluir')).hide();
    if (res.ok) {
      mostrarToast('Cliente excluído!', 'bg-success');
      carregarClientes();
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
  window.location.href = '/';
}

fetch('/api/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => {
    if (!d.autenticado) { window.location.href = '/'; return; }
    document.getElementById('nomeUsuario').textContent = '👤 ' + d.usuario.nome;
    carregarClientes();
  });