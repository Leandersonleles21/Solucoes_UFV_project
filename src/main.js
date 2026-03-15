/**
 * Arquivo principal da aplicação
 * Soluções UFV - Engenharia de Produção
 */

import './style.css';
import { getEntries } from './contentfulClient.js';
import './whatsappWidget.js';
import { escapeHTML } from './utils.js';

// Inicialização da aplicação
async function init() {
  console.log('🚀 Aplicação Soluções UFV iniciada');
  
  // Buscar posts do Contentful
  const posts = await getEntries('blogPost');
  console.log('Posts do Contentful:', posts);
  
  // Renderizar posts no blog
  renderBlogPosts(posts);
}

/**
 * Renderiza os posts do blog na página (carrossel na home)
 * @param {Array} posts - Array de posts do Contentful
 */
function renderBlogPosts(posts) {
  const blogTrack = document.getElementById('blog-track');
  
  if (!blogTrack) {
    console.error('Elemento #blog-track não encontrado');
    return;
  }
  
  // Limpar conteúdo de loading
  blogTrack.innerHTML = '';
  
  if (posts.length === 0) {
    blogTrack.innerHTML = '<p>Nenhum post encontrado.</p>';
    return;
  }
  
  // Criar cards para cada post (duplicar para loop infinito)
  const allPosts = [...posts, ...posts]; // Duplicar para carrossel infinito
  
  allPosts.forEach(post => {
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
      // Limitar a 100 caracteres
      if (resumo.length > 100) {
        resumo = resumo.substring(0, 100) + '...';
      }
    }
    
    // Criar o card como link
    const card = document.createElement('a');
    card.className = 'blog-card';
    card.href = `/post.html?id=${sys.id}`;
    
    card.innerHTML = `
      <div class="blog-image" ${capa ? `style="background-image: url('https:${escapeHTML(capa)}');"` : ''}></div>
      <div class="blog-content">
        ${categoria ? `<span class="blog-category">${escapeHTML(categoria)}</span>` : ''}
        <h4>${escapeHTML(titulo)}</h4>
        ${resumo ? `<p>${escapeHTML(resumo)}</p>` : ''}
        <div class="blog-meta">
          <span class="blog-author">${escapeHTML(autores)}</span>
          ${dataPublicacao ? `<span class="blog-date">${escapeHTML(dataPublicacao)}</span>` : ''}
          ${materialGratuito ? `<span class="material-gratuito-badge">Material Gratuito</span>` : ''}
        </div>
      </div>
    `;
    
    blogTrack.appendChild(card);
  });
  
  console.log('✅ Posts renderizados com sucesso!');
}

// Navegação suave para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
