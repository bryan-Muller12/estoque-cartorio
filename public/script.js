document.addEventListener('DOMContentLoaded', () => {
    // Garante que o código só rode na página de estoque
    if (document.body.id !== 'page-estoque') {
        // Se estiver em outra página (como index.html), verifica o login lá
        if (document.getElementById('login-form')) {
            const usuarios = [
                { email: 'brysn.ms@gmail.com', senha: 'Palmeiras.12' },
                { email: 'admin@estoque.com', senha: 'admin' }
            ];

            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;
                const erroEl = document.getElementById('login-erro');
                const usuarioValido = usuarios.find(u => u.email === email && u.senha === senha);

                if (usuarioValido) {
                    localStorage.setItem('usuarioLogado', email);
                    window.location.href = 'estoque.html';
                } else {
                    erroEl.textContent = 'Email ou senha incorretos.';
                    erroEl.style.display = 'block';
                }
            });
        }
        return;
    }

    // --- VERIFICAÇÃO DE LOGIN ---
    if (!localStorage.getItem('usuarioLogado')) {
        window.location.href = 'index.html';
    }

    // --- ELEMENTOS DO DOM ---
    const filtroInput = document.getElementById('filtro');
    const sortSelect = document.getElementById('sort-select');
    const listaProdutos = document.getElementById('lista-produtos');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingState = document.getElementById('loading-state');
    
    // --- Dashboard
    const totalItensValor = document.getElementById('total-itens-valor');
    const baixoEstoqueValor = document.getElementById('baixo-estoque-valor');
    const totalUnidadesValor = document.getElementById('total-unidades-valor');

    // --- Modais
    const openAddModalBtn = document.getElementById('open-add-modal-btn');
    const addModalOverlay = document.getElementById('add-modal-overlay');
    const addForm = document.getElementById('add-form');
    const addNomeInput = document.getElementById('add-nome');
    const addQuantidadeInput = document.getElementById('add-quantidade');
    const addMinQuantidadeInput = document.getElementById('add-min-quantidade');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const addSubmitBtn = addForm.querySelector('button[type="submit"]');

    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editForm = document.getElementById('edit-form');
    const editIdInput = document.getElementById('edit-id');
    const editNomeInput = document.getElementById('edit-nome');
    const editQuantidadeInput = document.getElementById('edit-quantidade');
    const editMinQuantidadeInput = document.getElementById('edit-min-quantidade');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const editSubmitBtn = editForm.querySelector('button[type="submit"]');
    
    // --- Notificações
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsTab = document.getElementById('notifications-tab');
    const notificationsList = document.getElementById('notifications-list');
    const notificationsBadge = document.getElementById('notifications-badge');
    const clearNotificationsBtn = document.getElementById('clear-notifications-btn');

    // --- Gráfico
    const chartCanvas = document.getElementById('estoque-chart');
    let estoqueChart = null;

    // --- ESTADO DA APLICAÇÃO ---
    let produtos = [];

    // --- FUNÇÕES ---

    function showToast(message, type = 'success') {
        const colors = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            info: 'linear-gradient(to right, #007bff, #00a1ff)'
        };
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: colors[type] || colors.info,
            },
        }).showToast();
    }

    function toggleLoadingButton(btn, isLoading, originalText) {
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${originalText.replace('Adicionar', 'Adicionando').replace('Salvar', 'Salvando')}...`;
        } else {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    function renderizarDashboard() {
        const totalUnidades = produtos.reduce((acc, p) => acc + p.quantidade, 0);
        const itensBaixoEstoque = produtos.filter(p => p.quantidade < p.min_quantidade).length;
        
        totalItensValor.textContent = produtos.length;
        baixoEstoqueValor.textContent = itensBaixoEstoque;
        totalUnidadesValor.textContent = totalUnidades;
    }

    function renderizarGrafico() {
        if (estoqueChart) {
            estoqueChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        const produtosParaGrafico = [...produtos].sort((a,b) => b.quantidade - a.quantidade).slice(0, 10); // Top 10

        estoqueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: produtosParaGrafico.map(p => p.nome),
                datasets: [{
                    label: 'Quantidade em Estoque',
                    data: produtosParaGrafico.map(p => p.quantidade),
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }, {
                    type: 'line',
                    label: 'Estoque Mínimo',
                    data: produtosParaGrafico.map(p => p.min_quantidade),
                    borderColor: 'rgba(249, 115, 22, 1)',
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function renderizarNotificacoes() {
        const notifications = produtos
            .filter(produto => produto.quantidade < produto.min_quantidade)
            .map(produto => `<strong>${produto.nome}</strong> está com estoque baixo! (${produto.quantidade} de ${produto.min_quantidade})`);

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
        const sortValue = sortSelect.value;

        let produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(filtro));
        
        // Ordenação
        switch(sortValue) {
            case 'nome-asc':
                produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
                break;
            case 'nome-desc':
                produtosFiltrados.sort((a, b) => b.nome.localeCompare(a.nome));
                break;
            case 'qtd-asc':
                produtosFiltrados.sort((a, b) => a.quantidade - b.quantidade);
                break;
            case 'qtd-desc':
                produtosFiltrados.sort((a, b) => b.quantidade - a.quantidade);
                break;
        }

        if (produtosFiltrados.length === 0) {
            listaProdutos.innerHTML = `<li style="justify-content: center; color: var(--text-light-color);">${filtro ? 'Nenhum produto encontrado.' : 'Seu estoque está vazio.'}</li>`;
            loadingState.classList.add('hidden');
            return;
        }

        produtosFiltrados.forEach((produto) => {
            const li = document.createElement('li');
            if (produto.quantidade < produto.min_quantidade) {
                li.classList.add('low-stock');
            }
            
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
        
        loadingState.classList.add('hidden');
        renderizarDashboard();
        renderizarNotificacoes();
        renderizarGrafico();
    }

    async function carregarProdutos() {
        loadingState.classList.remove('hidden');
        listaProdutos.innerHTML = '';
        try {
            const response = await fetch('/api/produtos');
            if (!response.ok) throw new Error('Falha ao buscar dados');
            produtos = await response.json();
            renderizarLista();
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            showToast('Não foi possível conectar ao servidor.', 'error');
            loadingState.textContent = 'Falha ao carregar produtos.';
        }
    }
  
    const openModal = (overlay) => overlay.classList.remove('hidden');
    const closeModal = (overlay) => {
        overlay.classList.add('hidden');
        addForm.reset();
        editForm.reset();
    }

    function logout() {
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    }

    // --- EVENT LISTENERS ---

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = addSubmitBtn.innerHTML;
        toggleLoadingButton(addSubmitBtn, true, 'Adicionar');

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
                
                await carregarProdutos();
                closeModal(addModalOverlay);
                showToast('Produto adicionado com sucesso!');
            } catch (error) {
                console.error("Erro:", error);
                showToast('Não foi possível adicionar o produto.', 'error');
            } finally {
                toggleLoadingButton(addSubmitBtn, false, originalBtnText);
            }
        } else {
            showToast('Por favor, preencha todos os campos corretamente.', 'error');
            toggleLoadingButton(addSubmitBtn, false, originalBtnText);
        }
    });

    listaProdutos.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('.btn-action');
        if (!targetButton) return;

        const id = targetButton.dataset.id;
        const produto = produtos.find(p => p.id == id);
        if (!produto) return;

        if (targetButton.classList.contains('btn-quantity-decrease') || targetButton.classList.contains('btn-quantity-increase')) {
            const novaQuantidade = targetButton.classList.contains('btn-quantity-increase') 
                ? produto.quantidade + 1 
                : Math.max(0, produto.quantidade - 1);
            
            try {
                const response = await fetch(`/api/produtos?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...produto, quantidade: novaQuantidade })
                });
                if (!response.ok) throw new Error('Falha ao atualizar quantidade');
                await carregarProdutos();
            } catch (error) {
                console.error("Erro:", error);
                showToast("Não foi possível atualizar a quantidade.", 'error');
            }
        }
        else if (targetButton.classList.contains('btn-edit')) {
            editIdInput.value = produto.id;
            editNomeInput.value = produto.nome;
            editQuantidadeInput.value = produto.quantidade;
            editMinQuantidadeInput.value = produto.min_quantidade;
            openModal(editModalOverlay);
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = editSubmitBtn.innerHTML;
        toggleLoadingButton(editSubmitBtn, true, 'Salvar');

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
                showToast('Produto atualizado com sucesso!');
            } catch (error) {
                console.error("Erro:", error);
                showToast("Não foi possível salvar as alterações.", 'error');
            } finally {
                toggleLoadingButton(editSubmitBtn, false, originalBtnText);
            }
        } else {
            showToast('Por favor, preencha todos os campos corretamente.', 'error');
            toggleLoadingButton(editSubmitBtn, false, originalBtnText);
        }
    });
  
    deleteBtn.addEventListener('click', async () => {
        // Usar um modal customizado no futuro, por enquanto confirm funciona.
        if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
            const id = editIdInput.value;
            try {
                const response = await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Falha ao excluir produto');
                
                await carregarProdutos();
                closeModal(editModalOverlay);
                showToast('Produto excluído.', 'info');
            } catch (error) {
                console.error("Erro:", error);
                showToast("Não foi possível excluir o produto.", 'error');
            }
        }
    });

    openAddModalBtn.addEventListener('click', () => openModal(addModalOverlay));
    cancelAddBtn.addEventListener('click', () => closeModal(addModalOverlay));
    addModalOverlay.addEventListener('click', (e) => e.target === addModalOverlay && closeModal(addModalOverlay));
    
    cancelEditBtn.addEventListener('click', () => closeModal(editModalOverlay));
    editModalOverlay.addEventListener('click', (e) => e.target === editModalOverlay && closeModal(editModalOverlay));

    notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsTab.classList.toggle('hidden');
    });

    clearNotificationsBtn.addEventListener('click', () => {
        notificationsTab.classList.add('hidden');
    });
  
    document.addEventListener('click', (e) => {
        if (!notificationsTab.classList.contains('hidden') && !notificationsTab.contains(e.target) && !notificationsBtn.contains(e.target)) {
            notificationsTab.classList.add('hidden');
        }
    });

    filtroInput.addEventListener('input', renderizarLista);
    sortSelect.addEventListener('change', renderizarLista);
    logoutBtn.addEventListener('click', logout);

    // --- INICIALIZAÇÃO ---
    carregarProdutos();
});