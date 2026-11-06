/* ========================================
   VIDA HABITAT - Main JavaScript
   ======================================== */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initSmoothScroll();
  initMobileMenu();
  initDropdown();
  initParallax();
  initReveal();
  initCounters();
  initProcess();
  initCardTilt();
  initMobileCta();
  initBackTop();
  initMaps();
  initForm();
  initWorks();
  initLightbox();
  initBeforeAfter();
  initAnchors();
  setActiveNav();
  setYear();
});

/* ─── Header scroll behaviour ─── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const solid = y > 60;
    header.classList.toggle('solid', solid);
    header.classList.toggle('transparent', !solid);

    // Se masque en descendant (au-delà du hero), réapparaît dès qu'on remonte
    const menuOpen = document.querySelector('.mobile-menu.open');
    if (menuOpen || y < 400) header.classList.remove('is-hidden');
    else if (y > lastY + 6) header.classList.add('is-hidden');
    else if (y < lastY - 6) header.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 6) lastY = y;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ─── Défilement fluide (Lenis) ───
   Desktop avec souris uniquement, jamais si l'utilisateur demande moins
   d'animations. Chargé après la page ; sans lui, le défilement natif reste. */
const LENIS_SRC = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
let lenis = null;

function initSmoothScroll() {
  if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const start = () => loadScript(LENIS_SRC).then(() => {
    if (!window.Lenis || prefersReducedMotion()) return;
    lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    reducedMotionQuery.addEventListener('change', () => { if (prefersReducedMotion()) { lenis.destroy(); lenis = null; } });
  }).catch(() => { /* CDN indisponible : défilement natif */ });

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* Défilement vers une position ou un élément, fluide si possible */
function scrollToTarget(target, offset = 0) {
  const instant = prefersReducedMotion();
  if (lenis) { lenis.scrollTo(target, { offset: -offset, immediate: instant }); return; }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
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
    if (lenis) open ? lenis.stop() : lenis.start();
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
  window.matchMedia('(min-width: 1024px)').addEventListener('change', e => {
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

  // Numérotation des enfants pour l'échelonnement (--i), sans limite de nombre
  document.querySelectorAll('.stagger, .section-header.reveal, .cta-banner-content.reveal').forEach(parent => {
    [...parent.children].forEach((child, i) => child.style.setProperty('--i', i));
  });

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

/* ─── Timeline « De votre appel à la livraison » ───
   La ligne dorée se remplit au rythme du scroll et allume chaque étape
   quand elle l'atteint. Horizontale sur desktop, verticale en dessous de
   1024 px : la géométrie est mesurée sur les pastilles elles-mêmes. */
function initProcess() {
  const wrap  = document.querySelector('.process');
  const steps = wrap ? [...wrap.querySelectorAll('.process-step')] : [];
  if (steps.length < 2) return;
  const nums = steps.map(step => step.querySelector('.process-step-num'));

  let vertical = false, start = 0, length = 1, marks = [];

  const measure = () => {
    const box = wrap.getBoundingClientRect();
    const centers = nums.map(n => {
      const r = n.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    });
    vertical = Math.abs(centers[1].x - centers[0].x) < 2;
    const axis = vertical ? 'y' : 'x';
    start  = centers[0][axis];
    length = Math.max(1, centers[centers.length - 1][axis] - start);
    marks  = centers.map(c => (c[axis] - start) / length);
    wrap.style.setProperty('--line-start', `${start}px`);
    wrap.style.setProperty('--line-length', `${length}px`);
  };

  measure();
  window.addEventListener('resize', () => { measure(); requestUpdate(); }, { passive: true });
  window.addEventListener('load', () => { measure(); requestUpdate(); }, { once: true });
  // Les étapes glissent à leur apparition : on remesure une fois posées
  wrap.addEventListener('animationend', e => { if (e.target.classList.contains('process-step')) { measure(); requestUpdate(); } });

  // Animations réduites ou navigateur ancien : état final directement
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  wrap.classList.add('is-animated');
  let visible = false, ticking = false;

  const update = () => {
    ticking = false;
    const vh  = window.innerHeight;
    const box = wrap.getBoundingClientRect();
    // Vertical : la ligne suit un « point de lecture » à 65 % de l'écran.
    // Horizontal : elle se remplit pendant que la frise traverse l'écran.
    const raw = vertical
      ? (vh * 0.65 - (box.top + start)) / length
      : (vh * 0.85 - box.top) / (vh * 0.45);
    const p = Math.min(1, Math.max(0, raw));
    wrap.style.setProperty('--progress', p.toFixed(4));
    steps.forEach((step, i) => step.classList.toggle('is-active', p > 0 && p >= marks[i] - 0.001));
  };

  function requestUpdate() {
    if (!visible || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { measure(); requestUpdate(); }
  }).observe(wrap);
  window.addEventListener('scroll', requestUpdate, { passive: true });
}

/* ─── Cartes métiers : léger relief 3D et reflet au survol ───
   Souris uniquement, jamais si l'utilisateur demande moins d'animations. */
function initCardTilt() {
  if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.service-card').forEach(card => {
    const amplitude = card.classList.contains('service-card-wide') ? 2 : 5; // degrés
    let frame = 0;

    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--ry', `${((x - 0.5) * amplitude).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * amplitude).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
    });

    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      ['--rx', '--ry', '--mx', '--my'].forEach(prop => card.style.removeProperty(prop));
    });
  });
}

/* ─── Barre « Appeler / Devis » (mobile et tablette) ───
   Apparaît après le haut de page, s'efface sur le footer (qui contient
   déjà les coordonnées) et pendant la saisie d'un formulaire (clavier). */
function initMobileCta() {
  const bar = document.querySelector('.mobile-cta');
  if (!bar) return;
  const footer = document.querySelector('.site-footer');
  let scrolled = false, footerVisible = false, typing = false;

  const render = () => bar.classList.toggle('is-visible', scrolled && !footerVisible && !typing);

  window.addEventListener('scroll', () => {
    const next = window.scrollY > 240;
    if (next !== scrolled) { scrolled = next; render(); }
  }, { passive: true });

  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; render(); }).observe(footer);
  }

  const isField = el => el.matches?.('input:not([type="checkbox"]):not([type="radio"]), textarea, select');
  document.addEventListener('focusin', e => { if (isField(e.target)) { typing = true; render(); } });
  document.addEventListener('focusout', e => { if (isField(e.target)) { typing = false; render(); } });

  scrolled = window.scrollY > 240;
  render();
}

/* ─── Cartes Google Maps chargées au clic ───
   Aucune requête vers Google (ni cookie) tant que le visiteur n'a pas
   cliqué. Son choix est retenu pour les pages suivantes. */
function initMaps() {
  const facades = document.querySelectorAll('.map-facade');
  if (!facades.length) return;
  const KEY = 'vida-maps-ok';

  const load = (facade, focus) => {
    const tpl = facade.querySelector('template');
    if (!tpl || facade.classList.contains('is-loaded')) return;
    facade.appendChild(tpl.content.cloneNode(true));
    facade.classList.add('is-loaded');
    if (focus) facade.querySelector('iframe')?.focus();
  };

  let accepted = false;
  try { accepted = localStorage.getItem(KEY) === '1'; } catch { /* stockage indisponible */ }

  facades.forEach(facade => {
    if (accepted) { load(facade, false); return; }
    facade.querySelector('.map-facade-btn')?.addEventListener('click', () => {
      try { localStorage.setItem(KEY, '1'); } catch { /* stockage indisponible */ }
      load(facade, true);
    });
  });
}

/* ─── Back to top ─── */
function initBackTop() {
  const btn = document.querySelector('.back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    scrollToTarget(0);
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

/* ─── Réalisations : filtres de la galerie ───
   Compteurs calculés depuis le HTML, filtre lisible dans l'URL
   (realisations.html#sols), réorganisation animée (FLIP). */
function initWorks() {
  const grid = document.querySelector('.works-grid');
  const buttons = [...document.querySelectorAll('.works-filter')];
  if (!grid || !buttons.length) return;
  const items = [...grid.children];
  const status = document.querySelector('[data-works-status]');
  const gallery = document.getElementById('galerie');

  buttons.forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === 'all' ? items.length : items.filter(i => i.dataset.cat === f).length;
    if (!n) { btn.hidden = true; return; } // catégorie sans photo : bouton masqué
    const count = document.createElement('span');
    count.className = 'works-filter-count';
    count.textContent = n;
    btn.append(' ', count);
  });

  const valid = f => buttons.some(b => b.dataset.filter === f && !b.hidden);

  const apply = (filter, animate) => {
    if (!valid(filter)) filter = 'all';
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));

    const flip = animate && !prefersReducedMotion() && typeof grid.animate === 'function';
    const before = flip ? new Map(items.filter(i => !i.hidden).map(i => [i, i.getBoundingClientRect()])) : null;

    let shown = 0;
    items.forEach(i => {
      const show = filter === 'all' || i.dataset.cat === filter;
      i.hidden = !show;
      if (show) shown++;
    });
    if (status) status.textContent = `${shown} photo${shown > 1 ? 's' : ''} affichée${shown > 1 ? 's' : ''}`;
    if (!flip) return;

    let k = 0;
    items.forEach(i => {
      if (i.hidden) return;
      const a = before.get(i);
      const b = i.getBoundingClientRect();
      if (a) {
        const dx = a.left - b.left, dy = a.top - b.top;
        const sx = a.width / b.width, sy = a.height / b.height;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
        i.animate([
          { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transformOrigin: 'top left', transform: 'none' },
        ], { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else {
        i.animate([
          { opacity: 0, transform: 'translateY(18px) scale(0.96)' },
          { opacity: 1, transform: 'none' },
        ], { duration: 600, delay: 60 + 40 * k++, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      }
    });
  };

  buttons.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    apply(f, true);
    history.replaceState(null, '', f === 'all' ? location.pathname + location.search : '#' + f);
  }));

  // Filtre demandé dans l'adresse (liens depuis l'accueil et les pages métiers)
  const fromHash = () => decodeURIComponent(location.hash.slice(1));
  const initial = fromHash();
  if (valid(initial) && initial !== 'all') {
    apply(initial, false);
    if (gallery) {
      const go = () => scrollToTarget(gallery, (document.querySelector('.site-header')?.offsetHeight || 0) + 20);
      if (document.readyState === 'complete') requestAnimationFrame(go);
      else window.addEventListener('load', go, { once: true });
    }
  } else {
    apply('all', false);
  }
  window.addEventListener('hashchange', () => { if (valid(fromHash())) apply(fromHash(), true); });
}

/* ─── Visionneuse photo (<dialog>) ───
   Sans JavaScript ou sans <dialog>, les liens ouvrent simplement la photo.
   Clavier : ← → pour naviguer, Échap pour fermer ; glisser au doigt sur mobile. */
function initLightbox() {
  const dialog = document.querySelector('.lightbox');
  const links = [...document.querySelectorAll('[data-lightbox]')];
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('.lightbox-img');
  const cat = dialog.querySelector('.lightbox-cat');
  const title = dialog.querySelector('.lightbox-title');
  const count = dialog.querySelector('.lightbox-count');
  const pad = n => String(n).padStart(2, '0');
  let list = [];
  let index = 0;
  let opener = null;

  const preload = a => { if (a) { const p = new Image(); p.src = a.href; } };

  const show = (i, dir = 0) => {
    index = (i + list.length) % list.length;
    const a = list[index];
    const thumb = a.querySelector('img');

    if (!prefersReducedMotion()) {
      img.style.setProperty('--from', `${dir * 36}px`);
      img.classList.add('is-changing');
      requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove('is-changing')));
    }
    // Miniature déjà chargée affichée tout de suite, remplacée par la grande dès qu'elle arrive
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    const big = new Image();
    big.onload = () => { if (list[index] === a) img.src = big.src; };
    big.src = a.href;

    cat.textContent = a.querySelector('.works-card-cat')?.textContent || '';
    title.textContent = a.querySelector('.works-card-title')?.textContent || thumb.alt;
    count.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
    count.setAttribute('aria-label', `Photo ${index + 1} sur ${list.length}`);
    const single = list.length < 2;
    dialog.querySelector('.lightbox-prev').hidden = single;
    dialog.querySelector('.lightbox-next').hidden = single;
    preload(list[(index + 1) % list.length]);
    preload(list[(index - 1 + list.length) % list.length]);
  };

  links.forEach(a => a.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // nouvel onglet : comportement normal
    e.preventDefault();
    opener = a;
    list = links.filter(l => !l.closest('[hidden]'));
    dialog.showModal();
    document.documentElement.classList.add('lightbox-open');
    if (lenis) lenis.stop();
    show(list.indexOf(a));
    dialog.querySelector('.lightbox-close').focus();
  }));

  const close = () => dialog.close();
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-open');
    if (lenis) lenis.start();
    img.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', close);
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1, -1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1, 1));

  // Clic dans le vide autour de la photo : fermeture
  dialog.addEventListener('click', e => {
    if (e.target === dialog || e.target.classList.contains('lightbox-inner') || e.target.classList.contains('lightbox-stage')) close();
  });

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
  });

  // Balayage horizontal (tactile)
  let startX = null, startY = 0;
  dialog.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { startX = e.clientX; startY = e.clientY; } });
  dialog.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  dialog.addEventListener('pointercancel', () => { startX = null; });
}

/* ─── Curseur avant / après ───
   Souris et doigt : glisser sur l'image (le défilement vertical reste possible).
   Clavier : le <input type="range"> masqué (flèches, Début, Fin). */
function initBeforeAfter() {
  document.querySelectorAll('[data-ba]').forEach(fig => {
    const frame = fig.querySelector('.ba-frame');
    const range = fig.querySelector('.ba-range');
    if (!frame || !range) return;
    let intro = 0;
    const stopIntro = () => { cancelAnimationFrame(intro); intro = 0; };

    const set = v => {
      v = Math.max(0, Math.min(100, v));
      frame.style.setProperty('--pos', `${v}%`);
      range.value = Math.round(v);
      range.setAttribute('aria-valuetext', `${Math.round(v)} % avant, ${100 - Math.round(v)} % après`);
      frame.classList.toggle('hide-before', v < 14);
      frame.classList.toggle('hide-after', v > 86);
    };
    set(+range.value);

    range.addEventListener('input', () => { stopIntro(); set(+range.value); });
    range.addEventListener('keydown', e => {
      const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
      if (!step) return;
      e.preventDefault();
      stopIntro();
      set(+range.value + step);
    });

    const at = e => {
      const r = frame.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    let drag = null;
    frame.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      stopIntro();
      drag = e.pointerId;
      frame.classList.add('is-dragging');
      frame.setPointerCapture(e.pointerId);
      if (e.pointerType === 'mouse') { e.preventDefault(); set(at(e)); range.focus({ preventScroll: true }); }
    });
    frame.addEventListener('pointermove', e => { if (drag === e.pointerId) set(at(e)); });
    const end = e => {
      if (drag !== e.pointerId) return;
      drag = null;
      frame.classList.remove('is-dragging');
    };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);

    // Petit mouvement d'invitation la première fois que le curseur apparaît
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const keys = [50, 66, 36, 50];
      const seg = 650;
      let t0 = null;
      const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const tick = now => {
        if (t0 === null) t0 = now;
        const t = (now - t0) / seg;
        const k = Math.min(Math.floor(t), keys.length - 2);
        set(keys[k] + (keys[k + 1] - keys[k]) * ease(Math.min(t - k, 1)));
        intro = t < keys.length - 1 ? requestAnimationFrame(tick) : 0;
      };
      setTimeout(() => { intro = requestAnimationFrame(tick); }, 700);
    }, { threshold: 0.6 });
    io.observe(frame);
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
      if (target !== document.getElementById('main')) {
        scrollToTarget(target, (document.querySelector('.site-header')?.offsetHeight || 0) + 20);
      }
      // Le focus suit le lien (indispensable pour le lien d'évitement)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.pushState(null, '', hash);
    });
  });
}
