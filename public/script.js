// Garante que o código só rode na página de estoque
if (location.pathname.includes('estoque.html')) {
  // --- VERIFICAÇÃO DE LOGIN ---
  // Se não encontrar 'usuarioLogado' no localStorage, volta para a página de login
  if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'index.html'; // ou login.html, dependendo do nome do seu arquivo
  }

  // --- ELEMENTOS DO DOM ---
  const nomeInput = document.getElementById('nome');
  const quantidadeInput = document.getElementById('quantidade');
  const formProduto = document.getElementById('form-produto');
  const filtroInput = document.getElementById('filtro');
  const listaProdutos = document.getElementById('lista-produtos');
  const logoutBtn = document.getElementById('logout-btn');

  // --- ESTADO DA APLICAÇÃO (lido do localStorage) ---
  let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

  // --- FUNÇÕES PRINCIPAIS ---

  // Função para salvar o array de produtos no localStorage
  function salvarProdutos() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
  }

  // Função para renderizar a lista de produtos na tela
  function renderizarLista(filtro = '') {
    listaProdutos.innerHTML = ''; // Limpa a lista atual

    const produtosFiltrados = produtos.filter(p =>
      p.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    if (produtosFiltrados.length === 0) {
      listaProdutos.innerHTML = '<li>Nenhum produto encontrado.</li>';
      return;
    }

    produtosFiltrados.forEach((produto, index) => {
      // Encontra o índice original do produto para garantir que estamos editando/removendo o item certo
      const originalIndex = produtos.findIndex(p => p.nome === produto.nome && p.quantidade === produto.quantidade);

      const li = document.createElement('li');
      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${produto.nome}</span>
          <span class="product-quantity">${produto.quantidade} unidades</span>
        </div>
        <div class="actions">
          <button class="btn btn-action btn-edit" data-index="${originalIndex}">Editar</button>
          <button class="btn btn-action" data-index="${originalIndex}" data-action="add">+1</button>
          <button class="btn btn-action" data-index="${originalIndex}" data-action="subtract">-1</button>
        </div>
      `;
      listaProdutos.appendChild(li);
    });
  }

  // Função de logout
  function logout() {
    localStorage.removeItem('usuarioLogado'); // Limpa a sessão
    localStorage.removeItem('produtos'); // Opcional: limpa os produtos ao sair
    window.location.href = 'index.html'; // ou login.html
  }

  // --- EVENT LISTENERS ---

  // Adicionar novo produto
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

  // Filtrar a lista
  filtroInput.addEventListener('input', () => renderizarLista(filtroInput.value));

  // Botão de Logout
  logoutBtn.addEventListener('click', logout);

  // Ações nos itens da lista (Editar, +1, -1)
  listaProdutos.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return; // Se não clicou num botão, ignora

    const index = parseInt(e.target.dataset.index);
    const action = e.target.dataset.action;

    if (action === 'add') {
      produtos[index].quantidade++;
    } else if (action === 'subtract') {
      produtos[index].quantidade--;
      if (produtos[index].quantidade <= 0) {
        // Remove o produto se a quantidade for 0 ou menos
        produtos.splice(index, 1);
      }
    } else if (e.target.classList.contains('btn-edit')) {
      const novoNome = prompt('Digite o novo nome do produto:', produtos[index].nome);
      if (novoNome && novoNome.trim() !== '') {
        produtos[index].nome = novoNome.trim();
      }
    }

    salvarProdutos();
    renderizarLista(filtroInput.value);
  });

  // --- INICIALIZAÇÃO ---
  // Renderiza a lista assim que a página carrega
  renderizarLista();
}