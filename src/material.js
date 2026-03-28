/**
 * Página de Material Gratuito
 * Soluções UFV - Engenharia de Produção
 * 
 * Este arquivo gerencia o formulário de captura de leads para download de materiais.
 * 
 * INTEGRAÇÃO COM SERVIÇOS DE FORMULÁRIO
 * =====================================
 * 
 * Para integrar com Web3Forms ou Formspree, você pode:
 * 
 * OPÇÃO 1: Envio via JavaScript (recomendado para manter UX atual)
 * ----------------------------------------------------------------
 * Descomente a seção de envio no handleSubmit() e configure:
 * - Web3Forms: endpoint = 'https://api.web3forms.com/submit'
 * - Formspree: endpoint = 'https://formspree.io/f/SEU_FORM_ID'
 * 
 * OPÇÃO 2: Envio nativo do formulário
 * -----------------------------------
 * Adicione action="" ao form no HTML e remova o preventDefault().
 * Configure redirect para voltar à página de sucesso.
 * 
 */

import './style.css';
import './whatsappWidget.js';
import './menu.js';

function safeDecodeURIComponent(value) {
  if (typeof value !== 'string') return '';

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getAllowedDownloadUrl(rawUrl) {
  const decodedUrl = safeDecodeURIComponent(rawUrl).trim();
  if (!decodedUrl) return '#';

  try {
    const parsedUrl = new URL(decodedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isHttps = parsedUrl.protocol === 'https:';
    const isAllowedHost = hostname === 'ctfassets.net' || hostname.endsWith('.ctfassets.net');

    if (isHttps && isAllowedHost) {
      return parsedUrl.toString();
    }
  } catch {
    return '#';
  }

  return '#';
}

// Pegar parâmetros da URL
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    fileUrl: params.get('file'),
    fileName: params.get('name'),
    postTitle: params.get('post')
  };
}

// Inicialização
function init() {
  const { fileUrl, fileName, postTitle } = getUrlParams();
  const decodedPostTitle = safeDecodeURIComponent(postTitle);
  const decodedFileName = safeDecodeURIComponent(fileName);
  
  // Verificar se tem arquivo para download
  if (!fileUrl) {
    document.getElementById('material-title').textContent = 
      'Nenhum material encontrado. Volte ao blog e selecione um post com material gratuito.';
    document.getElementById('material-form').style.display = 'none';
    return;
  }
  
  // Mostrar título do material se disponível
  if (postTitle) {
    document.getElementById('material-title').textContent = 
      `Material do post: "${decodedPostTitle}"`;
    document.title = `${decodedPostTitle} - Material Gratuito`;
  }
  
  // Preencher campo oculto com info do material
  document.getElementById('material-info').value = postTitle ? decodedPostTitle : decodedFileName;
  
  // Configurar formulário
  setupForm(fileUrl, fileName);
}

// Configurar submit do formulário
function setupForm(fileUrl, fileName) {
  const form = document.getElementById('material-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificações Básicas extras
    const emailInput = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(emailInput)) {
      alert("Por favor, insira um e-mail válido com @ e domínio.");
      return;
    }

    const telInput = document.getElementById('telefone').value;
    if(telInput) {
       // Remove tudo que nao for numero para contar a quantidade
       const justNumbers = telInput.replace(/\D/g, '');
       if(justNumbers.length < 10 || justNumbers.length > 11) {
          alert("Por favor, insira um telefone válido com DDD. Ex: (31) 90000-0000.");
          return;
       }
    }
    
    // Pegar dados do formulário
    const formData = new FormData(form);
    
    // Web3Forms: Proteção Customizada Honeypot + Validação
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {      
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Erro ao enviar formulário');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar. Tente novamente.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }
    
    // Mostrar tela de sucesso
    showSuccess(fileUrl, fileName);
  });
}

// Mostrar estado de sucesso com link de download
function showSuccess(fileUrl, fileName) {
  // Esconder formulário
  document.getElementById('form-container').style.display = 'none';
  
  // Mostrar sucesso
  const successContainer = document.getElementById('success-container');
  successContainer.style.display = 'block';
  
  // Configurar link de download
  const downloadLink = document.getElementById('download-link');
  const safeUrl = getAllowedDownloadUrl(fileUrl);
  downloadLink.href = safeUrl;
  downloadLink.setAttribute('download', safeDecodeURIComponent(fileName));

  if (safeUrl === '#') {
    downloadLink.textContent = 'DOWNLOAD BLOQUEADO (LINK INVÁLIDO)';
    downloadLink.setAttribute('aria-disabled', 'true');
  }
  
  // Scroll para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Executar
document.addEventListener('DOMContentLoaded', init);
