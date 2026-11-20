/* ==========================================================================
   Al-Kwait Jewellers — hero.js
   Cinematic scroll-driven hero choreography.
   A single rAF loop reads scroll once and writes only transforms/opacity,
   so the sequence stays composited and smooth on desktop, tablet and mobile.
   ========================================================================== */

(function () {
  'use strict';

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const stage = hero.querySelector('.hero__stage');
  const copy = hero.querySelector('.hero__copy');
  const plate = hero.querySelector('.hero__plate');
  const beat = hero.querySelector('.hero__beat');
  const floats = Array.from(hero.querySelectorAll('.hero__float'));
  const beam = hero.querySelector('.hero__beam');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ golden light particles */
  (function sparks() {
    const field = hero.querySelector('.hero__particles');
    if (!field || reduced) return;
    const count = window.innerWidth < 720 ? 14 : 26;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const size = (Math.random() * 2.6 + 1.4).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (60 + Math.random() * 55).toFixed(2) + '%';
      s.style.setProperty('--dur', (13 + Math.random() * 16).toFixed(1) + 's');
      s.style.setProperty('--delay', (-Math.random() * 22).toFixed(1) + 's');
      s.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      s.style.opacity = 0;
      frag.appendChild(s);
    }
    field.appendChild(frag);
  })();

  /* --------------------------------------------------------- entrance beat */
  requestAnimationFrame(() => hero.classList.add('is-live'));

  if (reduced) {
    if (plate) plate.style.opacity = 1;
    return;
  }

  /* ------------------------------------------------------- scroll timeline */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // eased sub-range helper: maps p within [from, to] to 0..1
  const seg = (p, from, to) => clamp((p - from) / (to - from), 0, 1);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  let target = 0;
  let smooth = 0;
  let raf = null;

  function measure() {
    const rect = hero.getBoundingClientRect();
    const runway = hero.offsetHeight - window.innerHeight;
    target = runway > 0 ? clamp(-rect.top / runway, 0, 1) : 0;
    if (!raf) raf = requestAnimationFrame(render);
  }

  function render() {
    // light inertia so the sequence feels cinematic rather than twitchy
    smooth += (target - smooth) * 0.14;
    if (Math.abs(target - smooth) < 0.0004) smooth = target;

    const p = smooth;
    const vw = window.innerWidth;
    const mobile = vw < 720;

    stage.style.setProperty('--hp', p.toFixed(4));

    /* Headline: drifts upward and dissolves through the first beat */
    if (copy) {
      const a = seg(p, 0, 0.42);
      const ea = easeOut(a);
      copy.style.transform =
        'translate3d(0,' + (-ea * (mobile ? 90 : 140)).toFixed(2) + 'px,0) scale(' + (1 - a * 0.06).toFixed(4) + ')';
      copy.style.opacity = (1 - seg(p, 0.06, 0.4)).toFixed(3);
      copy.style.filter = 'blur(' + (a * 3).toFixed(2) + 'px)';
      copy.style.pointerEvents = a > 0.6 ? 'none' : 'auto';
    }

    /* Hero plate: rises, scales up and squares off — becomes the subject */
    if (plate) {
      const b = easeOut(seg(p, 0, 0.62));
      const scale = 0.74 + b * 0.34;
      const y = (mobile ? 90 : 130) - b * (mobile ? 130 : 190);
      const rot = -5 + b * 5;
      const radius = 300 - b * 288;
      plate.style.transform =
        'translate3d(-50%, calc(-50% + ' + y.toFixed(2) + 'px), 0) scale(' + scale.toFixed(4) + ') rotate(' + rot.toFixed(2) + 'deg)';
      plate.style.opacity = (0.2 + b * 0.8).toFixed(3);
      plate.style.borderRadius = radius.toFixed(1) + 'px ' + radius.toFixed(1) + 'px 8px 8px';

      /* final beat: gently recede so the next section can take over */
      const out = seg(p, 0.82, 1);
      if (out > 0) {
        plate.style.opacity = (1 - out * 0.65).toFixed(3);
        plate.style.transform =
          'translate3d(-50%, calc(-50% + ' +
          (y - out * 70).toFixed(2) +
          'px), 0) scale(' +
          (scale - out * 0.06).toFixed(4) +
          ') rotate(0deg)';
      }
    }

    /* Floating pieces: layered depth, each on its own drift and spin */
    floats.forEach((el, i) => {
      const depth = parseFloat(el.dataset.depth) || 1;
      const dir = i % 2 === 0 ? 1 : -1;
      const y = -p * 260 * depth;
      const x = dir * p * 70 * depth;
      const rot = dir * p * 26 * depth;
      const sc = 1 + p * 0.22 * depth;
      el.style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      el.style.opacity = (0.9 - seg(p, 0.62, 0.95) * 0.9).toFixed(3);
    });

    /* Light beam breathes wider as the scene opens up */
    if (beam) {
      beam.style.transform =
        'translateX(-50%) rotate(' + (-14 + p * 8).toFixed(2) + 'deg) scale(' + (1 + p * 0.22).toFixed(3) + ')';
    }

    /* Second-beat brand line */
    if (beat) {
      const inP = seg(p, 0.46, 0.66);
      const outP = seg(p, 0.86, 1);
      beat.style.opacity = (easeOut(inP) * (1 - outP)).toFixed(3);
      beat.style.transform =
        'translate3d(-50%,' + ((1 - easeOut(inP)) * 26).toFixed(2) + 'px,0)';
    }

    if (smooth !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = null;
    }
  }

  window.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('resize', measure);
  measure();
  // keep the loop alive briefly so the intro settles
  raf = requestAnimationFrame(render);
})();
