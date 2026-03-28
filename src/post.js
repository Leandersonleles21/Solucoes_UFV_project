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
function sanitizeUrl(url) {
  if (typeof url !== 'string') return '#';

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '#';

  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#')) {
    return trimmedUrl;
  }

  try {
    const parsed = new URL(trimmedUrl, 'https://example.com');
    const protocol = parsed.protocol.toLowerCase();

    if (['http:', 'https:', 'mailto:', 'tel:'].includes(protocol)) {
      return trimmedUrl;
    }
  } catch {
    return '#';
  }

  return '#';
}

function applyTextMarks(text, marks = []) {
  return marks.reduce((result, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${result}</strong>`;
      case 'italic':
        return `<em>${result}</em>`;
      case 'underline':
        return `<u>${result}</u>`;
      case 'code':
        return `<code>${result}</code>`;
      default:
        return result;
    }
  }, text);
}

function renderInlineNode(node) {
  if (!node) return '';

  switch (node.nodeType) {
    case 'text': {
      const text = escapeHTML(node.value || '');
      return applyTextMarks(text, node.marks || []);
    }
    case 'hyperlink': {
      const href = sanitizeUrl(node.data?.uri || '#');
      const label = renderInlineNodes(node.content || []);
      const linkText = label || escapeHTML(href);
      return `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    }
    case 'asset-hyperlink': {
      const fileUrl = node.data?.target?.fields?.file?.url || '#';
      const href = sanitizeUrl(fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl);
      const label = renderInlineNodes(node.content || []);
      const linkText = label || 'Arquivo';
      return `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    }
    case 'entry-hyperlink': {
      const label = renderInlineNodes(node.content || []);
      return label || '';
    }
    default:
      return renderInlineNodes(node.content || []);
  }
}

function renderInlineNodes(nodes = []) {
  return nodes.map(renderInlineNode).join('');
}

function renderListItem(itemNode) {
  if (!itemNode?.content) return '';

  const itemHtml = itemNode.content.map(child => {
    if (child.nodeType === 'paragraph') {
      return renderInlineNodes(child.content || []);
    }

    return renderBlockNode(child);
  }).join('');

  return `<li>${itemHtml}</li>`;
}

function renderBlockNode(node) {
  if (!node) return '';

  switch (node.nodeType) {
    case 'paragraph': {
      const content = renderInlineNodes(node.content || []);
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      return plainText ? `<p>${content}</p>` : '';
    }
    case 'heading-1':
      return `<h1>${renderInlineNodes(node.content || [])}</h1>`;
    case 'heading-2':
      return `<h2>${renderInlineNodes(node.content || [])}</h2>`;
    case 'heading-3':
      return `<h3>${renderInlineNodes(node.content || [])}</h3>`;
    case 'heading-4':
      return `<h4>${renderInlineNodes(node.content || [])}</h4>`;
    case 'unordered-list': {
      const items = (node.content || []).map(renderListItem).join('');
      return `<ul>${items}</ul>`;
    }
    case 'ordered-list': {
      const items = (node.content || []).map(renderListItem).join('');
      return `<ol>${items}</ol>`;
    }
    case 'blockquote': {
      const quote = (node.content || []).map(child => {
        if (child.nodeType === 'paragraph') {
          return renderInlineNodes(child.content || []);
        }
        return renderInlineNodes(child.content || []);
      }).join('<br>');

      return quote.trim() ? `<blockquote>${quote}</blockquote>` : '';
    }
    case 'hr':
      return '<hr>';
    case 'embedded-asset-block': {
      const assetFields = node.data?.target?.fields;
      const fileUrl = assetFields?.file?.url;
      const title = assetFields?.title || '';
      const description = assetFields?.description || '';

      if (!fileUrl) return '';

      const imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
      const safeImageUrl = sanitizeUrl(imageUrl);
      const altText = escapeHTML(description || title || 'Imagem do post');
      const caption = escapeHTML(title || description || '');

      return `
        <figure class="post-inline-image">
          <img src="${escapeHTML(safeImageUrl)}" alt="${altText}" loading="lazy" decoding="async">
          ${caption ? `<figcaption>${caption}</figcaption>` : ''}
        </figure>
      `;
    }
    default:
      return '';
  }
}

function renderRichText(richText) {
  if (!richText || !richText.content) return '';

  return richText.content.map(renderBlockNode).join('');
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
