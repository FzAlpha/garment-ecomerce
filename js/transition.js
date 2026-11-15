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

  /* ---------- First visit loader ---------- */
  function loader() {
    return new Promise((resolve) => {
      const el = document.querySelector('[data-loader]');
      if (!el) return resolve();
      if (reduce) { el.remove(); return resolve(); }

      const letters = el.querySelectorAll('[data-loader-mark] span');
      const count = el.querySelector('[data-loader-count]');
      const bar = el.querySelector('[data-loader-bar]');
      const quick = seen();
      const total = quick ? 0.9 : 2.2;
      const counter = { v: 0 };

      // Make sure the hero image has a head start before we lift the curtain.
      const heroImg = document.querySelector('[data-hero-media] img');
      const imgReady = new Promise((r) => {
        if (!heroImg || heroImg.complete) return r();
        heroImg.addEventListener('load', r, { once: true });
        heroImg.addEventListener('error', r, { once: true });
        setTimeout(r, 3500);
      });

      // Letters sit below their mask (CSS); y:0 clears the parsed CSS offset.
      gsap.set(letters, { y: 0, yPercent: 105 });

      const tl = gsap.timeline();
      tl.to(letters, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0.15)
        .to(counter, {
          v: 100,
          duration: total,
          ease: 'power2.inOut',
          onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
        }, 0)
        .to(bar, { scaleX: 1, duration: total, ease: 'power2.inOut' }, 0);

      Promise.all([imgReady, tl.then()]).then(() => {
        markSeen();
        gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
        gsap.timeline({ onComplete: () => el.remove() })
          .to(letters, { yPercent: -105, duration: 0.7, ease: 'power3.in', stagger: 0.03 }, 0)
          .to(count, { autoAlpha: 0, duration: 0.4 }, 0)
          .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: EASE }, 0.45)
          .call(resolve, null, 0.85);
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
