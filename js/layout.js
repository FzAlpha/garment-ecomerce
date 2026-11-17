/* ==========================================================================
   Shared chrome — header, menu, bag drawer, footer, cursor, toast.
   Injected synchronously at the end of <body> so every page stays in sync.
   Designed & built by Velvané studio — https://website-checker-lmdx.vercel.app/
   ========================================================================== */
(() => {
  const page = document.body.dataset.page || '';
  const active = (name) => (page === name ? ' is-active' : '');

  const header = `
  <header class="header" data-header>
    <nav class="header__nav" aria-label="Primary">
      <a href="collection.html" class="link${active('collection')}" data-label="Collection">Collection</a>
      <a href="atelier.html" class="link${active('atelier')}" data-label="Atelier">Atelier</a>
    </nav>
    <button class="header__menu link" data-menu-open aria-label="Open menu">Menu</button>
    <a href="index.html" class="header__logo" data-label="Vérane" aria-label="Vérane — home">Vérane</a>
    <div class="header__right">
      <button class="link" data-cart-open><span class="header__bag-label">Bag&nbsp;</span>(<span data-cart-count>0</span>)</button>
    </div>
  </header>`;

  const menu = `
  <div class="menu" data-menu aria-hidden="true">
    <div class="menu__top">
      <span></span>
      <button class="link" data-menu-close>Close</button>
    </div>
    <ul class="menu__list">
      <li class="menu__item"><a class="menu__link" href="index.html" data-label="Vérane">Home</a></li>
      <li class="menu__item"><a class="menu__link" href="collection.html" data-label="Collection">Collection</a></li>
      <li class="menu__item"><a class="menu__link" href="atelier.html" data-label="Atelier"><em>Atelier</em></a></li>
    </ul>
    <div class="menu__bottom small">
      <span>12 Rue de Saintonge, Paris</span>
    </div>
  </div>`;

  const cart = `
  <div class="cart" data-cart aria-hidden="true">
    <div class="cart__backdrop" data-cart-close></div>
    <aside class="cart__panel" aria-label="Shopping bag" data-lenis-prevent>
      <div class="cart__head">
        <span class="label">Your bag (<span data-cart-count>0</span>)</span>
        <button class="link" data-cart-close>Close</button>
      </div>
      <div class="cart__items" data-cart-items></div>
      <div class="cart__foot">
        <div class="cart__total small"><span>Subtotal</span><span data-cart-total>€0</span></div>
        <p class="small muted">Complimentary delivery and returns.</p>
        <button class="btn btn--block" data-checkout>Proceed to checkout</button>
      </div>
    </aside>
  </div>`;

  // Velvané — the studio that designed and built Vérane
  const STUDIO = 'https://website-checker-lmdx.vercel.app/';
  // Velvané's own line-drawn wordmark, exactly as it appears on the studio site
  const LOGO = '<svg class="velvane-logo" viewBox="-2 -12 251 50" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.9" stroke-miterlimit="6"><path d="M0 0 L14 36 L28 0" pathLength="1"/><path d="M60 1.3 H42 L54 18 L42 34.7 H60" pathLength="1"/><path d="M75 0 V29 M80.5 34.7 H92" pathLength="1"/><path d="M106 0 L120 36 L134 0" pathLength="1"/><path d="M148 36 L162 0 L176 36" pathLength="1"/><path d="M191 36 V1.3 L214 34.7 V0" pathLength="1"/><path d="M247 1.3 H229 L241 18 L229 34.7 H247" pathLength="1"/><path d="M236 -4.5 L242.5 -10.5" pathLength="1"/></g></svg>';
  const X = '<svg class="credit-x" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5 8.5 8.5" pathLength="1"/><path d="M8.5 1.5 1.5 8.5" pathLength="1"/></svg>';

  const footer = `
  <footer class="footer">
    <nav class="footer__links" aria-label="Footer">
      <a href="collection.html" class="link" data-label="Collection">Collection</a>
      <a href="atelier.html" class="link" data-label="Atelier">Atelier</a>
      <a href="atelier.html#contact" class="link" data-label="Atelier">Contact</a>
      <a href="https://www.instagram.com" class="link" target="_blank" rel="noopener">Instagram</a>
    </nav>
    <div class="footer__lockup">
      <div class="footer__mark" aria-hidden="true">${'Vérane'.split('').map((c) => `<span>${c}</span>`).join('')}</div>
      <p class="footer__sign" aria-hidden="true"><span class="footer__sign-x">${X}</span>${LOGO}</p>
    </div>
    <div class="footer__bottom">
      <span class="footer__copy">© 2026 Vérane</span>
      <a href="${STUDIO}" class="footer__studio link" target="_top" rel="noopener" aria-label="Designed and built by Velvané (opens the Velvané studio)">Designed &amp; built by ${LOGO.replace('velvane-logo', 'velvane-logo velvane-logo--sm')} <span aria-hidden="true">↗</span></a>
      <a href="#top" class="footer__top" data-to-top>Top</a>
    </div>
  </footer>`;

  const extras = `
    <div class="toast" data-toast role="status" aria-live="polite"></div>
    <div class="cursor" data-cursor-dot aria-hidden="true"></div>
    <div class="cursor-label" data-cursor-label aria-hidden="true"></div>
    <div class="scrollbar" data-scrollbar aria-hidden="true">
      <div class="scrollbar__thumb" data-scrollbar-thumb><span class="scrollbar__count" data-scrollbar-count>0</span></div>
    </div>`;


  // Studio signature for anyone who opens the developer console
  try {
    console.log(
      '%cVérane %c× %cVelvané%c\nDesigned & built by Velvané — ' + '%s',
      'font: 28px/1.2 "Instrument Serif", serif; color: #1f1913;',
      'font: 18px/1.2 "Instrument Serif", serif; color: #8b7b69;',
      'font: italic 28px/1.2 "Instrument Serif", serif; color: #1f1913;',
      'font: 12px/1.8 "Inter Tight", sans-serif; color: #8b7b69;',
      STUDIO
    );
  } catch (e) {}

  document.body.insertAdjacentHTML('afterbegin', header + menu + cart);
  const main = document.querySelector('main');
  main.insertAdjacentHTML('afterend', footer + extras);
})();
