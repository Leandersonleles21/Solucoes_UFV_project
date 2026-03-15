const WHATSAPP_NUMBER = '5531972094074';

function formatPhoneBR(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function setupPhoneMask(form) {
  const phoneInput = form.querySelector('input[name="telefone"]');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', (event) => {
    const target = event.target;
    const formatted = formatPhoneBR(target.value);
    target.value = formatted;
    target.setCustomValidity('');
  });

  phoneInput.addEventListener('blur', () => {
    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 10) {
      phoneInput.setCustomValidity('Informe um telefone válido com DDD.');
    }
  });
}

function createWhatsappModal() {
  if (document.getElementById('whatsapp-modal-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'whatsapp-modal-overlay';
  overlay.className = 'whatsapp-modal-overlay';

  overlay.innerHTML = `
    <div class="whatsapp-modal" role="dialog" aria-modal="true" aria-labelledby="whatsapp-modal-title">
      <div class="whatsapp-modal-header">
        <h3 id="whatsapp-modal-title">Olá! Preencha os campos abaixo para iniciar a conversa no WhatsApp</h3>
        <button type="button" class="whatsapp-modal-close" aria-label="Fechar">×</button>
      </div>
      <div class="whatsapp-modal-body">
        <form id="whatsapp-form" class="whatsapp-form">
          <input type="text" name="nome" placeholder="Nome *" required>
          <input type="email" name="email" placeholder="Email *" required>
          <input type="tel" name="telefone" placeholder="Telefone *" inputmode="numeric" autocomplete="tel" required>
          <input type="text" name="mensagem" placeholder="Em que podemos te ajudar? *" required>
          <button type="submit" class="whatsapp-form-submit">Iniciar a conversa</button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('.whatsapp-modal-close');
  const form = overlay.querySelector('#whatsapp-form');

  if (form) {
    setupPhoneMask(form);
  }

  closeButton?.addEventListener('click', closeWhatsappModal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeWhatsappModal();
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nome = (formData.get('nome') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const telefone = (formData.get('telefone') || '').toString().trim();
    const mensagem = (formData.get('mensagem') || '').toString().trim();

    const phoneDigits = telefone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      const phoneInput = form.querySelector('input[name="telefone"]');
      if (phoneInput) {
        phoneInput.setCustomValidity('Informe um telefone válido com DDD.');
        phoneInput.reportValidity();
      }
      return;
    }

    const texto = [
      'Olá! Vim pelo site da Soluções UFV.',
      '',
      `Nome: ${nome}`,
      `Email: ${email}`,
      `Telefone: ${formatPhoneBR(phoneDigits)}`,
      `Mensagem: ${mensagem}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    form.reset();
    closeWhatsappModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeWhatsappModal();
    }
  });
}

function openWhatsappModal() {
  const overlay = document.getElementById('whatsapp-modal-overlay');
  if (!overlay) {
    return;
  }

  overlay.classList.add('is-open');
  document.body.classList.add('whatsapp-modal-open');
}

function closeWhatsappModal() {
  const overlay = document.getElementById('whatsapp-modal-overlay');
  if (!overlay) {
    return;
  }

  overlay.classList.remove('is-open');
  document.body.classList.remove('whatsapp-modal-open');
}

function bindFloatingButton() {
  const floatButtons = document.querySelectorAll('.whatsapp-float');

  floatButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openWhatsappModal();
    });
  });
}

function initWhatsappWidget() {
  createWhatsappModal();
  bindFloatingButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhatsappWidget);
} else {
  initWhatsappWidget();
}
