// Verifica se está na página de estoque
if (location.pathname.includes('estoque.html')) {
  // --- AUTENTICAÇÃO ---
  const usuario = localStorage.getItem('usuarioLogado');
  if (!usuario) {
    window.location.href = 'login.html'; // Redireciona para login.html se não estiver logado
  }

  // --- ELEMENTOS DO DOM ---
  const nomeInput = document.getElementById('nome');
  const quantidadeInput = document.getElementById('quantidade');
  const listaProdutos = document.getElementById('lista-produtos');
  const filtroInput = document.getElementById('filtro');
  const formProduto = document.getElementById('form-produto');
  const logoutBtn = document.getElementById('logout-btn');

  // --- ESTADO DA APLICAÇÃO ---
  let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

  // --- FUNÇÕES ---
  function salvarProdutos() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
  }

  function renderizarLista(filtro = '') {
    listaProdutos.innerHTML = ''; // Limpa a lista antes de renderizar

    if (produtos.length === 0 && filtro === '') {
        listaProdutos.innerHTML = '<li>Nenhum produto cadastrado ainda.</li>';
        return;
    }

    const produtosFiltrados = produtos.filter(p =>
      p.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    if (produtosFiltrados.length === 0) {
        listaProdutos.innerHTML = '<li>Nenhum produto encontrado com este filtro.</li>';
        return;
    }

    produtosFiltrados.forEach((p, index) => {
      // Encontra o índice original para garantir a exclusão correta
      const originalIndex = produtos.findIndex(prod => prod === p);

      const li = document.createElement('li');

      li.innerHTML = `
        <div class="product-info">
          <span class="product-name">${p.nome}</span>
          <span class="product-quantity">${p.quantidade} unidades</span>
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

  function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html'; // Redireciona para a página de login
  }

  // --- EVENT LISTENERS ---
  formProduto.addEventListener('submit', e => {
    e.preventDefault();
    const nome = nomeInput.value.trim();
    const quantidade = parseInt(quantidadeInput.value);

    if (nome && quantidade > 0) {
      produtos.push({ nome, quantidade });
      salvarProdutos();
      renderizarLista(filtroInput.value);
      e.target.reset();
      nomeInput.focus();
    }
  });

  filtroInput.addEventListener('input', () => renderizarLista(filtroInput.value));
  
  logoutBtn.addEventListener('click', logout);

  // Delegação de eventos para os botões da lista
  listaProdutos.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const button = e.target;
      const index = parseInt(button.dataset.index);
      const action = button.dataset.action;
      
      if (!isNaN(index)) { // Garante que o índice é um número válido
          if (action === 'add') {
              produtos[index].quantidade++;
          } else if (action === 'subtract') {
              produtos[index].quantidade--;
              if (produtos[index].quantidade <= 0) {
                  produtos.splice(index, 1); // Remove se a quantidade for 0 ou menor
              }
          } else if (button.classList.contains('btn-edit')) {
              const novoNome = prompt('Digite o novo nome do produto:', produtos[index].nome);
              if (novoNome && novoNome.trim() !== '') {
                  produtos[index].nome = novoNome.trim();
              }
          }
          
          salvarProdutos();
          renderizarLista(filtroInput.value);
      }
    }
  });

  // --- INICIALIZAÇÃO ---
  renderizarLista();
}