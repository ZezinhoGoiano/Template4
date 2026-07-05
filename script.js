/* =============================================================
   ÉCLAT ESTHÉTIQUE — script.js v1.1
   Organização:
   01. Constantes & Estado Global
   02. Utilitários
   03. Preload Removal
   04. Header (scroll + mobile nav + active link)
   05. Parallax
   06. Scroll Animations (IntersectionObserver)
   07. Contadores Animados
   08. Before & After Slider
   09. Galeria Modal (zoom, navegação, teclado)
   10. FAQ Accordion
   11. Acessibilidade Toolbar
   12. Formulário CTA
   13. Smooth Scroll
   14. Footer Year
   15. Video Testimony Placeholder
   16. Init
============================================================= */

'use strict';

/* ----------------------------------------------------------------
   01. CONSTANTES & ESTADO GLOBAL
---------------------------------------------------------------- */
const STATE = {
  currentGalleryIndex : 0,
  galleryZoomed       : false,
  parallaxEnabled     : true,
  reducedMotion       : false,
  highContrast        : false,
  fontScale           : 0,          // passos: -2 → +3
  a11yPanelOpen       : false,
  baActive            : 0,          // antes-depois ativo
  baDragging          : false,
  touchStartX         : 0,
  lastScrollY         : 0,
  ticking             : false,
};

/* Imagens da galeria com alt e caption — sincronizados com index.html */
const GALLERY_ITEMS = [
  {
    src     : 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=85',
    alt     : 'Recepção elegante da Éclat Esthétique com design sofisticado',
    caption : 'Recepção — Éclat Esthétique',
  },
  {
    src     : 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&q=85',
    alt     : 'Sala de procedimentos estéticos com equipamentos premium',
    caption : 'Sala de Procedimentos',
  },
  {
    src     : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=85',
    alt     : 'Lounge de espera com ambiente relaxante e sofisticado',
    caption : 'Lounge de Espera',
  },
  {
    src     : 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=900&q=85',
    alt     : 'Área de tratamentos corporais da Éclat Esthétique',
    caption : 'Área de Tratamentos Corporais',
  },
  {
    src     : 'https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?w=1200&q=85',
    alt     : 'Especialista realizando procedimento estético com precisão',
    caption : 'Procedimento em Andamento',
  },
  {
    src     : 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=900&q=85',
    alt     : 'Produtos cosméticos premium utilizados nos tratamentos da Éclat',
    caption : 'Produtos Premium',
  },
];

/* ----------------------------------------------------------------
   02. UTILITÁRIOS
---------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const announceToSR = (() => {
  let liveRegion = null;
  return (msg) => {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = msg; });
  };
})();

/* ----------------------------------------------------------------
   03. PRELOAD REMOVAL
---------------------------------------------------------------- */
const removePreload = () => {
  document.body.classList.remove('preload');
};

/* ----------------------------------------------------------------
   04. HEADER
---------------------------------------------------------------- */
const initHeader = () => {
  const header    = $('#header');
  const toggle    = $('.nav-toggle');
  const mobileNav = $('#mobile-nav');
  const navLinks  = $$('.nav-link');
  const mobileLinks = $$('.mobile-nav-link, .mobile-nav-cta');

  if (!header) return;

  const updateHeader = () => {
    const scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
    STATE.lastScrollY = window.scrollY;
    STATE.ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!STATE.ticking) {
      requestAnimationFrame(updateHeader);
      STATE.ticking = true;
    }
  }, { passive: true });

  updateHeader();

  const openMobileNav = () => {
    toggle.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('hidden');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstLink = mobileNav.querySelector('a, button');
    if (firstLink) firstLink.focus();
  };

  const closeMobileNav = () => {
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('hidden', '');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    toggle.focus();
  };

  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMobileNav() : openMobileNav();
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => closeMobileNav());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMobileNav();
    }
  });

  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth >= 1280) closeMobileNav();
  }, 200));

  const sections = $$('section[id], div[id]');

  const updateActiveLink = () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) - 80;
      if (window.scrollY >= top) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  };

  window.addEventListener('scroll', debounce(updateActiveLink, 80), { passive: true });
};

/* ----------------------------------------------------------------
   05. PARALLAX
---------------------------------------------------------------- */
const initParallax = () => {
  if (prefersReducedMotion()) return;

  const parallaxEls = $$('[data-parallax]');
  if (!parallaxEls.length) return;

  const handleParallax = () => {
    if (!STATE.parallaxEnabled || STATE.reducedMotion) return;

    parallaxEls.forEach(el => {
      const speed  = parseFloat(el.dataset.parallax) || 0.3;
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const offset = center * speed;

      el.style.transform = `translateY(${offset.toFixed(2)}px)`;
    });
  };

  window.addEventListener('scroll', () => {
    if (!STATE.ticking) {
      requestAnimationFrame(() => {
        handleParallax();
        STATE.ticking = false;
      });
      STATE.ticking = true;
    }
  }, { passive: true });

  handleParallax();
};

/* ----------------------------------------------------------------
   06. SCROLL ANIMATIONS
---------------------------------------------------------------- */
const initScrollAnimations = () => {
  const elements = $$('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin : '0px 0px -60px 0px',
      threshold  : 0.12,
    }
  );

  elements.forEach(el => observer.observe(el));
};

/* ----------------------------------------------------------------
   07. CONTADORES ANIMADOS
---------------------------------------------------------------- */
const initCounters = () => {
  const statsSection = $('.stats');
  if (!statsSection) return;

  const counters = $$('.stat-value', statsSection);
  let hasAnimated = false;

  const animateCounter = (el) => {
    const target    = parseInt(el.dataset.count, 10);
    const suffix    = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const display   = el.querySelector('.count-number');
    if (!display) return;

    const duration = STATE.reducedMotion ? 0 : 1800;
    const start    = performance.now();

    const format = (val) => {
      if (isDecimal) return (val / 10).toFixed(1).replace('.', ',');
      if (target >= 1000) return val.toLocaleString('pt-BR');
      return val;
    };

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(2, -10 * progress);
      const current  = Math.round(lerp(0, target, eased));

      display.textContent = format(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        display.textContent = format(target);
      }
    };

    if (duration === 0) {
      display.textContent = format(target);
    } else {
      requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach((c, i) => {
          setTimeout(() => animateCounter(c), i * 150);
        });
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(statsSection);
};

/* ----------------------------------------------------------------
   08. BEFORE & AFTER SLIDER
---------------------------------------------------------------- */
const initBeforeAfter = () => {
  const tabs    = $$('.ba-tab');
  const sliders = $$('.ba-slider');
  if (!tabs.length || !sliders.length) return;

  const showSlider = (index) => {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    sliders.forEach((slider, i) => {
      const isActive = i === index;
      if (isActive) {
        slider.removeAttribute('hidden');
        slider.classList.add('active');
        resetDivider(slider);
      } else {
        slider.setAttribute('hidden', '');
        slider.classList.remove('active');
      }
    });

    STATE.baActive = index;
    announceToSR(`Exibindo comparação: ${tabs[index].textContent.trim()}`);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showSlider(i));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        showSlider((i + 1) % tabs.length);
        tabs[(i + 1) % tabs.length].focus();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (i - 1 + tabs.length) % tabs.length;
        showSlider(prev);
        tabs[prev].focus();
      }
    });
  });

  sliders.forEach(slider => {
    const wrapper = slider.querySelector('.ba-wrapper');
    const after   = slider.querySelector('.ba-after');
    const divider = slider.querySelector('.ba-divider');
    if (!wrapper || !after || !divider) return;

    let position = 50; 

    const setPosition = (pct) => {
      position = clamp(pct, 2, 98);
      after.style.clipPath    = `inset(0 ${100 - position}% 0 0)`;
      divider.style.left      = `${position}%`;
    };

    const resetDivider = () => setPosition(50);

    const getPct = (clientX) => {
      const rect = wrapper.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };

    wrapper.addEventListener('mousedown', (e) => {
      STATE.baDragging = true;
      wrapper.style.cursor = 'ew-resize';
      setPosition(getPct(e.clientX));
    });

    window.addEventListener('mousemove', (e) => {
      if (!STATE.baDragging) return;
      setPosition(getPct(e.clientX));
    });

    window.addEventListener('mouseup', () => {
      STATE.baDragging = false;
      wrapper.style.cursor = '';
    });

    wrapper.addEventListener('touchstart', (e) => {
      STATE.baDragging = true;
      STATE.touchStartX = e.touches[0].clientX;
      setPosition(getPct(e.touches[0].clientX));
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!STATE.baDragging) return;
      setPosition(getPct(e.touches[0].clientX));
    }, { passive: true });

    window.addEventListener('touchend', () => {
      STATE.baDragging = false;
    });

    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'slider');
    wrapper.setAttribute('aria-label', 'Comparação antes e depois — use as setas para ajustar');
    wrapper.setAttribute('aria-valuemin', '0');
    wrapper.setAttribute('aria-valuemax', '100');
    wrapper.setAttribute('aria-valuenow', '50');

    wrapper.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setPosition(position + step);
        wrapper.setAttribute('aria-valuenow', String(Math.round(position)));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setPosition(position - step);
        wrapper.setAttribute('aria-valuenow', String(Math.round(position)));
      }
      if (e.key === 'Home') { e.preventDefault(); setPosition(2); }
      if (e.key === 'End')  { e.preventDefault(); setPosition(98); }
    });

    setPosition(50);
    slider._resetDivider = resetDivider;
  });

  const resetDivider = (slider) => {
    if (slider._resetDivider) slider._resetDivider();
  };

  showSlider(0);
};

/* ----------------------------------------------------------------
   09. GALERIA MODAL
---------------------------------------------------------------- */
const initGallery = () => {
  const modal      = $('#gallery-modal');
  const modalImg   = $('#modal-img');
  const modalCap   = $('#modal-caption');
  const closeBtn   = modal?.querySelector('.modal-close');
  const prevBtn    = modal?.querySelector('.modal-prev');
  const nextBtn    = modal?.querySelector('.modal-next');
  const backdrop   = modal?.querySelector('.modal-backdrop');
  const galleryBtns = $$('.gallery-item[data-gallery-index]');

  if (!modal || !modalImg) return;

  const openModal = (index) => {
    STATE.currentGalleryIndex = clamp(index, 0, GALLERY_ITEMS.length - 1);
    renderModalImage();
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
    announceToSR(`Imagem ${STATE.currentGalleryIndex + 1} de ${GALLERY_ITEMS.length}: ${GALLERY_ITEMS[STATE.currentGalleryIndex].caption}`);
  };

  const closeModal = () => {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    STATE.galleryZoomed = false;
    if (modalImg) {
      modalImg.classList.remove('zoomed');
      modalImg.style.transform = '';
    }
    const opener = $(`.gallery-item[data-gallery-index="${STATE.currentGalleryIndex}"]`);
    opener?.focus();
  };

  const renderModalImage = () => {
    const item = GALLERY_ITEMS[STATE.currentGalleryIndex];
    if (!item) return;

    modalImg.style.opacity = '0';
    modalImg.style.transform = 'scale(0.96)';

    STATE.galleryZoomed = false;
    modalImg.classList.remove('zoomed');

    setTimeout(() => {
      modalImg.src = item.src;
      modalImg.alt = item.alt;
      if (modalCap) modalCap.textContent = item.caption;

      modalImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      modalImg.style.opacity    = '1';
      modalImg.style.transform  = 'scale(1)';
    }, 150);

    const prevItem = GALLERY_ITEMS[(STATE.currentGalleryIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length];
    const nextItem = GALLERY_ITEMS[(STATE.currentGalleryIndex + 1) % GALLERY_ITEMS.length];
    prevBtn?.setAttribute('aria-label', `Imagem anterior: ${prevItem.caption}`);
    nextBtn?.setAttribute('aria-label', `Próxima imagem: ${nextItem.caption}`);

    announceToSR(`${item.caption} — ${STATE.currentGalleryIndex + 1} de ${GALLERY_ITEMS.length}`);
  };

  const navigate = (dir) => {
    const total = GALLERY_ITEMS.length;
    STATE.currentGalleryIndex = (STATE.currentGalleryIndex + dir + total) % total;
    renderModalImage();
  };

  modalImg.addEventListener('dblclick', () => {
    STATE.galleryZoomed = !STATE.galleryZoomed;
    modalImg.classList.toggle('zoomed', STATE.galleryZoomed);
    modalImg.style.cursor = STATE.galleryZoomed ? 'zoom-out' : 'zoom-in';
    announceToSR(STATE.galleryZoomed ? 'Imagem ampliada' : 'Zoom removido');
  });

  galleryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.galleryIndex, 10);
      openModal(index);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const index = parseInt(btn.dataset.galleryIndex, 10);
        openModal(index);
      }
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  prevBtn?.addEventListener('click',  () => navigate(-1));
  nextBtn?.addEventListener('click',  () => navigate(1));

  document.addEventListener('keydown', (e) => {
    if (modal.hasAttribute('hidden')) return;
    switch (e.key) {
      case 'Escape':      closeModal(); break;
      case 'ArrowLeft':   navigate(-1); break;
      case 'ArrowRight':  navigate(1);  break;
      case 'ArrowUp':
      case 'ArrowDown':   e.preventDefault(); break;
    }
  });

  let touchX = 0;
  modal.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  }, { passive: true });

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || modal.hasAttribute('hidden')) return;
    const focusable = [...modal.querySelectorAll('button, [tabindex="0"]')].filter(
      el => !el.hasAttribute('disabled') && !el.hasAttribute('hidden')
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
};

/* ----------------------------------------------------------------
   10. FAQ ACCORDION
---------------------------------------------------------------- */
const initFAQ = () => {
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      items.forEach(other => {
        const otherBtn    = other.querySelector('.faq-question');
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherBtn && otherAnswer && otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.setAttribute('hidden', '');
        }
      });

      if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('hidden', '');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
        setTimeout(() => {
          const headerH = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
            10
          ) || 80;
          const top = item.getBoundingClientRect().top + window.scrollY - headerH - 20;
          window.scrollTo({ top, behavior: STATE.reducedMotion ? 'auto' : 'smooth' });
        }, 50);
      }

      announceToSR(isOpen ? 'Pergunta recolhida' : `Resposta: ${answer.querySelector('p')?.textContent || ''}`);
    });
  });
};

/* ----------------------------------------------------------------
   11. ACESSIBILIDADE TOOLBAR
---------------------------------------------------------------- */
const initA11yToolbar = () => {
  const toolbar    = $('.a11y-toolbar');
  const toggleBtn  = toolbar?.querySelector('.a11y-toggle');
  const panel      = toolbar?.querySelector('.a11y-panel');
  const actionBtns = toolbar ? $$('.a11y-btn', toolbar) : [];

  if (!toolbar || !toggleBtn || !panel) return;

  const openPanel = () => {
    panel.removeAttribute('hidden');
    toggleBtn.setAttribute('aria-expanded', 'true');
    STATE.a11yPanelOpen = true;
    panel.querySelector('.a11y-btn')?.focus();
    announceToSR('Painel de acessibilidade aberto');
  };

  const closePanel = () => {
    panel.setAttribute('hidden', '');
    toggleBtn.setAttribute('aria-expanded', 'false');
    STATE.a11yPanelOpen = false;
    announceToSR('Painel de acessibilidade fechado');
  };

  toggleBtn.addEventListener('click', () => {
    STATE.a11yPanelOpen ? closePanel() : openPanel();
  });

  toolbar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.a11yPanelOpen) {
      closePanel();
      toggleBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (STATE.a11yPanelOpen && !toolbar.contains(e.target)) closePanel();
  });

  const actions = {
    contrast: (btn) => {
      STATE.highContrast = !STATE.highContrast;
      document.body.dataset.theme = STATE.highContrast ? 'high-contrast' : 'default';
      btn.setAttribute('aria-pressed', String(STATE.highContrast));
      btn.classList.toggle('active', STATE.highContrast);
      announceToSR(STATE.highContrast ? 'Alto contraste ativado' : 'Alto contraste desativado');
      persistA11y();
    },
    'font-increase': () => {
      if (STATE.fontScale >= 3) return;
      STATE.fontScale++;
      applyFontScale();
      announceToSR(`Tamanho da fonte aumentado. Nível ${STATE.fontScale}`);
      persistA11y();
    },
    'font-decrease': () => {
      if (STATE.fontScale <= -2) return;
      STATE.fontScale--;
      applyFontScale();
      announceToSR(`Tamanho da fonte diminuído. Nível ${STATE.fontScale}`);
      persistA11y();
    },
    'reduce-motion': (btn) => {
      STATE.reducedMotion = !STATE.reducedMotion;
      document.body.classList.toggle('reduce-motion', STATE.reducedMotion);
      document.documentElement.classList.toggle('no-smooth-scroll', STATE.reducedMotion);
      btn.setAttribute('aria-pressed', String(STATE.reducedMotion));
      announceToSR(STATE.reducedMotion ? 'Animações reduzidas' : 'Animações restauradas');
      persistA11y();
    },
    'no-parallax': (btn) => {
      STATE.parallaxEnabled = !STATE.parallaxEnabled;
      document.body.classList.toggle('no-parallax', !STATE.parallaxEnabled);
      if (!STATE.parallaxEnabled) {
        $$('[data-parallax]').forEach(el => el.style.transform = 'none');
      }
      btn.setAttribute('aria-pressed', String(!STATE.parallaxEnabled));
      announceToSR(STATE.parallaxEnabled ? 'Parallax reativado' : 'Parallax desativado');
      persistA11y();
    },
    reset: () => {
      STATE.highContrast     = false;
      STATE.fontScale        = 0;
      STATE.reducedMotion    = false;
      STATE.parallaxEnabled  = true;

      document.body.dataset.theme = 'default';
      document.body.classList.remove('reduce-motion', 'no-parallax');
      document.documentElement.classList.remove('no-smooth-scroll');
      applyFontScale();

      $$('[data-parallax]').forEach(el => el.style.transform = '');
      actionBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));

      localStorage.removeItem('eclat-a11y');
      announceToSR('Configurações de acessibilidade restauradas');
    },
  };

  actionBtns.forEach(btn => {
    const action = btn.dataset.action;
    if (!action || !actions[action]) return;

    btn.addEventListener('click', () => actions[action](btn));
  });

  const applyFontScale = () => {
    const step = 2; 
    const base = 16 + STATE.fontScale * step;
    document.documentElement.style.fontSize = `${base}px`;
  };

  const persistA11y = () => {
    try {
      localStorage.setItem('eclat-a11y', JSON.stringify({
        highContrast    : STATE.highContrast,
        fontScale       : STATE.fontScale,
        reducedMotion   : STATE.reducedMotion,
        parallaxEnabled : STATE.parallaxEnabled,
      }));
    } catch (_) {}
  };

  const restoreA11y = () => {
    try {
      const saved = localStorage.getItem('eclat-a11y');
      if (!saved) return;
      const prefs = JSON.parse(saved);

      if (prefs.highContrast) {
        STATE.highContrast = true;
        document.body.dataset.theme = 'high-contrast';
        const btn = toolbar.querySelector('[data-action="contrast"]');
        btn?.setAttribute('aria-pressed', 'true');
      }

      if (prefs.fontScale !== 0) {
        STATE.fontScale = prefs.fontScale;
        applyFontScale();
      }

      if (prefs.reducedMotion) {
        STATE.reducedMotion = true;
        document.body.classList.add('reduce-motion');
        document.documentElement.classList.add('no-smooth-scroll');
        const btn = toolbar.querySelector('[data-action="reduce-motion"]');
        btn?.setAttribute('aria-pressed', 'true');
      }

      if (prefs.parallaxEnabled === false) {
        STATE.parallaxEnabled = false;
        document.body.classList.add('no-parallax');
        const btn = toolbar.querySelector('[data-action="no-parallax"]');
        btn?.setAttribute('aria-pressed', 'true');
      }
    } catch (_) {}
  };

  restoreA11y();

  if (prefersReducedMotion()) {
    STATE.reducedMotion = true;
    document.body.classList.add('reduce-motion');
    const btn = toolbar.querySelector('[data-action="reduce-motion"]');
    btn?.setAttribute('aria-pressed', 'true');
  }
};

/* ----------------------------------------------------------------
   12. FORMULÁRIO CTA
---------------------------------------------------------------- */
const initForm = () => {
  const form = $('.cta-form');
  if (!form) return;

  const phoneInput = $('#form-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (val.length > 6) {
        val = val.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      } else if (val.length > 2) {
        val = val.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      } else if (val.length > 0) {
        val = val.replace(/^(\d{0,2})/, '($1');
      }
      e.target.value = val;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput   = $('#form-name');
    const phoneEl     = $('#form-phone');
    const treatmentEl = $('#form-treatment');
    const submitBtn   = form.querySelector('[type="submit"]');

    clearErrors(form);

    let valid = true;

    if (!nameInput?.value.trim() || nameInput.value.trim().length < 3) {
      showFieldError(nameInput, 'Por favor, informe seu nome completo.');
      valid = false;
    }

    const rawPhone = phoneEl?.value.replace(/\D/g, '') || '';
    if (rawPhone.length < 10) {
      showFieldError(phoneEl, 'Informe um WhatsApp válido com DDD.');
      valid = false;
    }

    if (!valid) {
      announceToSR('Formulário com erros. Por favor, corrija os campos indicados.');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const btnSpan = submitBtn?.querySelector('span');
    const original = btnSpan?.textContent;
    if (btnSpan) btnSpan.textContent = 'Enviando...';
    submitBtn?.setAttribute('disabled', '');
    submitBtn?.setAttribute('aria-busy', 'true');

    await simulateSubmit({
      name      : nameInput.value.trim(),
      phone     : rawPhone,
      treatment : treatmentEl?.value || '',
    });

    if (btnSpan) btnSpan.textContent = '✓ Solicitação Enviada!';
    submitBtn?.removeAttribute('disabled');
    submitBtn?.removeAttribute('aria-busy');
    submitBtn?.classList.add('btn-success');

    announceToSR('Solicitação enviada com sucesso! Em breve entraremos em contato.');

    form.reset();
    setTimeout(() => {
      if (btnSpan) btnSpan.textContent = original;
      submitBtn?.classList.remove('btn-success');
    }, 5000);
  });
};

const showFieldError = (input, msg) => {
  if (!input) return;
  input.setAttribute('aria-invalid', 'true');
  input.style.borderColor = '#e05252';

  const err = document.createElement('span');
  err.className    = 'field-error';
  err.textContent  = msg;
  err.style.cssText = `
    display: block;
    font-size: 0.75rem;
    color: #e05252;
    margin-top: 0.35rem;
    margin-left: 1rem;
  `;
  err.setAttribute('role', 'alert');
  input.parentNode?.appendChild(err);
};

const clearErrors = (form) => {
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('[aria-invalid]').forEach(el => {
    el.removeAttribute('aria-invalid');
    el.style.borderColor = '';
  });
};

const simulateSubmit = (data) => {
  console.info('Dados do formulário:', data);
  return new Promise(resolve => setTimeout(resolve, 1500));
};

/* ----------------------------------------------------------------
   13. SMOOTH SCROLL
---------------------------------------------------------------- */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
        10
      ) || 80;

      const top = target.getBoundingClientRect().top + window.scrollY - headerH;

      window.scrollTo({
        top,
        behavior: STATE.reducedMotion ? 'auto' : 'smooth',
      });

      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    });
  });
};

/* ----------------------------------------------------------------
   14. FOOTER
---------------------------------------------------------------- */
const initFooterYear = () => {
  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

/* ----------------------------------------------------------------
   15. VIDEO TESTIMONY PLACEHOLDER
---------------------------------------------------------------- */
const initVideoTestimonials = () => {
  const cards = $$('.video-testimony-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const name = card.querySelector('.video-testimony-name')?.textContent || 'paciente';
      announceToSR(`Reproduzindo depoimento de ${name}`);
      showVideoPlaceholder(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
};

const showVideoPlaceholder = (card) => {
  const existing = card.querySelector('.video-placeholder-msg');
  if (existing) { existing.remove(); return; }

  const msg = document.createElement('div');
  msg.className = 'video-placeholder-msg';
  msg.textContent = '▶ Vídeo em breve';
  msg.style.cssText = `
    position: absolute;
    inset: 0;
    background: rgba(200,155,123,0.9);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    border-radius: inherit;
    z-index: 5;
    cursor: pointer;
  `;

  const thumb = card.querySelector('.video-testimony-thumb');
  if (thumb) {
    thumb.style.position = 'relative';
    thumb.appendChild(msg);
  }

  msg.addEventListener('click', () => msg.remove());
  setTimeout(() => msg?.remove(), 3000);
};

/* ----------------------------------------------------------------
   16. HERO VIDEO
---------------------------------------------------------------- */
const initHeroVideo = () => {
  const video = $('.hero-video');
  if (!video) return;

  const source = video.querySelector('source[src]:not([src=""])');
  if (!source) return;

  video.play().catch(() => {});

  video.addEventListener('loadeddata', () => {
    video.style.scale = '1';
  });
};

/* ----------------------------------------------------------------
   INIT
---------------------------------------------------------------- */
const init = () => {
  removePreload();
  initHeader();
  initParallax();
  initScrollAnimations();
  initCounters();
  initBeforeAfter();
  initGallery();
  initFAQ();
  initA11yToolbar();
  initForm();
  initSmoothScroll();
  initFooterYear();
  initVideoTestimonials();
  initHeroVideo();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
