/* ==========================================================================
   Shared chrome — header, menu, bag drawer, footer, cursor, toast.
   Injected synchronously at the end of <body> so every page stays in sync.
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

  const footer = `
  <footer class="footer">
    <nav class="footer__links" aria-label="Footer">
      <a href="collection.html" class="link" data-label="Collection">Collection</a>
      <a href="atelier.html" class="link" data-label="Atelier">Atelier</a>
      <a href="atelier.html#contact" class="link" data-label="Atelier">Contact</a>
      <a href="https://www.instagram.com" class="link" target="_blank" rel="noopener">Instagram</a>
    </nav>
    <div class="footer__mark" aria-hidden="true">${'Vérane'.split('').map((c) => `<span>${c}</span>`).join('')}</div>
    <div class="footer__bottom">
      <span>© 2026 Vérane</span>
      <a href="#top" data-to-top>Top</a>
    </div>
  </footer>`;

  const extras = `
    <div class="toast" data-toast role="status" aria-live="polite"></div>
    <div class="cursor" data-cursor-dot aria-hidden="true"></div>
    <div class="cursor-label" data-cursor-label aria-hidden="true"></div>`;

  document.body.insertAdjacentHTML('afterbegin', header + menu + cart);
  const main = document.querySelector('main');
  main.insertAdjacentHTML('afterend', footer + extras);
})();
