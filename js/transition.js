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
     focus   : letters rise out of a blur while the word draws its spacing in
     load    : a hairline tracks the hero image (and fonts) loading
     aperture: the word drifts away, a small rounded window opens onto the
               hero photograph, then widens to the full screen
     handover: the window ends at exactly the hero's starting scale, so the
               loader is removed without a seam and the hero intro continues */
  function loader() {
    return new Promise((resolve) => {
      const el = document.querySelector('[data-loader]');
      if (!el) return resolve();
      if (reduce) { el.remove(); return resolve(); }

      const mark = el.querySelector('[data-loader-mark]');
      const letters = mark.querySelectorAll('span');
      const line = el.querySelector('[data-loader-line]');
      const win = el.querySelector('[data-loader-window]');
      const img = el.querySelector('[data-loader-img]');
      const quick = seen();

      const heroImg = document.querySelector('[data-hero-media] img');
      if (heroImg) img.src = heroImg.currentSrc || heroImg.src;
      const loaded = (im) => new Promise((r) => {
        if (!im || (im.complete && im.naturalWidth)) return r();
        im.addEventListener('load', r, { once: true });
        im.addEventListener('error', r, { once: true });
      });
      const ready = Promise.race([
        Promise.all([loaded(heroImg), loaded(img), document.fonts ? document.fonts.ready : null]),
        new Promise((r) => setTimeout(r, 4000)),
      ]);

      // Aperture geometry in px, so every clip-path value interpolates cleanly
      const vw = window.innerWidth, vh = window.innerHeight;
      const aw = Math.min(Math.max(vw * 0.2, 150), 300), ah = Math.min(aw * 1.32, vh * 0.62);
      const ix = (vw - aw) / 2, iy = (vh - ah) / 2;
      const clip = (t, r, b, l, rad) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;

      gsap.set(win, { clipPath: clip(vh / 2, vw / 2, vh / 2, vw / 2, 18) });
      gsap.set(img, { scale: 1.75 });
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
        gsap.timeline({ onComplete: () => { el.remove(); resolve(); } })
          // finish the hairline, then let it retract to the right
          .to(line, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, 0)
          .set(line, { transformOrigin: '100% 50%' }, 0.4)
          .to(line, { scaleX: 0, duration: 0.55, ease: 'power3.in' }, 0.4)
          // the word drifts up and dissolves from its edges inwards
          .to(letters, {
            opacity: 0, yPercent: -28, filter: 'blur(10px)',
            duration: 0.8, ease: 'power3.in',
            stagger: { each: 0.04, from: 'edges' },
          }, 0.45)
          // a small portrait window opens onto the photograph…
          // (explicit four-value from/to: the browser hands back a shortened
          //  inset() that GSAP would otherwise pair up asymmetrically)
          .fromTo(win, { clipPath: clip(vh / 2, vw / 2, vh / 2, vw / 2, 18) },
            { clipPath: clip(iy, ix, iy, ix, 18), duration: 1.1, ease: 'expo.out', immediateRender: false }, 1.05)
          .to(img, { scale: 1.5, duration: 1.1, ease: 'expo.out' }, 1.05)
          // …then widens to the full screen, landing on the hero's start scale
          .fromTo(win, { clipPath: clip(iy, ix, iy, ix, 18) },
            { clipPath: clip(0, 0, 0, 0, 0), duration: 1.35, ease: 'power4.inOut', immediateRender: false }, 1.7)
          .to(img, { scale: 1.3, duration: 1.35, ease: 'power4.inOut' }, 1.7);
      });
    });
  }

  /* ---------- Intro: decide between loader and reveal ---------- */
  function intro() {
    if (root.classList.contains('veil-in')) return reveal();
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
