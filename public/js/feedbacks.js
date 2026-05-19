let idParaExcluir = null;

async function carregarSelects() {
  const [clientes, produtos] = await Promise.all([
    fetch('/api/clientes', { credentials: 'include' }).then(r => r.json()),
    fetch('/api/produtos', { credentials: 'include' }).then(r => r.json()),
  ]);

  const selCliente = document.getElementById('feedback-cliente');
  selCliente.innerHTML = '<option value="">— Sem cliente —</option>' +
    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

  const selProduto = document.getElementById('feedback-produto');
  selProduto.innerHTML = '<option value="">— Sem produto —</option>' +
    produtos.map(p => `<option value="${p.id}">${p.descricao}</option>`).join('');
}

async function carregarFeedbacks() {
  const tbody = document.getElementById('tbody-feedback');
  try {
    const res = await fetch('/api/feedback', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/'; return; }
    const feedbacks = await res.json();

    if (!feedbacks.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum feedback cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = feedbacks.map((f, i) => `
      <tr>
        <td class="ps-4">${i + 1}</td>
        <td>${f.cliente_nome || '<span class="text-muted">—</span>'}</td>
        <td>${f.produto_descricao || '<span class="text-muted">—</span>'}</td>
        <td><span class="badge-obs" title="${f.observacao}">${f.observacao}</span></td>
        <td><span class="text-muted small">${f.datahora || '—'}</span></td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1"
            onclick="abrirModalEditar(${f.id}, ${f.cliente_id || 'null'}, ${f.produto_id || 'null'}, \`${f.observacao.replace(/`/g, "'")}\`)">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="abrirModalExcluir(${f.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Erro ao carregar feedbacks.</td></tr>';
  }
}

function abrirModalNovo() {
  document.getElementById('feedback-id').value = '';
  document.getElementById('feedback-cliente').value = '';
  document.getElementById('feedback-produto').value = '';
  document.getElementById('feedback-observacao').value = '';
  document.getElementById('modal-titulo').innerHTML = '<i class="bi bi-chat-left-text me-2"></i>Novo Feedback';
  new bootstrap.Modal(document.getElementById('modalFeedback')).show();
}

function abrirModalEditar(id, clienteId, produtoId, observacao) {
  document.getElementById('feedback-id').value = id;
  document.getElementById('feedback-cliente').value = clienteId || '';
  document.getElementById('feedback-produto').value = produtoId || '';
  document.getElementById('feedback-observacao').value = observacao;
  document.getElementById('modal-titulo').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Feedback';
  new bootstrap.Modal(document.getElementById('modalFeedback')).show();
}

async function salvarFeedback() {
  const id         = document.getElementById('feedback-id').value;
  const cliente_id = document.getElementById('feedback-cliente').value || null;
  const produto_id = document.getElementById('feedback-produto').value || null;
  const observacao = document.getElementById('feedback-observacao').value.trim();

  if (!observacao) { mostrarToast('A observação é obrigatória.', 'bg-warning'); return; }

  const url    = id ? `/api/feedback/${id}` : '/api/feedback';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        cliente_id: cliente_id ? parseInt(cliente_id) : null,
        produto_id: produto_id ? parseInt(produto_id) : null,
        observacao
      })
    });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Erro ao salvar.', 'bg-danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalFeedback')).hide();
    mostrarToast(id ? 'Feedback atualizado!' : 'Feedback registrado!', 'bg-success');
    carregarFeedbacks();
  } catch (e) {
    mostrarToast('Erro de conexão.', 'bg-danger');
  }
}

function abrirModalExcluir(id) {
  idParaExcluir = id;
  new bootstrap.Modal(document.getElementById('modalExcluir')).show();
}

async function confirmarExclusao() {
  try {
    const res = await fetch(`/api/feedback/${idParaExcluir}`, {
      method: 'DELETE', credentials: 'include'
    });
    bootstrap.Modal.getInstance(document.getElementById('modalExcluir')).hide();
    if (res.ok) {
      mostrarToast('Feedback excluído!', 'bg-success');
      carregarFeedbacks();
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
    carregarSelects();
    carregarFeedbacks();
  });