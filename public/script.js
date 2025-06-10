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

    produtosFiltrados.forEach((produto) => {
      const originalIndex = produtos.findIndex(p => p === produto);
      const li = document.createElement('li');
      if (produto.quantidade < produto.minQuantidade) {
          li.classList.add('low-stock');
      }
      
      // --- ALTERAÇÃO --- Adicionados botões de + e -
      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${produto.nome}</span>
          <span class="product-quantity">${produto.quantidade} unidades (Mín: ${produto.minQuantidade})</span>
        </div>
        <div class="actions">
          <button class="btn-action btn-quantity-decrease" title="Diminuir" data-index="${originalIndex}"><i class="fas fa-minus"></i></button>
          <button class="btn-action btn-quantity-increase" title="Aumentar" data-index="${originalIndex}"><i class="fas fa-plus"></i></button>
          <button class="btn-action btn-edit" title="Editar Item" data-index="${originalIndex}"><i class="fas fa-pencil-alt"></i></button>
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
      checarEstoqueEAtualizarNotificacoes();
      renderizarTudo();
      closeModal(addModalOverlay);
      addForm.reset();
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
  });

  // --- ALTERAÇÃO --- Listener de Ações na Lista de Produtos
  listaProdutos.addEventListener('click', (e) => {
    const decreaseBtn = e.target.closest('.btn-quantity-decrease');
    const increaseBtn = e.target.closest('.btn-quantity-increase');
    const editBtn = e.target.closest('.btn-edit');

    // Diminuir Quantidade
    if (decreaseBtn) {
        const index = parseInt(decreaseBtn.dataset.index, 10);
        if (produtos[index].quantidade > 0) {
            produtos[index].quantidade--;
            checarEstoqueEAtualizarNotificacoes();
            renderizarTudo();
        }
    }

    // Aumentar Quantidade
    else if (increaseBtn) {
        const index = parseInt(increaseBtn.dataset.index, 10);
        produtos[index].quantidade++;
        checarEstoqueEAtualizarNotificacoes();
        renderizarTudo();
    }

    // Abrir Modal de Edição
    else if (editBtn) {
        const index = parseInt(editBtn.dataset.index, 10);
        const produto = produtos[index];
        editIndexInput.value = index;
        editNomeInput.value = produto.nome;
        editQuantidadeInput.value = produto.quantidade;
        editMinQuantidadeInput.value = produto.minQuantidade;
        openModal(editModalOverlay);
    }
  });


  // Salvar Edição
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
      e.stopPropagation();
      notificationsTab.classList.toggle('hidden');
  });

  clearNotificationsBtn.addEventListener('click', () => {
      notifications = [];
      salvarDados();
      renderizarNotificacoes();
  });
  
  document.addEventListener('click', (e) => {
      if (!notificationsTab.classList.contains('hidden') && !notificationsTab.contains(e.target) && !notificationsBtn.contains(e.target)) {
          notificationsTab.classList.add('hidden');
      }
  });

  // Outros
  filtroInput.addEventListener('input', renderizarLista);
  logoutBtn.addEventListener('click', logout);

  // --- INICIALIZAÇÃO ---
  document.addEventListener('DOMContentLoaded', renderizarTudo);
}