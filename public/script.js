// Garante que o código só rode na página de estoque
if (document.body.id === 'page-estoque' || location.pathname.includes('estoque.html')) {
  // --- VERIFICAÇÃO DE LOGIN (MANTIDA) ---
  if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'index.html';
  }

  // --- ELEMENTOS DO DOM (MANTIDOS) ---
  const filtroInput = document.getElementById('filtro');
  const listaProdutos = document.getElementById('lista-produtos');
  const logoutBtn = document.getElementById('logout-btn');

  // --- MODAIS (MANTIDOS) ---
  const openAddModalBtn = document.getElementById('open-add-modal-btn');
  const addModalOverlay = document.getElementById('add-modal-overlay');
  const addForm = document.getElementById('add-form');
  const addNomeInput = document.getElementById('add-nome');
  const addQuantidadeInput = document.getElementById('add-quantidade');
  const addMinQuantidadeInput = document.getElementById('add-min-quantidade');
  const cancelAddBtn = document.getElementById('cancel-add-btn');

  const editModalOverlay = document.getElementById('edit-modal-overlay');
  const editForm = document.getElementById('edit-form');
  const editIdInput = document.getElementById('edit-id'); // ALTERADO: de 'edit-index' para 'edit-id'
  const editNomeInput = document.getElementById('edit-nome');
  const editQuantidadeInput = document.getElementById('edit-quantidade');
  const editMinQuantidadeInput = document.getElementById('edit-min-quantidade');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const deleteBtn = document.getElementById('delete-btn');
  
  // --- NOTIFICAÇÕES (LÓGICA ALTERADA) ---
  const notificationsBtn = document.getElementById('notifications-btn');
  const notificationsTab = document.getElementById('notifications-tab');
  const notificationsList = document.getElementById('notifications-list');
  const notificationsBadge = document.getElementById('notifications-badge');
  const clearNotificationsBtn = document.getElementById('clear-notifications-btn');

  // --- ESTADO DA APLICAÇÃO ---
  let produtos = []; // Agora começa vazio e é preenchido pela API
  let notifications = []; // As notificações agora são geradas a partir dos dados da API

  // --- FUNÇÕES ---

  // NOVO PADRÃO: Em vez de salvar no localStorage, qualquer alteração chama a API
  // e depois recarrega os dados do servidor para garantir que a tela esteja sempre atualizada.

  function renderizarNotificacoes() {
    notifications = []; // Limpa para reavaliar
    produtos.forEach(produto => {
      if (produto.quantidade < produto.min_quantidade) {
        const notificationText = `<strong>${produto.nome}</strong> está com estoque baixo! (${produto.quantidade} de ${produto.min_quantidade})`;
        notifications.push(notificationText);
      }
    });

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
      const li = document.createElement('li');
      if (produto.quantidade < produto.min_quantidade) {
          li.classList.add('low-stock');
      }
      
      // ALTERADO: os botões agora usam o 'produto.id' do banco de dados
      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${produto.nome}</span>
          <span class="product-quantity">${produto.quantidade} unidades (Mín: ${produto.min_quantidade})</span>
        </div>
        <div class="actions">
          <button class="btn-action btn-quantity-decrease" title="Diminuir" data-id="${produto.id}"><i class="fas fa-minus"></i></button>
          <button class="btn-action btn-quantity-increase" title="Aumentar" data-id="${produto.id}"><i class="fas fa-plus"></i></button>
          <button class="btn-action btn-edit" title="Editar Item" data-id="${produto.id}"><i class="fas fa-pencil-alt"></i></button>
        </div>
      `;
      listaProdutos.appendChild(li);
    });
    renderizarNotificacoes(); // Atualiza as notificações com base na lista renderizada
  }

  // MUDANÇA PRINCIPAL 1: Função para carregar os dados da API
  async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        if (!response.ok) throw new Error('Falha ao buscar dados');
        produtos = await response.json(); // Preenche o array de produtos com os dados do banco
        renderizarLista();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        alert('Não foi possível conectar ao servidor.');
    }
  }
  
  // --- FUNÇÕES DE MODAL (MANTIDAS) ---
  const openModal = (overlay) => overlay.classList.remove('hidden');
  const closeModal = (overlay) => {
    overlay.classList.add('hidden');
    // Limpa os formulários ao fechar
    addForm.reset();
    editForm.reset();
  }

  function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  }

  // --- EVENT LISTENERS ---

  // MUDANÇA PRINCIPAL 2: Adicionar Produto agora chama a API
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const novoProduto = {
      nome: addNomeInput.value.trim(),
      quantidade: parseInt(addQuantidadeInput.value, 10),
      minQuantidade: parseInt(addMinQuantidadeInput.value, 10)
    };

    if (novoProduto.nome && !isNaN(novoProduto.quantidade) && !isNaN(novoProduto.minQuantidade) && novoProduto.minQuantidade > 0) {
      try {
        const response = await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoProduto)
        });
        if (!response.ok) throw new Error('Falha ao adicionar produto');
        
        await carregarProdutos(); // Recarrega a lista do servidor
        closeModal(addModalOverlay);
      } catch (error) {
        console.error("Erro:", error);
        alert("Não foi possível adicionar o produto.");
      }
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
  });

  // MUDANÇA PRINCIPAL 3: Ações na lista (aumentar, diminuir, editar)
  listaProdutos.addEventListener('click', async (e) => {
    const targetButton = e.target.closest('.btn-action');
    if (!targetButton) return;

    const id = targetButton.dataset.id;
    const produto = produtos.find(p => p.id == id);
    if (!produto) return;

    // Aumentar/Diminuir Quantidade
    if (targetButton.classList.contains('btn-quantity-decrease') || targetButton.classList.contains('btn-quantity-increase')) {
      const novaQuantidade = targetButton.classList.contains('btn-quantity-increase') 
        ? produto.quantidade + 1 
        : Math.max(0, produto.quantidade - 1);

      try {
          const response = await fetch(`/api/produtos?id=${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...produto, quantidade: novaQuantidade }) // Envia o produto inteiro atualizado
          });
          if (!response.ok) throw new Error('Falha ao atualizar quantidade');
          await carregarProdutos(); // Recarrega a lista
      } catch (error) {
          console.error("Erro:", error);
          alert("Não foi possível atualizar a quantidade.");
      }
    }
    
    // Abrir Modal de Edição
    else if (targetButton.classList.contains('btn-edit')) {
        editIdInput.value = produto.id;
        editNomeInput.value = produto.nome;
        editQuantidadeInput.value = produto.quantidade;
        editMinQuantidadeInput.value = produto.min_quantidade;
        openModal(editModalOverlay);
    }
  });


  // MUDANÇA PRINCIPAL 4: Salvar Edição
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editIdInput.value;
    const produtoAtualizado = {
        nome: editNomeInput.value.trim(),
        quantidade: parseInt(editQuantidadeInput.value, 10),
        min_quantidade: parseInt(editMinQuantidadeInput.value, 10)
    };

    if (produtoAtualizado.nome && !isNaN(produtoAtualizado.quantidade) && !isNaN(produtoAtualizado.min_quantidade)) {
        try {
            const response = await fetch(`/api/produtos?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoAtualizado)
            });
            if (!response.ok) throw new Error('Falha ao salvar alterações');

            await carregarProdutos();
            closeModal(editModalOverlay);
        } catch (error) {
            console.error("Erro:", error);
            alert("Não foi possível salvar as alterações.");
        }
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
  });
  
  // MUDANÇA PRINCIPAL 5: Deletar Item
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      const id = editIdInput.value;
      try {
        const response = await fetch(`/api/produtos?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Falha ao excluir produto');
        
        await carregarProdutos();
        closeModal(editModalOverlay);
      } catch (error) {
        console.error("Erro:", error);
        alert("Não foi possível excluir o produto.");
      }
    }
  });

  // --- OUTROS LISTENERS (SEM MUDANÇAS DRÁSTICAS) ---
  openAddModalBtn.addEventListener('click', () => openModal(addModalOverlay));
  cancelAddBtn.addEventListener('click', () => closeModal(addModalOverlay));
  addModalOverlay.addEventListener('click', (e) => {
      if(e.target === addModalOverlay) closeModal(addModalOverlay);
  });
  
  cancelEditBtn.addEventListener('click', () => closeModal(editModalOverlay));
  editModalOverlay.addEventListener('click', (e) => {
    if(e.target === editModalOverlay) closeModal(editModalOverlay);
  });

  notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationsTab.classList.toggle('hidden');
  });

  clearNotificationsBtn.addEventListener('click', () => {
      notifications = [];
      renderizarNotificacoes();
      // Nota: Esta ação é apenas visual no frontend agora.
  });
  
  document.addEventListener('click', (e) => {
      if (!notificationsTab.classList.contains('hidden') && !notificationsTab.contains(e.target) && !notificationsBtn.contains(e.target)) {
          notificationsTab.classList.add('hidden');
      }
  });

  filtroInput.addEventListener('input', renderizarLista);
  logoutBtn.addEventListener('click', logout);

  // --- INICIALIZAÇÃO ---
  // A mágica começa aqui: ao carregar a página, busca os dados da API.
  document.addEventListener('DOMContentLoaded', carregarProdutos);
}