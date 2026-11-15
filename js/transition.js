/* ==========================================================================
   Veil — page transitions for a multi-page site.

   Modelled on routeveil's "columns" overlay (cover → between → navigate →
   reveal), re-implemented with GSAP because routeveil itself is a React Router
   engine and these are plain HTML pages.

   cover    : five ink columns grow up from the bottom, staggered
   between  : the destination's name rises in the centre
   navigate : browser loads the next page (flag kept in sessionStorage)
   reveal   : on the new page the columns retract upwards, staggered
   ========================================================================== */
const Veil = (() => {
  const root = document.documentElement;
  const veil = document.querySelector('[data-veil]');
  const cols = veil ? [...veil.querySelectorAll('.veil__col')] : [];
  const text = veil ? veil.querySelector('[data-veil-text]') : null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'power4.inOut';
  let busy = false;

  const store = (label) => { try { sessionStorage.setItem('veil', label || ' '); } catch (e) {} };
  const take = () => {
    try { const v = sessionStorage.getItem('veil'); sessionStorage.removeItem('veil'); return v; } catch (e) { return null; }
  };
  const seen = () => { try { return sessionStorage.getItem('seen') === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem('seen', '1'); } catch (e) {} };

  /* ---------- Reveal (incoming page) ---------- */
  function reveal() {
    return new Promise((resolve) => {
      const label = take();
      if (text) text.textContent = (label || '').trim();

      if (reduce) {
        root.classList.remove('veil-in');
        gsap.set(cols, { scaleY: 0 });
        return resolve();
      }

      gsap.set(cols, { scaleY: 1, transformOrigin: '50% 0%' });
      gsap.set(text, { yPercent: 0, y: 0 });
      root.classList.remove('veil-in');
      veil.style.pointerEvents = 'all';

      const tl = gsap.timeline({
        onComplete: () => { veil.style.pointerEvents = ''; },
      });
      tl.to(text, { yPercent: -110, duration: 0.6, ease: 'power3.in' }, 0.05)
        .to(cols, {
          scaleY: 0,
          duration: 0.95,
          ease: EASE,
          stagger: { each: 0.06, from: 'start' },
        }, 0.3)
        .call(resolve, null, 0.55);
    });
  }

  /* ---------- First visit loader ----------
     focus  : letters rise out of a blur while the word draws its spacing in
     load   : a hairline tracks the hero image (and fonts) loading
     cut    : the ink drains from the letters, which turn out to be holes in
              an ivory sheet with the real hero page behind it
     zoom   : the camera flies into the thickest stroke of the word until the
              hole is larger than the screen and the sheet is gone */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  // The ivory sheet, drawn in SVG so the word can later be cut out of it.
  // Its glow matches the CSS background it replaces exactly.
  function sheet(el) {
    const vw = window.innerWidth, vh = window.innerHeight, vmax = Math.max(vw, vh);
    const css = getComputedStyle(document.documentElement);
    const cx = vw / 2, cy = vh * 0.56, rx = vmax * 0.6, ry = vmax * 0.46;
    const root = svg('svg', { class: 'loader__cut', viewBox: `0 0 ${vw} ${vh}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const defs = svg('defs');
    const glow = svg('radialGradient', {
      id: 'loader-glow', gradientUnits: 'userSpaceOnUse', cx, cy, r: rx,
      gradientTransform: `translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})`,
    });
    glow.append(svg('stop', { offset: 0, 'stop-color': 'rgb(236,178,120)', 'stop-opacity': 0.3 }),
                svg('stop', { offset: 0.7, 'stop-color': 'rgb(236,178,120)', 'stop-opacity': 0 }));
    const mask = svg('mask', { id: 'loader-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: vw, height: vh });
    const word = svg('g', { opacity: 0 }); // no holes until the ink drains
    mask.append(svg('rect', { width: vw, height: vh, fill: '#fff' }), word);
    defs.append(glow, mask);
    const paper = svg('g', { mask: 'url(#loader-mask)' });
    paper.append(svg('rect', { width: vw, height: vh, fill: css.getPropertyValue('--paper').trim() || '#f8f1e7' }),
                 svg('rect', { width: vw, height: vh, fill: 'url(#loader-glow)' }));
    root.append(defs, paper);
    el.prepend(root);
    el.style.background = 'transparent';
    return { root, word, vw, vh };
  }

  // Copy the settled HTML letters into the mask, glyph for glyph, and find
  // the deepest point inside a stroke near the middle of the word to fly into.
  function cut(s, letters) {
    const cs = getComputedStyle(letters[0]);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const glyphs = letters.map((el) => {
      const r = el.getBoundingClientRect();
      const probe = document.createElement('i'); // zero-size box sitting on the baseline
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.appendChild(probe);
      const base = probe.getBoundingClientRect().top;
      probe.remove();
      x0 = Math.min(x0, r.left); x1 = Math.max(x1, r.right); y0 = Math.min(y0, r.top); y1 = Math.max(y1, r.bottom);
      return { ch: el.textContent, x: r.left, y: base };
    });
    glyphs.forEach((g) => {
      const t = svg('text', { x: g.x, y: g.y, fill: '#000' });
      t.setAttribute('style', `font:${font};letter-spacing:0`);
      t.textContent = g.ch;
      s.word.append(t);
    });

    // Rasterise the word once and look for the widest point inside a stroke
    const c = document.createElement('canvas');
    c.width = s.vw; c.height = s.vh;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = font;
    glyphs.forEach((g) => ctx.fillText(g.ch, g.x, g.y));
    const L = Math.max(0, Math.floor(x0)), T = Math.max(0, Math.floor(y0));
    const W = Math.min(s.vw, Math.ceil(x1)) - L, H = Math.min(s.vh, Math.ceil(y1)) - T;
    const px = W > 0 && H > 0 ? ctx.getImageData(L, T, W, H).data : null;
    const inside = (x, y) => {
      x = Math.round(x - L); y = Math.round(y - T);
      return x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 140;
    };
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, half = Math.max((x1 - x0) / 2, 1);
    let best = { x: mx, y: my, d: 1.5, score: -1 };
    if (px) {
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          if (!inside(x, y)) continue;
          let d = 1;
          grow: for (; d < 60; d++) {
            for (let a = 0; a < 16; a++) {
              const ang = (a / 16) * Math.PI * 2;
              if (!inside(x + Math.cos(ang) * d, y + Math.sin(ang) * d)) break grow;
            }
          }
          const score = d * (1 - 0.4 * Math.min(Math.hypot(x - mx, y - my) / half, 1));
          if (score > best.score) best = { x, y, d: Math.max(d - 1, 1.5), score };
        }
      }
    }
    // Scale at which the stroke's inscribed circle covers the whole screen
    const scale = Math.min(600, (Math.hypot(s.vw, s.vh) / 2 / best.d) * 1.25);
    gsap.set(s.word, { svgOrigin: `${best.x} ${best.y}` });
    return { x: best.x, y: best.y, dx: s.vw / 2 - best.x, dy: s.vh / 2 - best.y, scale };
  }

  function loader() {
    return new Promise((resolve) => {
      const el = document.querySelector('[data-loader]');
      if (!el) return resolve();
      if (reduce) { el.remove(); return resolve(); }

      const mark = el.querySelector('[data-loader-mark]');
      const letters = [...mark.querySelectorAll('span')];
      const line = el.querySelector('[data-loader-line]');
      const quick = seen();
      const s = sheet(el);

      const heroImg = document.querySelector('[data-hero-media] img');
      const loaded = (im) => new Promise((r) => {
        if (!im || (im.complete && im.naturalWidth)) return r();
        im.addEventListener('load', r, { once: true });
        im.addEventListener('error', r, { once: true });
      });
      const ready = Promise.race([
        Promise.all([loaded(heroImg), document.fonts ? document.fonts.ready : null]),
        new Promise((r) => setTimeout(r, 4000)),
      ]);

      gsap.set(letters, { opacity: 0, yPercent: 35, filter: 'blur(14px)' });
      gsap.set(mark, { letterSpacing: '0.34em' });

      const k = quick ? 0.55 : 1;
      const focus = gsap.timeline()
        .to(mark, { letterSpacing: '-0.01em', duration: 2.4 * k, ease: 'expo.out' }, 0)
        .to(letters, {
          opacity: 1, yPercent: 0, filter: 'blur(0px)',
          duration: 1.7 * k, ease: 'power3.out',
          stagger: { each: 0.085 * k, from: 'center' },
        }, 0.1)
        .to(line, { scaleX: 0.82, duration: 1.9 * k, ease: 'power2.inOut' }, 0.35);

      Promise.all([ready, focus.then()]).then(() => {
        markSeen();
        gsap.set(letters, { clearProps: 'filter' });
        const z = cut(s, letters);
        const zoom = { v: 0 }; // log of the scale, so the flight feels even
        let handed = false;
        const handover = () => { if (!handed) { handed = true; resolve(); } };

        gsap.timeline({ onComplete: () => { el.remove(); handover(); } })
          // finish the hairline, then let it retract to the right
          .to(line, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, 0)
          .set(line, { transformOrigin: '100% 50%' }, 0.4)
          .to(line, { scaleX: 0, duration: 0.55, ease: 'power3.in' }, 0.4)
          // the ink drains out: each letter becomes a window onto the hero
          .set(s.word, { attr: { opacity: 1 } }, 0.7)
          .to(letters, { opacity: 0, duration: 0.9, ease: 'power2.inOut', stagger: { each: 0.07, from: 'center' } }, 0.7)
          // drift the chosen stroke to the centre while flying into it
          .to(s.word, { x: z.dx, y: z.dy, duration: 1.8, ease: 'power3.inOut' }, 1.95)
          .to(zoom, {
            v: Math.log(z.scale), duration: 1.8, ease: 'power3.in',
            onUpdate: () => gsap.set(s.word, { scale: Math.exp(zoom.v) }),
          }, 1.95)
          // the hero settles from its starting scale as the sheet tears open
          .call(handover, null, 2.75)
          .to(s.root, { opacity: 0, duration: 0.35, ease: 'none' }, 3.45);
      });
    });
  }

  /* ---------- Intro: decide between loader and reveal ---------- */
  function intro() {
    if (root.classList.contains('veil-in')) {
      // Arriving through the veil: the loader is never played, and must go
      // before veil-in is lifted or its ivory sheet would cover the page.
      document.querySelector('[data-loader]')?.remove();
      return reveal();
    }
    return loader();
  }

  /* ---------- Cover (outgoing page) ---------- */
  function go(href, label) {
    if (busy) return;
    busy = true;
    if (window.lenis) window.lenis.stop();

    if (reduce || !veil) { store(label); window.location.href = href; return; }

    if (text) text.textContent = label || '';
    veil.style.pointerEvents = 'all';
    gsap.set(cols, { transformOrigin: '50% 100%' });

    gsap.timeline({
      onComplete: () => { store(label); window.location.href = href; },
    })
      .fromTo(cols, { scaleY: 0 }, {
        scaleY: 1,
        duration: 0.85,
        ease: EASE,
        stagger: { each: 0.06, from: 'end' },
      })
      .fromTo(text, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0.5)
      .to({}, { duration: 0.25 }); // "between" hold
  }

  /* ---------- Link interception ---------- */
  const NAMES = { 'index.html': 'Vérane', '': 'Vérane', 'collection.html': 'Collection', 'atelier.html': 'Atelier', 'product.html': 'Product' };

  function shouldHandle(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download') || a.dataset.noVeil !== undefined) return false;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (!/(\.html|\/)$/.test(url.pathname)) return false;
    return url;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    const url = shouldHandle(a, e);
    if (!url) return;

    const here = new URL(window.location.href);
    const samePage = url.pathname === here.pathname && url.search === here.search;
    if (samePage) {
      e.preventDefault();
      const target = url.hash ? document.querySelector(url.hash) : null;
      if (window.lenis) window.lenis.scrollTo(target || 0, { duration: 1.6 });
      else (target || document.body).scrollIntoView({ behavior: 'smooth' });
      return;
    }

    e.preventDefault();
    const file = url.pathname.split('/').pop();
    go(url.href, a.dataset.label || NAMES[file] || 'Vérane');
  });

  // Restore a usable page when coming back via the bfcache.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    busy = false;
    root.classList.remove('veil-in');
    gsap.set(cols, { scaleY: 0 });
    if (veil) veil.style.pointerEvents = '';
    if (window.lenis) window.lenis.start();
  });

  return { intro, go };
})();
