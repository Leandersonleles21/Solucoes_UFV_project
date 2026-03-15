/**
 * Página individual do Post
 * Soluções UFV - Engenharia de Produção
 */

import './style.css';
import contentfulClient, { getEntries } from './contentfulClient.js';
import './whatsappWidget.js';
import './menu.js';
import { escapeHTML } from './utils.js';

// Pegar o ID do post da URL
function getPostIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Renderizar rich text do Contentful
function renderRichText(richText) {
  if (!richText || !richText.content) return '';
  
  let html = '';
  
  richText.content.forEach(node => {
    switch (node.nodeType) {
      case 'paragraph':
        const text = node.content?.map(c => escapeHTML(c.value) || '').join('') || '';
        if (text.trim()) {
          html += `<p>${text}</p>`;
        }
        break;
      case 'heading-1':
        html += `<h1>${node.content?.map(c => escapeHTML(c.value) || '').join('')}</h1>`;
        break;
      case 'heading-2':
        html += `<h2>${node.content?.map(c => escapeHTML(c.value) || '').join('')}</h2>`;
        break;
      case 'heading-3':
        html += `<h3>${node.content?.map(c => escapeHTML(c.value) || '').join('')}</h3>`;
        break;
      case 'heading-4':
        html += `<h4>${node.content?.map(c => escapeHTML(c.value) || '').join('')}</h4>`;
        break;
      case 'unordered-list':
        html += '<ul>';
        node.content?.forEach(item => {
          const listText = item.content?.[0]?.content?.map(c => escapeHTML(c.value) || '').join('') || '';
          html += `<li>${listText}</li>`;
        });
        html += '</ul>';
        break;
      case 'ordered-list':
        html += '<ol>';
        node.content?.forEach(item => {
          const listText = item.content?.[0]?.content?.map(c => escapeHTML(c.value) || '').join('') || '';
          html += `<li>${listText}</li>`;
        });
        html += '</ol>';
        break;
      case 'blockquote':
        const quoteText = node.content?.[0]?.content?.map(c => escapeHTML(c.value) || '').join('') || '';
        html += `<blockquote>${quoteText}</blockquote>`;
        break;
      case 'hr':
        html += '<hr>';
        break;
      default:
        break;
    }
  });
  
  return html;
}

// Carregar o post
async function loadPost() {
  const postId = getPostIdFromUrl();
  
  if (!postId) {
    document.getElementById('post-title').textContent = 'Post não encontrado';
    document.getElementById('post-body').innerHTML = '<p>ID do post não especificado.</p>';
    return;
  }
  
  try {
    const entry = await contentfulClient.getEntry(postId);
    const { fields } = entry;
    
    // Título
    document.getElementById('post-title').textContent = fields.titulo || 'Sem título';
    document.title = `${fields.titulo} - Soluções UFV`;
    
    // Categoria (se existir)
    const categoryEl = document.getElementById('post-category');
    if (fields.categoria) {
      categoryEl.textContent = fields.categoria;
    } else {
      categoryEl.style.display = 'none';
    }
    
    // Autor
    const authorEl = document.getElementById('post-author');
    if (fields.autores) {
      authorEl.textContent = `✍️ ${fields.autores}`;
    } else {
      authorEl.textContent = '✍️ Soluções UFV';
    }
    
    // Data
    if (fields.dataPublicacao) {
      const date = new Date(fields.dataPublicacao).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      document.getElementById('post-date').textContent = `📅 ${date}`;
    }
    
    // Imagem de capa
    const imageEl = document.getElementById('post-image');
    const heroEl = document.getElementById('post-hero');
    if (fields.capa?.fields?.file?.url) {
      const imageUrl = `https:${fields.capa.fields.file.url}`;
      imageEl.style.backgroundImage = `url('${imageUrl}')`;
      heroEl.style.backgroundImage = `linear-gradient(rgba(26, 54, 93, 0.8), rgba(44, 82, 130, 0.9)), url('${imageUrl}')`;
    }
    
    // Corpo do post
    const bodyEl = document.getElementById('post-body');
    if (fields.corpo) {
      bodyEl.innerHTML = renderRichText(fields.corpo);
    } else {
      bodyEl.innerHTML = '<p>Conteúdo não disponível.</p>';
    }
    
    // Material Gratuito - Link para formulário
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('download-btn');
    if (fields.materialGratuito?.fields?.file?.url) {
      const downloadUrl = `https:${fields.materialGratuito.fields.file.url}`;
      const fileName = fields.materialGratuito.fields.file.fileName || 'material.zip';
      const postTitle = encodeURIComponent(fields.titulo || 'Material');
      
      downloadSection.style.display = 'block';
      // Link para página de formulário com parâmetros
      downloadBtn.href = `/material.html?file=${encodeURIComponent(downloadUrl)}&name=${encodeURIComponent(fileName)}&post=${postTitle}`;
    }
    
    // Carregar posts relacionados
    loadRelatedPosts(postId);
    
  } catch (error) {
    console.error('Erro ao carregar post:', error);
    document.getElementById('post-title').textContent = 'Erro ao carregar post';
    document.getElementById('post-body').innerHTML = '<p>Não foi possível carregar o conteúdo.</p>';
  }
}

// Carregar posts relacionados
async function loadRelatedPosts(currentPostId) {
  const posts = await getEntries('blogPost', { limit: 4 });
  const relatedContainer = document.getElementById('related-posts');
  
  // Filtrar o post atual
  const relatedPosts = posts.filter(post => post.sys.id !== currentPostId).slice(0, 3);
  
  if (relatedPosts.length === 0) {
    relatedContainer.innerHTML = '<p>Nenhum outro post encontrado.</p>';
    return;
  }
  
  relatedContainer.innerHTML = relatedPosts.map(post => {
    const { fields, sys } = post;
    const titulo = fields.titulo || 'Sem título';
    const capa = fields.capa?.fields?.file?.url || null;
    const date = fields.dataPublicacao ? new Date(fields.dataPublicacao).toLocaleDateString('pt-BR') : '';
    
    return `
      <a href="/post.html?id=${sys.id}" class="related-post-card">
        <div class="related-post-image" ${capa ? `style="background-image: url('https:${escapeHTML(capa)}')"` : ''}></div>
        <div class="related-post-info">
          <h4>${escapeHTML(titulo)}</h4>
          <span>${escapeHTML(date)}</span>
        </div>
      </a>
    `;
  }).join('');
}

// Executar
document.addEventListener('DOMContentLoaded', loadPost);
