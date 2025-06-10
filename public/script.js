// Garante que o código só rode na página de estoque
if (document.body.id === 'page-estoque' || location.pathname.includes('estoque.html')) {
  // --- VERIFICAÇÃO DE LOGIN ---
  if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'index.html';
  }

  // --- ELEMENTOS DO DOM ---
  const filtroInput = document.getElementById('filtro');
  const listaProdutos = document.getElementById('lista-produtos');
  const logoutBtn = document.getElementById('logout-btn');

  // --- MODAL DE ADICIONAR ---
  const openAddModalBtn = document.getElementById('open-add-modal-btn');
  const addModalOverlay = document.getElementById('add-modal-overlay');
  const addForm = document.getElementById('add-form');
  const addNomeInput = document.getElementById('add-nome');
  const addQuantidadeInput = document.getElementById('add-quantidade');
  const addMinQuantidadeInput = document.getElementById('add-min-quantidade');
  const cancelAddBtn = document.getElementById('cancel-add-btn');

  // --- MODAL DE EDITAR ---
  const editModalOverlay = document.getElementById('edit-modal-overlay');
  const editForm = document.getElementById('edit-form');
  const editIndexInput = document.getElementById('edit-index');
  const editNomeInput = document.getElementById('edit-nome');
  const editQuantidadeInput = document.getElementById('edit-quantidade');
  const editMinQuantidadeInput = document.getElementById('edit-min-quantidade');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const deleteBtn = document.getElementById('delete-btn');
  
  // --- NOTIFICAÇÕES ---
  const notificationsBtn = document.getElementById('notifications-btn');
  const notificationsTab = document.getElementById('notifications-tab');
  const notificationsList = document.getElementById('notifications-list');
  const notificationsBadge = document.getElementById('notifications-badge');
  const clearNotificationsBtn = document.getElementById('clear-notifications-btn');

  // --- ESTADO DA APLICAÇÃO ---
  let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

  // --- FUNÇÕES ---

  function salvarDados() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  function renderizarTudo() {
    renderizarLista();
    renderizarNotificacoes();
  }

  function checarEstoqueEAtualizarNotificacoes() {
    notifications = []; // Limpa para reavaliar todos
    produtos.forEach(produto => {
      if (produto.quantidade < produto.minQuantidade) {
        const notificationText = `<strong>${produto.nome}</strong> está com estoque baixo! (${produto.quantidade} de ${produto.minQuantidade})`;
        if (!notifications.includes(notificationText)) {
            notifications.push(notificationText);
        }
      }
    });
    salvarDados();
    renderizarNotificacoes();
  }

  function renderizarNotificacoes() {
    notificationsList.innerHTML = '';
    if (notifications.length > 0) {
      notifications.forEach(notificacao => {
        const li = document.createElement('li');
        li.innerHTML = notificacao;
        notificationsList.appendChild(li);
      });
      notificationsBadge.textContent = notifications.length;
      notificationsBadge.classList.remove('hidden');
    } else {
      notificationsList.innerHTML = '<li>Nenhuma notificação.</li>';
      notificationsBadge.classList.add('hidden');
    }
  }

  function renderizarLista() {
    listaProdutos.innerHTML = '';
    const filtro = filtroInput.value.toLowerCase();
    const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(filtro));

    if (produtosFiltrados.length === 0) {
      listaProdutos.innerHTML = `<li style="justify-content: center; color: var(--text-light-color);">${filtro ? 'Nenhum produto encontrado.' : 'Seu estoque está vazio.'}</li>`;
      return;
    }

    const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;

    produtosFiltrados.forEach((produto) => {
      const originalIndex = produtos.findIndex(p => p === produto);
      const li = document.createElement('li');
      if (produto.quantidade < produto.minQuantidade) {
          li.classList.add('low-stock');
      }

      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${produto.nome}</span>
          <span class="product-quantity">${produto.quantidade} unidades (Mín: ${produto.minQuantidade})</span>
        </div>
        <div class="actions">
          <button class="btn-action btn-edit" title="Editar Item" data-index="${originalIndex}">${iconEdit}</button>
        </div>
      `;
      listaProdutos.appendChild(li);
    });
  }
  
  // --- FUNÇÕES DE MODAL ---
  const openModal = (overlay) => overlay.classList.remove('hidden');
  const closeModal = (overlay) => overlay.classList.add('hidden');

  function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  }

  // --- EVENT LISTENERS ---

  // Adicionar Produto
  openAddModalBtn.addEventListener('click', () => openModal(addModalOverlay));
  cancelAddBtn.addEventListener('click', () => closeModal(addModalOverlay));
  addModalOverlay.addEventListener('click', (e) => {
      if(e.target === addModalOverlay) closeModal(addModalOverlay);
  });
  
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = addNomeInput.value.trim();
    const quantidade = parseInt(addQuantidadeInput.value, 10);
    const minQuantidade = parseInt(addMinQuantidadeInput.value, 10);

    if (nome && !isNaN(quantidade) && !isNaN(minQuantidade) && minQuantidade > 0) {
      produtos.push({ nome, quantidade, minQuantidade });
      checarEstoqueEAtualizarNotificacoes(); // Salva e renderiza tudo
      renderizarTudo();
      closeModal(addModalOverlay);
      addForm.reset();
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
  });

  // Editar e Deletar Produto
  listaProdutos.addEventListener('click', (e) => {
    const editButton = e.target.closest('.btn-edit');
    if (editButton) {
      const index = parseInt(editButton.dataset.index, 10);
      const produto = produtos[index];
      editIndexInput.value = index;
      editNomeInput.value = produto.nome;
      editQuantidadeInput.value = produto.quantidade;
      editMinQuantidadeInput.value = produto.minQuantidade;
      openModal(editModalOverlay);
    }
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(editIndexInput.value, 10);
    const nome = editNomeInput.value.trim();
    const quantidade = parseInt(editQuantidadeInput.value, 10);
    const minQuantidade = parseInt(editMinQuantidadeInput.value, 10);

    if (nome && !isNaN(quantidade) && !isNaN(minQuantidade) && minQuantidade > 0) {
        produtos[index] = { nome, quantidade, minQuantidade };
        checarEstoqueEAtualizarNotificacoes();
        renderizarTudo();
        closeModal(editModalOverlay);
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
  });
  
  deleteBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      const index = parseInt(editIndexInput.value, 10);
      produtos.splice(index, 1);
      checarEstoqueEAtualizarNotificacoes();
      renderizarTudo();
      closeModal(editModalOverlay);
    }
  });

  cancelEditBtn.addEventListener('click', () => closeModal(editModalOverlay));
  editModalOverlay.addEventListener('click', (e) => {
    if(e.target === editModalOverlay) closeModal(editModalOverlay);
  });
  
  // Notificações
  notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Impede que o clique feche a aba imediatamente
      notificationsTab.classList.toggle('hidden');
  });

  clearNotificationsBtn.addEventListener('click', () => {
      notifications = [];
      salvarDados();
      renderizarNotificacoes();
  });
  
  // Fechar aba de notificações ao clicar fora
  document.addEventListener('click', (e) => {
      if (!notificationsTab.classList.contains('hidden') && !notificationsTab.contains(e.target) && e.target !== notificationsBtn) {
          notificationsTab.classList.add('hidden');
      }
  });

  // Outros
  filtroInput.addEventListener('input', renderizarLista);
  logoutBtn.addEventListener('click', logout);

  // --- INICIALIZAÇÃO ---
  document.addEventListener('DOMContentLoaded', renderizarTudo);
}