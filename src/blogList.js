/**
 * Lista de Posts do Blog - Soluções UFV
 * Página de listagem com paginação e filtros
 */

import './style.css';
import { getEntries } from './contentfulClient.js';
import './whatsappWidget.js';
import './menu.js';
import { escapeHTML } from './utils.js';

const POSTS_PER_PAGE = 6;
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
let categories = new Set();

// Inicialização
async function init() {
  // Buscar posts do Contentful
  allPosts = await getEntries('blogPost');
  
  // Extrair categorias únicas
  allPosts.forEach(post => {
    if (post.fields.categoria) {
      categories.add(post.fields.categoria);
    }
  });
  
  // Inicializar filteredPosts
  filteredPosts = [...allPosts];
  
  // Renderizar filtros de categoria
  renderCategoryOptions();
  
  // Configurar event listeners dos filtros
  setupFilters();
  
  // Renderizar posts da primeira página
  renderPosts();
  renderPagination();
}

/**
 * Renderiza as opções de categoria no select
 */
function renderCategoryOptions() {
  const categorySelect = document.getElementById('filter-category');
  if (!categorySelect) return;
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

/**
 * Configura os event listeners dos filtros
 */
function setupFilters() {
  const searchInput = document.getElementById('filter-search');
  const categorySelect = document.getElementById('filter-category');
  const materialCheckbox = document.getElementById('filter-material');
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  if (categorySelect) {
    categorySelect.addEventListener('change', applyFilters);
  }
  
  if (materialCheckbox) {
    materialCheckbox.addEventListener('change', applyFilters);
  }
}

/**
 * Aplica os filtros selecionados
 */
function applyFilters() {
  const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('filter-category')?.value || '';
  const materialOnly = document.getElementById('filter-material')?.checked || false;
  
  filteredPosts = allPosts.filter(post => {
    const { fields } = post;
    const titulo = (fields.titulo || '').toLowerCase();
    const categoria = fields.categoria || '';
    const hasMaterial = !!fields.materialGratuito?.fields?.file?.url;
    
    // Filtro de busca por nome (case insensitive)
    if (searchTerm && !titulo.includes(searchTerm)) {
      return false;
    }
    
    // Filtro de categoria
    if (categoryFilter && categoria !== categoryFilter) {
      return false;
    }
    
    // Filtro de material gratuito
    if (materialOnly && !hasMaterial) {
      return false;
    }
    
    return true;
  });
  
  // Resetar para primeira página ao filtrar
  currentPage = 1;
  renderPosts();
  renderPagination();
}

/**
 * Renderiza os posts da página atual
 */
function renderPosts() {
  const blogListGrid = document.getElementById('blog-list-grid');
  
  if (!blogListGrid) {
    console.error('Elemento #blog-list-grid não encontrado');
    return;
  }
  
  // Limpar conteúdo
  blogListGrid.innerHTML = '';
  
  if (filteredPosts.length === 0) {
    blogListGrid.innerHTML = '<p class="no-posts">Nenhum post encontrado.</p>';
    return;
  }
  
  // Calcular posts da página atual
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(startIndex, endIndex);
  
  // Criar cards para cada post
  pagePosts.forEach(post => {
    const { fields, sys } = post;
    
    // Campos do Contentful
    const titulo = fields.titulo || 'Sem título';
    const capa = fields.capa?.fields?.file?.url || null;
    const dataPublicacao = fields.dataPublicacao ? new Date(fields.dataPublicacao).toLocaleDateString('pt-BR') : '';
    const categoria = fields.categoria || '';
    const autores = fields.autores || 'Soluções UFV';
    const materialGratuito = fields.materialGratuito?.fields?.file?.url || null;
    
    // Extrair texto do corpo (rich text)
    let resumo = '';
    if (fields.corpo?.content?.[0]?.content?.[0]?.value) {
      resumo = fields.corpo.content[0].content[0].value;
      // Limitar a 150 caracteres
      if (resumo.length > 150) {
        resumo = resumo.substring(0, 150) + '...';
      }
    }
    
    // Criar o card como link
    const card = document.createElement('a');
    card.className = 'blog-list-card';
    card.href = `/post.html?id=${sys.id}`;
    
    card.innerHTML = `
      <div class="blog-list-image" ${capa ? `style="background-image: url('https:${escapeHTML(capa)}');"` : ''}></div>
      <div class="blog-list-content">
        ${categoria ? `<span class="blog-category">${escapeHTML(categoria)}</span>` : ''}
        <h3>${escapeHTML(titulo)}</h3>
        ${resumo ? `<p>${escapeHTML(resumo)}</p>` : ''}
        <div class="blog-meta">
          <span class="blog-author">${escapeHTML(autores)}</span>
          ${dataPublicacao ? `<span class="blog-date">${escapeHTML(dataPublicacao)}</span>` : ''}
          ${materialGratuito ? `<span class="material-gratuito-badge">Material Gratuito</span>` : ''}
        </div>
      </div>
    `;
    
    blogListGrid.appendChild(card);
  });
  
  // Scroll para o topo da lista
  if (currentPage > 1) {
    document.querySelector('.blog-list-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Renderiza os botões de paginação
 */
function renderPagination() {
  const paginationContainer = document.getElementById('pagination');
  
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Botão anterior
  if (currentPage > 1) {
    html += `<button class="pagination-btn" data-page="${currentPage - 1}">← Anterior</button>`;
  }
  
  // Números das páginas
  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    html += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
  }
  
  // Botão próximo
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" data-page="${currentPage + 1}">Próximo →</button>`;
  }
  
  paginationContainer.innerHTML = html;
  
  // Adicionar event listeners
  paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPosts();
      renderPagination();
    });
  });
}

// Executar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
