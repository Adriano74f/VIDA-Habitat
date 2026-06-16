/* ========================================
   VIDA HABITAT - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initParallax();
  initReveal();
  initCounters();
  initBackTop();
  initForm();
  setActiveNav();
});

/* ─── Header scroll behaviour ─── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const update = () => {
    if (window.scrollY > 60) {
      header.classList.add('solid');
      header.classList.remove('transparent');
    } else {
      header.classList.remove('solid');
      header.classList.add('transparent');
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─── Mobile menu ─── */
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const menu   = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      burger.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ─── Parallax on hero / banner backgrounds ─── */
function initParallax() {
  const targets = document.querySelectorAll('.hero-bg, .page-hero-bg, .cta-banner-bg');
  if (!targets.length) return;

  const tick = () => {
    const y = window.scrollY;
    targets.forEach(el => {
      const parent = el.closest('.hero, .page-hero, .cta-banner');
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + y) * 0.35;
      el.style.transform = `translateY(${offset * 0.35}px)`;
    });
    rafId = requestAnimationFrame(tick);
  };

  let rafId;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.some(e => e.isIntersecting);
    if (visible && !rafId) rafId = requestAnimationFrame(tick);
    if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });

  targets.forEach(el => observer.observe(el.parentElement || el));

  // Also update on scroll
  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: true });
}

/* ─── Scroll reveal ─── */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .stagger');
  if (!els.length) return;

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

/* ─── Animated counters ─── */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur    = 1800;
      const start  = performance.now();
      const from   = 0;

      const update = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(from + (target - from) * ease) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
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

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ─── Contact form ─── */
function initForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 4v1m0 14v1M4 12H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707"/></svg> Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      showToast('Votre message a bien été envoyé ! Nous vous recontacterons sous 24h.');
      form.reset();
    }, 1800);
  });
}

/* ─── Toast notification ─── */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ─── Set active nav link ─── */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-menu a').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) link.classList.add('active');
  });
}

/* ─── Smooth anchor scroll ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 90;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});
