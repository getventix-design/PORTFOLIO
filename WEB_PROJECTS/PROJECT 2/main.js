/* ==========================================================================
   Al-Kwait Jewellers — main.js
   Shared behaviour: theme, navigation, scroll reveal, parallax, filters,
   product gallery, lightbox, form, page transitions.
   All motion is rAF-batched and respects prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- theme */
  (function theme() {
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    let mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // Persist across in-session navigation without localStorage (sandbox-safe).
    const fromUrl = new URLSearchParams(location.search).get('theme');
    if (fromUrl === 'dark' || fromUrl === 'light') mode = fromUrl;

    const sun =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6"/></svg>';
    const moon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.5 14.2A8.6 8.6 0 1 1 10.3 3.6a6.8 6.8 0 0 0 10.2 10.6z"/></svg>';

    function apply() {
      root.setAttribute('data-theme', mode);
      toggles.forEach((t) => {
        t.innerHTML = mode === 'dark' ? sun : moon;
        t.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' appearance');
      });
      // carry the choice on internal links
      document.querySelectorAll('a[data-page-link]').forEach((a) => {
        const u = new URL(a.getAttribute('href'), location.href);
        u.searchParams.set('theme', mode);
        a.dataset.href = u.pathname.split('/').pop() + u.search;
      });
    }
    apply();
    toggles.forEach((t) =>
      t.addEventListener('click', () => {
        mode = mode === 'dark' ? 'light' : 'dark';
        apply();
      })
    );
  })();

  /* ------------------------------------------------------- loading curtain */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => body.classList.add('is-ready'));
  });
  // Safety net if load fires before script or assets stall
  setTimeout(() => body.classList.add('is-ready'), 2600);

  /* ------------------------------------------------ soft page transitions */
  document.querySelectorAll('a[data-page-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.dataset.href || a.getAttribute('href');
      if (!href || href.startsWith('#') || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      body.classList.remove('menu-open');
      if (reduced) {
        location.href = href;
        return;
      }
      body.classList.add('is-leaving');
      setTimeout(() => (location.href = href), 250);
    });
  });

  /* --------------------------------------------------------------- header */
  (function header() {
    const header = document.querySelector('.header');
    if (!header) return;
    let last = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      header.classList.toggle('is-stuck', y > 24);
      if (!body.classList.contains('menu-open')) {
        header.classList.toggle('is-hidden', y > 420 && y > last + 4);
      }
      last = y;
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  })();

  /* ------------------------------------------------------- mobile drawer */
  (function drawer() {
    const burger = document.querySelector('.burger');
    const panel = document.querySelector('.drawer');
    if (!burger || !panel) return;

    function setOpen(open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', () => setOpen(!body.classList.contains('menu-open')));
    panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && body.classList.contains('menu-open')) setOpen(false);
    });
    setOpen(false);
  })();

  /* ----------------------------------------------------- reading progress */
  (function progress() {
    const bar = document.querySelector('.progress');
    if (!bar) return;
    let ticking = false;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--sp', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  })();

  /* --------------------------------------------------------- text reveals */
  (function splitText() {
    let i = 0;

    function wrapTextNode(node) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
          return;
        }
        const outer = document.createElement('span');
        outer.className = 'tr-word';
        outer.style.setProperty('--wi', i++);
        const inner = document.createElement('span');
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    }

    function walk(el) {
      // snapshot: we mutate as we go
      Array.from(el.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          if (n.textContent.trim()) wrapTextNode(n);
        } else if (n.nodeType === 1 && !n.classList.contains('tr-word')) {
          walk(n);
        }
      });
    }

    document.querySelectorAll('[data-split]').forEach((el) => {
      i = 0;
      walk(el);
    });
  })();

  /* --------------------------------------------------------- scroll reveal */
  (function reveals() {
    const targets = document.querySelectorAll('.reveal, .reveal-mask, .figure, [data-split]');
    if (!targets.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    targets.forEach((t) => io.observe(t));

    // Safety net: anything already inside the viewport that the observer
    // somehow missed is revealed anyway, so content can never be stranded.
    function sweep() {
      const vh = window.innerHeight;
      targets.forEach((t) => {
        if (t.classList.contains('is-in')) return;
        const r = t.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > 0) {
          t.classList.add('is-in');
          io.unobserve(t);
        }
      });
    }
    window.addEventListener('load', () => setTimeout(sweep, 900));
    setTimeout(sweep, 3200);
  })();

  /* ------------------------------------------------------------- parallax */
  (function parallax() {
    const items = document.querySelectorAll('[data-parallax]');
    if (!items.length || reduced) return;
    let ticking = false;
    function update() {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const host = el.closest('[data-parallax-host]') || el.parentElement;
        const r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
        const depth = parseFloat(el.dataset.parallax) || 12;
        el.style.transform = 'translate3d(0,' + (progress * depth).toFixed(2) + '%,0)';
      });
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    update();
  })();

  /* --------------------------------------------------- collection filters */
  (function filters() {
    const bar = document.querySelector('[data-filters]');
    const grid = document.querySelector('[data-products]');
    if (!bar || !grid) return;
    const cards = Array.from(grid.children);
    const empty = document.querySelector('.empty');
    const count = document.querySelector('[data-count]');

    function setCount(n) {
      if (count) count.textContent = n + (n === 1 ? ' piece' : ' pieces');
    }

    function run(cat) {
      let shown = 0;
      cards.forEach((c) => c.classList.add('is-filtering'));
      setTimeout(() => {
        cards.forEach((c) => {
          const match = cat === 'all' || c.dataset.category === cat;
          c.classList.toggle('is-hidden', !match);
          if (match) shown++;
        });
        setCount(shown);
        if (empty) empty.classList.toggle('is-shown', shown === 0);
        requestAnimationFrame(() =>
          cards.forEach((c, i) => {
            setTimeout(() => c.classList.remove('is-filtering'), i * 28);
          })
        );
      }, reduced ? 0 : 220);
    }

    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      bar.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      run(chip.dataset.filter);
    });
    setCount(cards.length);
  })();

  /* ---------------------------------------------------- product gallery */
  (function productGallery() {
    const main = document.querySelector('[data-gallery-main]');
    const thumbs = document.querySelectorAll('[data-gallery-thumb]');
    if (!main || !thumbs.length) return;
    const img = main.querySelector('img');

    thumbs.forEach((t) => {
      t.addEventListener('click', () => {
        const src = t.dataset.src;
        const alt = t.dataset.alt || '';
        if (img.getAttribute('src') === src) return;
        thumbs.forEach((x) => x.setAttribute('aria-selected', 'false'));
        t.setAttribute('aria-selected', 'true');
        main.classList.add('is-swapping');
        setTimeout(
          () => {
            img.src = src;
            img.alt = alt;
            main.classList.remove('is-swapping');
          },
          reduced ? 0 : 260
        );
      });
    });
  })();

  /* --------------------------------------------------------- lightbox */
  (function lightbox() {
    const box = document.querySelector('.lightbox');
    const tiles = Array.from(document.querySelectorAll('[data-lightbox]'));
    if (!box || !tiles.length) return;

    const shot = box.querySelector('img');
    const cap = box.querySelector('.lightbox__cap');
    let index = 0;
    let lastFocus = null;

    function show(i) {
      index = (i + tiles.length) % tiles.length;
      const tile = tiles[index];
      shot.src = tile.dataset.lightbox;
      shot.alt = tile.dataset.caption || '';
      cap.textContent = tile.dataset.caption || '';
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add('is-open');
      body.style.overflow = 'hidden';
      box.querySelector('.lightbox__close').focus();
    }
    function close() {
      box.classList.remove('is-open');
      body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    tiles.forEach((t, i) => t.addEventListener('click', () => open(i)));
    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lightbox__nav--next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => {
      if (e.target === box) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  })();

  /* ------------------------------------------------------------ counters */
  (function counters() {
    const nums = document.querySelectorAll('[data-count-to]');
    if (!nums.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      nums.forEach((n) => (n.textContent = n.dataset.countTo + (n.dataset.suffix || '')));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          const to = parseFloat(el.dataset.countTo);
          const suffix = el.dataset.suffix || '';
          const dur = 1100;
          const start = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(to * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    nums.forEach((n) => io.observe(n));
  })();

  /* ---------------------------------------------------------- enquiry form */
  (function form() {
    const f = document.querySelector('[data-enquiry]');
    if (!f) return;
    const ok = f.querySelector('.form__ok');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
      const name = (f.querySelector('#name') || {}).value || '';
      if (ok) {
        ok.textContent =
          'Thank you' +
          (name ? ', ' + name.split(' ')[0] : '') +
          '. Your enquiry has been noted — our team will respond within one working day.';
        ok.classList.add('is-shown');
      }
      f.reset();
    });
  })();

  /* ------------------------------------------------- current year in footer */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
