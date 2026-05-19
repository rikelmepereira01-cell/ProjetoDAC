let idParaExcluir = null;
let excluindoTipo = false;

async function carregarTipos() {
  const tbody = document.getElementById('tbody-tipos');
  try {
    const res = await fetch('/api/produto-tipos', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/'; return; }
    const tipos = await res.json();
    if (!tipos.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">Nenhum tipo cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = tipos.map((t, i) => `
      <tr>
        <td class="ps-4">${i + 1}</td>
        <td>${t.descricao}</td>
        <td class="text-center">
          <button class="btn btn-outline-danger btn-sm" onclick="abrirModalExcluirTipo(${t.id}, '${t.descricao}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-danger">Erro ao carregar tipos.</td></tr>';
  }
}

async function carregarProdutos() {
  const tbody = document.getElementById('tbody-produtos');
  try {
    const res = await fetch('/api/produtos', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/'; return; }
    const produtos = await res.json();
    if (!produtos.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Nenhum produto cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = produtos.map((p, i) => `
      <tr>
        <td class="ps-4">${i + 1}</td>
        <td>${p.descricao}</td>
        <td>${p.tipo_descricao || '—'}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1"
            onclick="abrirModalEditar(${p.id}, '${p.descricao}', ${p.produto_tipo_id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="abrirModalExcluirProduto(${p.id}, '${p.descricao}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger">Erro ao carregar produtos.</td></tr>';
  }
}

async function carregarSelectTipos() {
  const sel = document.getElementById('produto-tipo');
  const res = await fetch('/api/produto-tipos', { credentials: 'include' });
  const tipos = await res.json();
  sel.innerHTML = '<option value="">— Selecione —</option>' +
    tipos.map(t => `<option value="${t.id}">${t.descricao}</option>`).join('');
}

function abrirModalTipo() {
  document.getElementById('tipo-id').value = '';
  document.getElementById('tipo-descricao').value = '';
  new bootstrap.Modal(document.getElementById('modalTipo')).show();
}

async function salvarTipo() {
  const descricao = document.getElementById('tipo-descricao').value.trim();
  if (!descricao) { mostrarToast('Informe a descrição.', 'bg-warning'); return; }
  try {
    const res = await fetch('/api/produto-tipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ descricao })
    });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Erro ao salvar.', 'bg-danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalTipo')).hide();
    mostrarToast('Tipo criado!', 'bg-success');
    carregarTipos();
  } catch (e) {
    mostrarToast('Erro de conexão.', 'bg-danger');
  }
}

function abrirModalProduto() {
  document.getElementById('produto-id').value = '';
  document.getElementById('produto-descricao').value = '';
  document.getElementById('modal-produto-titulo').innerHTML = '<i class="bi bi-box-seam me-2"></i>Novo Produto';
  carregarSelectTipos();
  new bootstrap.Modal(document.getElementById('modalProduto')).show();
}

function abrirModalEditar(id, descricao, tipoId) {
  document.getElementById('produto-id').value = id;
  document.getElementById('produto-descricao').value = descricao;
  document.getElementById('modal-produto-titulo').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Produto';
  carregarSelectTipos().then(() => {
    document.getElementById('produto-tipo').value = tipoId;
  });
  new bootstrap.Modal(document.getElementById('modalProduto')).show();
}

async function salvarProduto() {
  const id = document.getElementById('produto-id').value;
  const descricao = document.getElementById('produto-descricao').value.trim();
  const produto_tipo_id = document.getElementById('produto-tipo').value;
  if (!descricao || !produto_tipo_id) { mostrarToast('Preencha todos os campos.', 'bg-warning'); return; }

  const url = id ? `/api/produtos/${id}` : '/api/produtos';
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ descricao, produto_tipo_id: parseInt(produto_tipo_id) })
    });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Erro ao salvar.', 'bg-danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
    mostrarToast(id ? 'Produto atualizado!' : 'Produto criado!', 'bg-success');
    carregarProdutos();
  } catch (e) {
    mostrarToast('Erro de conexão.', 'bg-danger');
  }
}

function abrirModalExcluirTipo(id, nome) {
  idParaExcluir = id;
  excluindoTipo = true;
  document.getElementById('nome-excluir').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalExcluir')).show();
}

function abrirModalExcluirProduto(id, nome) {
  idParaExcluir = id;
  excluindoTipo = false;
  document.getElementById('nome-excluir').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalExcluir')).show();
}

async function confirmarExclusao() {
  const url = excluindoTipo
    ? `/api/produto-tipos/${idParaExcluir}`
    : `/api/produtos/${idParaExcluir}`;
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    bootstrap.Modal.getInstance(document.getElementById('modalExcluir')).hide();
    if (res.ok) {
      mostrarToast('Excluído com sucesso!', 'bg-success');
      carregarTipos();
      carregarProdutos();
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
    carregarTipos();
    carregarProdutos();
  });