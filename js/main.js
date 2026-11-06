/* ========================================
   VIDA HABITAT - Main JavaScript
   ======================================== */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initDropdown();
  initParallax();
  initReveal();
  initCounters();
  initBackTop();
  initForm();
  initAnchors();
  setActiveNav();
  setYear();
});

/* ─── Header scroll behaviour ─── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const update = () => {
    const solid = window.scrollY > 60;
    header.classList.toggle('solid', solid);
    header.classList.toggle('transparent', !solid);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─── Mobile menu ─── */
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const menu   = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;

  const isOpen = () => menu.classList.contains('open');

  const setOpen = (open, { returnFocus = false } = {}) => {
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a')?.focus({ preventScroll: true });
    else if (returnFocus) burger.focus();
  };

  burger.addEventListener('click', () => setOpen(!isOpen()));

  // Fermeture au clic sur un lien
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    // Échap ferme le menu et rend le focus au bouton
    if (e.key === 'Escape') { setOpen(false, { returnFocus: true }); return; }
    // Le focus reste piégé entre le bouton et les liens du menu
    if (e.key === 'Tab') {
      const items = [burger, ...menu.querySelectorAll('a[href]')];
      const first = items[0];
      const last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Passage en affichage desktop : on referme
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => {
    if (e.matches && isOpen()) setOpen(false);
  });
}

/* ─── Menu déroulant Métiers (clavier) ─── */
function initDropdown() {
  document.querySelectorAll('.nav-item').forEach(item => {
    const trigger = item.querySelector('.nav-link');
    const reset = () => item.classList.remove('is-closed');

    item.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        item.classList.add('is-closed');
        trigger?.focus();
      } else if (e.key === 'ArrowDown' && e.target === trigger) {
        e.preventDefault();
        reset();
        // une frame d'attente : le menu doit être redevenu visible pour recevoir le focus
        requestAnimationFrame(() => item.querySelector('.nav-dropdown a')?.focus());
      }
    });
    item.addEventListener('mouseenter', reset);
    item.addEventListener('mouseleave', reset);
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) reset(); });
  });
}

/* ─── Parallax on hero / banner backgrounds ───
   Une seule frame est calculée par événement de scroll, et uniquement
   pour les fonds visibles. Désactivée sur écrans tactiles et si
   l'utilisateur demande moins d'animations. */
function initParallax() {
  const SPEED = 0.3;
  const canParallax = () =>
    !prefersReducedMotion() && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const items = [...document.querySelectorAll('.hero-bg, .page-hero-bg, .cta-banner-bg')]
    .map(el => ({ el, parent: el.parentElement, visible: false, max: 0 }))
    .filter(item => item.parent);
  if (!items.length || !('IntersectionObserver' in window)) return;

  let scheduled = false;

  // Marge disponible au-dessus/en dessous du fond (il déborde de son parent via inset négatif)
  const measure = () => items.forEach(item => {
    item.max = Math.max(0, (item.el.offsetHeight - item.parent.offsetHeight) / 2);
  });

  const update = () => {
    scheduled = false;
    const vh = window.innerHeight;
    items.forEach(item => {
      if (!item.visible) return;
      const rect = item.parent.getBoundingClientRect();
      // Le hero démarre en haut de page : décalage à partir de 0.
      // Les autres bandeaux sont centrés : décalage nul au milieu de l'écran.
      const isTop = item.el.classList.contains('hero-bg');
      const raw = isTop ? -rect.top * SPEED : (vh / 2 - (rect.top + rect.height / 2)) * SPEED * 0.5;
      const y = Math.max(-item.max, Math.min(item.max, raw));
      item.el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
  };

  const requestUpdate = () => {
    if (scheduled || !canParallax() || !items.some(i => i.visible)) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = items.find(i => i.parent === entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
    requestUpdate();
  });
  items.forEach(item => io.observe(item.parent));

  const reset = () => items.forEach(item => { item.el.style.transform = ''; });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => { measure(); requestUpdate(); }, { passive: true });
  reducedMotionQuery.addEventListener('change', () => (canParallax() ? requestUpdate() : reset()));
  measure();
}

/* ─── Scroll reveal ─── */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .stagger');
  if (!els.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ─── Animated counters ───
   La valeur finale est écrite dans le HTML (visible sans JS et
   pour les moteurs de recherche) ; l'animation part de 0. */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const render = (el, value) => { el.textContent = value + (el.dataset.suffix || ''); };

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    counters.forEach(el => render(el, +el.dataset.count));
    return;
  }

  counters.forEach(el => render(el, 0));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = +el.dataset.count;
      const dur    = 1800;
      const start  = performance.now();

      const step = now => {
        const progress = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        render(el, Math.round(target * ease));
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(el => io.observe(el));
}

/* ─── Back to top ─── */
function initBackTop() {
  const btn = document.querySelector('.back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Le focus clavier revient en haut de page
    document.querySelector('.header-logo')?.focus({ preventScroll: true });
  });
}

/* ─── Contact form ───
   Envoi via Web3Forms (compatible GitHub Pages). La clé se règle dans
   contact.html : <input type="hidden" name="access_key" value="">.
   Clé vide = formulaire non branché : rien n'est envoyé, le visiteur
   se voit proposer l'email prérempli et le téléphone. */
function initForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status   = form.querySelector('.form-status');
  const btn      = form.querySelector('[type="submit"]');
  const btnText  = btn.querySelector('.btn-text');
  const fields   = [...form.querySelectorAll('input, select, textarea')]
    .filter(f => f.type !== 'hidden' && f.name !== 'botcheck');
  const touched  = new WeakSet();

  // Coordonnées lues dans la page (une seule source : les placeholders du HTML)
  const contactEmail = (document.querySelector('a[href^="mailto:"]')?.getAttribute('href') || '').replace('mailto:', '');
  const contactPhone = document.querySelector('a[href^="tel:"]');

  const ERRORS = {
    required: 'Ce champ est obligatoire.',
    consent:  'Merci de cocher cette case pour que nous puissions traiter votre demande.',
    email:    'Adresse email invalide (exemple : nom@domaine.fr).',
    tel:      'Numéro de téléphone invalide (exemple : 06 12 34 56 78).',
    message:  'Merci de décrire votre projet en quelques mots (15 caractères minimum).',
  };

  const check = field => {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    if (field.required && !value) return field.type === 'checkbox' ? ERRORS.consent : ERRORS.required;
    if (!value || field.type === 'checkbox') return '';
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return ERRORS.email;
    if (field.type === 'tel' && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 9)) return ERRORS.tel;
    if (field.name === 'message' && value.length < 15) return ERRORS.message;
    return '';
  };

  const validate = field => {
    const msg   = check(field);
    const group = field.closest('.form-group, .form-consent');
    const error = form.querySelector(`#${field.id}-error`);
    if (error) error.textContent = msg;
    if (msg) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    group?.classList.toggle('has-error', !!msg);
    const filled = field.type === 'checkbox' ? field.checked : !!field.value.trim();
    group?.classList.toggle('is-valid', !msg && filled && field.required);
    return !msg;
  };

  fields.forEach(field => {
    field.addEventListener('blur', () => { touched.add(field); validate(field); });
    field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (touched.has(field) || field.type === 'checkbox') validate(field);
    });
  });

  const showStatus = (type, html) => {
    status.className = `form-status is-${type}`;
    status.innerHTML = html;
    status.hidden = false;
    status.focus({ preventScroll: false });
  };

  const hideStatus = () => { status.hidden = true; status.innerHTML = ''; };

  const setLoading = loading => {
    btn.disabled = loading;
    btn.classList.toggle('is-loading', loading);
    form.setAttribute('aria-busy', String(loading));
    if (btnText) btnText.textContent = loading ? 'Envoi en cours…' : 'Envoyer ma demande';
  };

  const escapeHtml = str => str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const contactLinks = () => {
    const parts = [];
    if (contactPhone) parts.push(`appelez-nous au <a href="${contactPhone.getAttribute('href')}">${escapeHtml(contactPhone.textContent.trim())}</a>`);
    if (contactEmail) parts.push(`écrivez-nous à <a href="mailto:${contactEmail}">${escapeHtml(contactEmail)}</a>`);
    return parts.join(' ou ');
  };

  const mailtoHref = () => {
    const get = name => (form.elements[name]?.value || '').trim();
    const body = [
      `Prénom : ${get('prenom')}`,
      `Nom : ${get('nom')}`,
      `Email : ${get('email')}`,
      `Téléphone : ${get('telephone')}`,
      `Type de projet : ${get('type') || 'Non précisé'}`,
      `Commune du chantier : ${get('adresse') || 'Non précisée'}`,
      '',
      get('message'),
    ].join('\n');
    return `mailto:${contactEmail}?subject=${encodeURIComponent('Demande de devis – site VIDA Habitat')}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideStatus();

    fields.forEach(f => touched.add(f));
    const invalid = fields.filter(f => !validate(f));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // Robot détecté par le honeypot : on ne fait rien
    if (form.elements.botcheck?.checked) return;

    const accessKey = (form.elements.access_key?.value || '').trim();

    // Formulaire pas encore branché : on le dit clairement et on propose une alternative
    if (!accessKey) {
      showStatus('info', `
        <p><strong>Votre demande n'a pas encore été envoyée.</strong> L'envoi en ligne sera bientôt disponible.</p>
        <p>En attendant, envoyez-la par email (votre message est déjà rédigé) ou ${contactLinks()}.</p>
        ${contactEmail ? `<a class="btn btn-dark btn-sm" href="${mailtoHref()}">Envoyer ma demande par email</a>` : ''}
      `);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

      const prenom = escapeHtml((form.elements.prenom?.value || '').trim());
      form.reset();
      fields.forEach(f => {
        touched.delete(f);
        f.removeAttribute('aria-invalid');
        f.closest('.form-group, .form-consent')?.classList.remove('is-valid', 'has-error');
      });
      showStatus('success', `
        <p><strong>Merci${prenom ? ' ' + prenom : ''}, votre demande a bien été envoyée.</strong></p>
        <p>Nous revenons vers vous très rapidement pour en discuter.</p>
      `);
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'Le serveur met trop de temps à répondre.' : 'Une erreur est survenue lors de l\'envoi.';
      showStatus('error', `
        <p><strong>${reason}</strong> Votre demande n'a pas été envoyée.</p>
        <p>Vous pouvez réessayer dans un instant, ou ${contactLinks()}.</p>
      `);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  });
}

/* ─── Set active nav link ─── */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-menu a').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) link.classList.add('active');
  });
}

/* ─── Année du copyright ─── */
function setYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = year; });
}

/* ─── Smooth anchor scroll ─── */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      // Liens provisoires href="#" (réseaux sociaux, pages légales) : pas de saut en haut de page
      if (hash.length < 2) { e.preventDefault(); return; }
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      const offset = (document.querySelector('.site-header')?.offsetHeight || 0) + 20;
      const top = target === document.getElementById('main') ? window.scrollY : target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      // Le focus suit le lien (indispensable pour le lien d'évitement)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.pushState(null, '', hash);
    });
  });
}
