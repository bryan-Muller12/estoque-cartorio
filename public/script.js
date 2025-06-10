// Garante que o código só rode na página de estoque
if (location.pathname.includes('estoque.html')) {
  // --- VERIFICAÇÃO DE LOGIN ---
  if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'index.html';
  }

  // --- ELEMENTOS DO DOM ---
  const formProduto = document.getElementById('form-produto');
  const nomeInput = document.getElementById('nome');
  const quantidadeInput = document.getElementById('quantidade');
  const filtroInput = document.getElementById('filtro');
  const listaProdutos = document.getElementById('lista-produtos');
  const logoutBtn = document.getElementById('logout-btn');

  // --- ELEMENTOS DO MODAL ---
  const modalOverlay = document.getElementById('edit-modal-overlay');
  const editForm = document.getElementById('edit-form');
  const editIndexInput = document.getElementById('edit-index');
  const editNomeInput = document.getElementById('edit-nome');
  const editQuantidadeInput = document.getElementById('edit-quantidade');
  const cancelBtn = document.getElementById('cancel-btn');
  const deleteBtn = document.getElementById('delete-btn');

  // --- ESTADO DA APLICAÇÃO ---
  let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

  // --- FUNÇÕES ---
  function salvarProdutos() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
  }

  function renderizarLista(filtro = '') {
    listaProdutos.innerHTML = '';
    const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(filtro.toLowerCase()));

    if (produtosFiltrados.length === 0) {
      const li = document.createElement('li');
      li.style.justifyContent = 'center';
      li.style.color = 'var(--text-light-color)';
      li.textContent = filtro ? 'Nenhum produto encontrado.' : 'Seu estoque está vazio.';
      listaProdutos.appendChild(li);
      return;
    }

    const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;

    produtosFiltrados.forEach((produto) => {
      const originalIndex = produtos.findIndex(p => p === produto);
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${produto.nome}</span>
          <span class="product-quantity">${produto.quantidade} unidades</span>
        </div>
        <div class="actions">
          <button class="btn-action btn-edit" title="Editar Item" data-index="${originalIndex}">${iconEdit}</button>
        </div>
      `;
      listaProdutos.appendChild(li);
    });
  }

  function openModal(index) {
    const produto = produtos[index];
    editIndexInput.value = index;
    editNomeInput.value = produto.nome;
    editQuantidadeInput.value = produto.quantidade;
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
  }

  function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  }

  // --- EVENT LISTENERS ---
  formProduto.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = nomeInput.value.trim();
    const quantidade = parseInt(quantidadeInput.value);
    if (nome && quantidade > 0) {
      produtos.push({ nome, quantidade });
      salvarProdutos();
      renderizarLista(filtroInput.value);
      formProduto.reset();
      nomeInput.focus();
    }
  });

  listaProdutos.addEventListener('click', (e) => {
    const editButton = e.target.closest('.btn-edit');
    if (editButton) {
      const index = parseInt(editButton.dataset.index);
      openModal(index);
    }
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(editIndexInput.value);
    const novoNome = editNomeInput.value.trim();
    const novaQuantidade = parseInt(editQuantidadeInput.value);

    if (novoNome && novaQuantidade >= 0) {
      produtos[index].nome = novoNome;
      produtos[index].quantidade = novaQuantidade;
      salvarProdutos();
      renderizarLista(filtroInput.value);
      closeModal();
    }
  });

  deleteBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      const index = parseInt(editIndexInput.value);
      produtos.splice(index, 1);
      salvarProdutos();
      renderizarLista(filtroInput.value);
      closeModal();
    }
  });

  cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  filtroInput.addEventListener('input', () => renderizarLista(filtroInput.value));
  logoutBtn.addEventListener('click', logout);

  // --- INICIALIZAÇÃO ---
  renderizarLista();
}