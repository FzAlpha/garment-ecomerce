/* ==========================================================================
   Vérane — interactions & motion
   GSAP (ScrollTrigger, SplitText, Flip) + Lenis smooth scroll
   ========================================================================== */
(() => {
  const plugins = [ScrollTrigger, SplitText];
  if (window.Flip) plugins.push(Flip);
  gsap.registerPlugin(...plugins);
  gsap.defaults({ ease: 'expo.out', duration: 1.2 });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------
     Smooth scroll — Lenis driven by GSAP's ticker
     ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // held until the intro finishes
  }
  window.lenis = lenis;

  /* ------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------ */
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  };

  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  };

  /* ------------------------------------------------------------------
     Paris clock
     ------------------------------------------------------------------ */
  const clock = $('[data-clock]');
  const tick = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date());
  };
  tick();
  setInterval(tick, 20000);

  /* ------------------------------------------------------------------
     Header — hide on scroll down, show on scroll up
     ------------------------------------------------------------------ */
  const header = $('[data-header]');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-hidden', self.direction === 1 && y > 240);
    },
  });

  // White header text while it sits over a dark, full-bleed image.
  const invertZones = [];
  const syncHeaderTone = () => header.classList.toggle('is-inverse', invertZones.some((st) => st.isActive));
  $$('[data-header-dark]').forEach((zone) => {
    invertZones.push(ScrollTrigger.create({
      trigger: zone,
      start: zone.dataset.headerDark || 'top top+=34',
      end: 'bottom top+=34',
      onToggle: syncHeaderTone,
    }));
  });
  syncHeaderTone();

  /* ------------------------------------------------------------------
     Menu
     ------------------------------------------------------------------ */
  const menu = $('[data-menu]');
  const menuLinks = $$('.menu__link', menu);
  const menuTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 })
    .fromTo(menuLinks, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }, 0.45)
    .fromTo($$('.menu__top, .menu__bottom', menu), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.6);

  const openMenu = () => { menu.setAttribute('aria-hidden', 'false'); lenis?.stop(); menuTl.timeScale(1).play(); };
  const closeMenu = () => {
    menu.setAttribute('aria-hidden', 'true');
    menuTl.timeScale(1.6).reverse();
    lenis?.start();
  };
  $$('[data-menu-open]').forEach((b) => b.addEventListener('click', openMenu));
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', closeMenu));

  /* ------------------------------------------------------------------
     Bag (cart) — persisted per visitor in localStorage
     ------------------------------------------------------------------ */
  const cart = $('[data-cart]');
  const cartPanel = $('.cart__panel', cart);
  const cartBackdrop = $('.cart__backdrop', cart);
  let bag = storage.get('verane-bag', []);

  const renderBag = () => {
    const items = bag
      .map((line) => ({ ...line, product: PRODUCTS.find((p) => p.slug === line.slug) }))
      .filter((l) => l.product);
    const count = items.reduce((n, l) => n + l.qty, 0);
    const total = items.reduce((n, l) => n + l.qty * l.product.price, 0);
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; });
    $('[data-cart-total]').textContent = formatPrice(total);
    $('[data-checkout]').disabled = count === 0;
    $('[data-cart-items]').innerHTML = items.length
      ? items.map((l, i) => `
        <div class="cart__item">
          <img src="${IMG(l.product.images[0], 300)}" alt="${l.product.name}">
          <div>
            <h4>${l.product.name}</h4>
            <p class="small muted">${l.product.colour} · ${l.size}${l.qty > 1 ? ` · ×${l.qty}` : ''}</p>
            <button class="cart__remove" data-remove="${i}">Remove</button>
          </div>
          <p class="small">${formatPrice(l.product.price * l.qty)}</p>
        </div>`).join('')
      : '<p class="cart__empty small">Your bag is empty.</p>';
  };

  const cartTl = gsap.timeline({ paused: true })
    .set(cart, { visibility: 'visible' })
    .to(cartBackdrop, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
    .to(cartPanel, { x: 0, xPercent: 0, duration: 0.9, ease: 'power4.inOut' }, 0);
  gsap.set(cartPanel, { x: 0, xPercent: 100 });

  const openCart = () => { cart.setAttribute('aria-hidden', 'false'); lenis?.stop(); cartTl.timeScale(1).play(); };
  const closeCart = () => { cart.setAttribute('aria-hidden', 'true'); cartTl.timeScale(1.4).reverse(); lenis?.start(); };

  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeCart));
  cart.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    bag.splice(Number(btn.dataset.remove), 1);
    storage.set('verane-bag', bag);
    renderBag();
  });
  $('[data-checkout]').addEventListener('click', () => toast('Checkout is not available in this preview.'));

  const addToBag = (slug, size) => {
    const existing = bag.find((l) => l.slug === slug && l.size === size);
    if (existing) existing.qty += 1;
    else bag.push({ slug, size, qty: 1 });
    storage.set('verane-bag', bag);
    renderBag();
    openCart();
  };
  renderBag();

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu.getAttribute('aria-hidden') === 'false') closeMenu();
    if (cart.getAttribute('aria-hidden') === 'false') closeCart();
  });

  /* ------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------ */
  if (finePointer) {
    const lens = $('[data-cursor-dot]');
    const label = $('[data-cursor-label]');
    label.innerHTML = '<span class="cursor-label__clip"><span class="cursor-label__text"></span></span>';
    const caption = $('.cursor-label__text', label);
    document.documentElement.classList.add('has-cursor');

    // One animated state drives both elements, rendered on GSAP's ticker:
    //   x/y follow the pointer with frame-rate-independent easing,
    //   sx/sy shape the lens, ls scales the image disc,
    //   p is press feedback, and st sets how much motion may stretch it.
    const S = { x: 0, y: 0, tx: 0, ty: 0, sx: 0.2, sy: 0.2, ls: 0, p: 1, st: 1 };
    const FOLLOW = reduce ? 1 : 0.17;
    let seen = false, vel = 0, angle = 0;

    gsap.ticker.add((time, dt) => {
      if (!seen) return;
      const f = Math.max(dt / 16.67, 0.25);
      const k = 1 - Math.pow(1 - FOLLOW, f);
      const mx = (S.tx - S.x) * k, my = (S.ty - S.y) * k;
      S.x += mx; S.y += my;
      const speed = Math.hypot(mx, my) / f;
      if (speed > 0.4) angle = Math.atan2(my, mx) * 57.2958;
      const target = reduce ? 0 : Math.min(speed / 45, 0.32) * S.st;
      vel += (target - vel) * 0.2;
      // Rotate into the direction of travel, stretch, rotate back,
      // so the stretch follows the path but the base shape never tilts.
      lens.style.transform =
        `translate3d(${S.x}px, ${S.y}px, 0) rotate(${angle}deg) scale(${1 + vel}, ${1 - vel * 0.45}) rotate(${-angle}deg) scale(${S.sx * S.p}, ${S.sy * S.p})`;
      label.style.transform = `translate3d(${S.x}px, ${S.y}px, 0) scale(${S.ls * S.p})`;
    });

    window.addEventListener('pointermove', (e) => {
      S.tx = e.clientX; S.ty = e.clientY;
      if (!seen) { // first move: appear under the pointer instead of flying in from 0,0
        seen = true;
        S.x = S.tx; S.y = S.ty;
        lens.classList.remove('is-hidden'); label.classList.remove('is-hidden');
      }
    }, { passive: true });

    const hide = (on) => [lens, label].forEach((el) => el.classList.toggle('is-hidden', on));
    document.documentElement.addEventListener('pointerleave', () => hide(true));
    document.documentElement.addEventListener('pointerenter', () => seen && hide(false));
    hide(true);

    window.addEventListener('pointerdown', () => gsap.to(S, { p: 0.72, duration: 0.3, ease: 'power3.out' }));
    window.addEventListener('pointerup', () => gsap.to(S, { p: 1, duration: 0.7, ease: 'elastic.out(1, 0.55)' }));

    const SHAPES = {
      '':    { sx: 0.2,  sy: 0.2,  ls: 0, st: 1 },    // 8px point
      link:  { sx: 1,    sy: 1,    ls: 0, st: 0.45 }, // 40px inverting disc
      text:  { sx: 0.03, sy: 0.58, ls: 0, st: 0 },    // hairline caret
      media: { sx: 0,    sy: 0,    ls: 1, st: 0 },    // gives way to the caption disc
    };
    const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable]';
    const LINK = 'a, button, label, select, summary, [role="button"], [data-filter]';
    let mode = null, word = '';
    const setMode = (next, text = '') => {
      if (next === mode && text === word) return;
      const wasMedia = mode === 'media';
      mode = next; word = text;
      gsap.to(S, { ...SHAPES[next], duration: next === 'media' || wasMedia ? 0.75 : 0.6, ease: 'expo.out', overwrite: 'auto' });
      if (next === 'media') {
        caption.textContent = text;
        gsap.fromTo(caption, { yPercent: 120 }, { yPercent: 0, duration: 0.8, delay: wasMedia ? 0 : 0.08, ease: 'expo.out', overwrite: true });
      }
    };
    const resolve = (el) => {
      if (!el || !el.closest) return setMode('');
      const media = el.closest('[data-cursor]');
      if (media) return setMode('media', media.dataset.cursor);
      if (el.closest(TEXT)) return setMode('text');
      if (el.closest(LINK)) return setMode('link');
      setMode('');
    };
    setMode('');
    document.addEventListener('pointerover', (e) => resolve(e.target));
    // Content can change under a still pointer (menus opening, filters re-rendering)
    document.addEventListener('click', () => requestAnimationFrame(() => resolve(document.elementFromPoint(S.tx, S.ty))));
  }

  /* ------------------------------------------------------------------
     Newsletter & back-to-top
     ------------------------------------------------------------------ */
  $$('[data-newsletter]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    toast('Thank you — you are on the list.');
  }));
  $$('[data-to-top]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  /* ==================================================================
     PAGE RENDERING (before any text is split)
     ================================================================== */
  const renderers = {
    home() {
      const picks = ['arles-wrap-coat', 'lune-tote', 'sable-knit', 'vesper-trench'];
      $('[data-home-products]').innerHTML = picks
        .map((slug) => PRODUCTS.find((p) => p.slug === slug))
        .map((p) => productCard(p, 0, 'data-fade'))
        .join('');
    },

    collection() {
      const grid = $('[data-collection]');
      const cards = PRODUCTS.map((p) => productCard(p));
      // Editorial tile woven into the grid after the 5th piece.
      cards.splice(5, 0, `
        <article class="card card--editorial" data-category="editorial">
          <a href="index.html" class="card__link" data-cursor="Lookbook" data-label="Vérane" style="height:100%">
            <div class="card__media">
              <img class="card__img" src="${IMG(PHOTOS.silhouette, 1600)}" alt="Editorial — silhouette in black" loading="lazy">
              <div class="card__overlay"><p class="h3">The <em>Ombre</em> edit</p></div>
            </div>
          </a>
        </article>`);
      grid.innerHTML = cards.join('');

    },

    product() {
      const slug = new URLSearchParams(window.location.search).get('p');
      const p = PRODUCTS.find((x) => x.slug === slug) || PRODUCTS[0];
      document.title = `${p.name} — Vérane`;

      $('[data-pdp-name]').textContent = p.name;
      $('[data-pdp-price]').textContent = formatPrice(p.price);
      $('[data-pdp-desc]').textContent = p.description;
      $('[data-pdp-material]').textContent = `${p.material}, in ${p.colour.toLowerCase()}`;

      $('[data-pdp-gallery]').innerHTML = `
        <div class="frame" data-reveal-img><img src="${IMG(p.images[0], 1800)}" alt="${p.name} — front"></div>
        <div class="pdp__gallery-pair">
          <div class="frame" data-reveal-img><img src="${IMG(p.images[1], 1000)}" alt="${p.name} — detail" loading="lazy"></div>
          <div class="frame" data-reveal-img><img src="${IMG(p.images[2], 1000)}" alt="${p.name} — styled" loading="lazy"></div>
        </div>`;

      const isBag = p.category === 'Leather goods';
      const sizes = isBag ? ['One size'] : ['XS', 'S', 'M', 'L', 'XL'];
      const soldOut = isBag ? -1 : (p.price % 3); // a deterministic sold-out size per piece
      const sizesEl = $('[data-sizes]');
      sizesEl.style.gridTemplateColumns = isBag ? '1fr' : '';
      sizesEl.innerHTML = sizes.map((s, i) => `<button class="size" data-size="${s}" ${i === soldOut ? 'data-soldout aria-disabled="true"' : ''}>${s}</button>`).join('');
      let selected = isBag ? 'One size' : null;
      if (isBag) { sizesEl.firstElementChild.classList.add('is-active'); $('[data-size-label]').textContent = selected; }

      sizesEl.addEventListener('click', (e) => {
        const b = e.target.closest('.size');
        if (!b || b.hasAttribute('data-soldout')) return;
        $$('.size', sizesEl).forEach((x) => x.classList.toggle('is-active', x === b));
        selected = b.dataset.size;
        $('[data-size-label]').textContent = selected;
      });
      $('[data-add]').addEventListener('click', () => {
        if (!selected) {
          toast('Please select a size.');
          gsap.fromTo(sizesEl, { x: -6 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
          return;
        }
        addToBag(p.slug, selected);
      });

      const related = [
        ...PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug),
        ...PRODUCTS.filter((x) => x.category !== p.category),
      ].slice(0, 4);
      $('[data-related]').innerHTML = related.map((x) => productCard(x, 0, 'data-fade')).join('');
    },
  };
  renderers[page]?.();

  /* ==================================================================
     MOTION
     ================================================================== */
  const splits = [];

  // Prepare split headings (hidden until revealed).
  const prepareSplits = () => {
    $$('[data-split]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
      gsap.set(split.lines, { yPercent: 110 });
      gsap.set(el, { autoAlpha: 1 });
      splits.push({ el, split });
    });
  };

  // Generic scroll reveals.
  const scrollReveals = () => {
    splits.forEach(({ el, split }) => {
      gsap.to(split.lines, {
        yPercent: 0,
        duration: 1.3,
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    $$('[data-fade]').forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1,
        y: 0,
        duration: 1.4,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    $$('[data-reveal-img]').forEach((el) => {
      const img = $('img', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut' })
        .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.9, ease: 'expo.out' }, 0.2);
    });

    $$('[data-parallax]').forEach((el) => {
      const img = $('img', el);
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const from = end > 1000 ? end - 60 : 0;
      const o = { v: from };
      gsap.to(o, {
        v: end,
        duration: 2.2,
        ease: 'power3.out',
        onUpdate: () => { el.textContent = Math.round(o.v); },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    // Footer wordmark rises letter by letter.
    const mark = $$('.footer__mark span');
    if (mark.length) {
      gsap.from(mark, {
        yPercent: 100,
        duration: 1.4,
        stagger: 0.06,
        scrollTrigger: { trigger: '.footer__mark', start: 'top 98%', once: true },
      });
    }
  };

  /* ---------- Page-specific motion ---------- */
  const motion = {
    home() {
      // Hero intro
      const title = $('[data-hero-title]');
      const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
      gsap.set(title, { autoAlpha: 1 });
      const img = $('[data-hero-media] img');

      const intro = gsap.timeline({ paused: true })
        .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
        .from(split.lines, { yPercent: 110, duration: 1.5, stagger: 0.12 }, 0.15)
        .from($$('[data-hero-fade]'), { autoAlpha: 0, y: 16, duration: 1.2, stagger: 0.1 }, 0.6);

      // Statement — words brighten as you read
      const words = $('[data-words]');
      const wsplit = SplitText.create(words, { type: 'words', wordsClass: 'word' });

      return () => {
        intro.play();

        // Hero parallax on scroll
        gsap.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } })
          .to('[data-hero-media]', { yPercent: 22, ease: 'none' }, 0)
          .to('.hero__content', { yPercent: -40, autoAlpha: 0, ease: 'none' }, 0);

        gsap.to(wsplit.words, {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: words, start: 'top 80%', end: 'bottom 50%', scrub: true },
        });

        // Lookbook — pinned horizontal scroll on larger screens
        const mm = gsap.matchMedia();
        mm.add('(min-width: 861px)', () => {
          const track = $('[data-lookbook-track]');
          const distance = () => track.scrollWidth - window.innerWidth;
          gsap.timeline({
            scrollTrigger: {
              trigger: '[data-lookbook]',
              start: 'top top',
              end: () => '+=' + distance(),
              pin: '.lookbook__pin',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
            .to(track, { x: () => -distance(), ease: 'none' }, 0)
            .fromTo('[data-lookbook-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
        });

        // Full-bleed clip-path reveal
        gsap.timeline({ scrollTrigger: { trigger: '[data-bleed]', start: 'top top', end: 'bottom bottom', scrub: true } })
          // Explicit four-value insets on both ends — the computed shorthand "inset(18% 26%)"
          // only has two values, which GSAP would otherwise pair up lopsidedly.
          .fromTo('[data-bleed-media]', { clipPath: 'inset(18% 26% 18% 26%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
          .fromTo('[data-bleed-media] img', { scale: 1.25 }, { scale: 1, ease: 'none' }, 0)
          .fromTo('[data-bleed-quote]', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.5 }, 0.45);
      };
    },

    collection() {
      const grid = $('[data-collection]');
      const cards = () => $$('.card', grid);

      // Filters with Flip
      $$('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
        $$('[data-filter]').forEach((b) => b.classList.toggle('is-active', b === btn));
        const cat = btn.dataset.filter;
        const state = Flip.getState(cards());
        cards().forEach((c) => {
          const show = cat === 'All' || c.dataset.category === cat;
          c.classList.toggle('is-hidden', !show);
        });
        Flip.from(state, {
          duration: 0.9,
          ease: 'power3.inOut',
          absolute: true,
          stagger: 0.03,
          onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.25 }),
          onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.4 }),
          onComplete: () => ScrollTrigger.refresh(),
        });
      }));

      // Cards fade up in batches as they enter
      gsap.set(cards(), { autoAlpha: 0, y: 40 });
      return () => {
        ScrollTrigger.batch(cards(), {
          start: 'top 92%',
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.08 }),
        });
      };
    },

    product() {
      // Accordion
      $$('.accordion__item').forEach((item) => {
        const btn = $('.accordion__btn', item);
        const panel = $('.accordion__panel', item);
        btn.addEventListener('click', () => {
          const open = item.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open);
          gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.7, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
        });
      });

      gsap.set('.pdp__info > *', { autoAlpha: 0, y: 24 });
      return () => {
        gsap.to('.pdp__info > *', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.06, delay: 0.1 });
      };
    },

    atelier() {
      // Floating image follows the cursor over the process list
      const list = $('[data-process]');
      const float = $('[data-process-float]');
      if (list && float && finePointer) {
        const imgs = $$('img', float);
        const fx = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' });
        const fy = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' });
        list.addEventListener('pointermove', (e) => { fx(e.clientX + 24); fy(e.clientY - float.offsetHeight / 2); });
        list.addEventListener('pointerenter', () => gsap.to(float, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }));
        list.addEventListener('pointerleave', () => gsap.to(float, { opacity: 0, scale: 0.85, duration: 0.5, ease: 'expo.out' }));
        $$('.process__row', list).forEach((row, i) => row.addEventListener('pointerenter', () => {
          imgs.forEach((im, j) => im.classList.toggle('is-active', i === j));
        }));
      }

      const heroImg = $('[data-atelier-hero] img');
      return () => {
        if (heroImg) {
          gsap.fromTo(heroImg, { yPercent: -10 }, {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: { trigger: '[data-atelier-hero]', start: 'top bottom', end: 'bottom top', scrub: true },
          });
        }
      };
    },
  };

  /* ==================================================================
     BOOT
     ================================================================== */
  const showEverything = () => {
    gsap.set('[data-split], [data-fade], .hero__title', { autoAlpha: 1 });
  };

  const boot = async () => {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}

    if (reduce) {
      showEverything();
      await Veil.intro();
      return;
    }

    prepareSplits();
    const start = motion[page]?.();
    await Veil.intro();
    lenis?.start();
    start?.();
    scrollReveals();

    // Arrive at a hash target (e.g. atelier.html#contact) after the reveal.
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) lenis?.scrollTo(target, { offset: -80, duration: 1.6 });
    }
  };

  boot();
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Keep trigger positions honest if the page grows or shrinks later
  // (late images, font swap) — otherwise pinned/scrubbed sections drift.
  let lastH = 0, rt;
  new ResizeObserver(() => {
    const h = document.body.scrollHeight;
    if (Math.abs(h - lastH) < 2) return;
    lastH = h;
    clearTimeout(rt);
    rt = setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);
})();
