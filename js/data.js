/* ==========================================================================
   Vérane — product catalogue
   Photography: Unsplash (https://unsplash.com) — free to use under the Unsplash License.
   ========================================================================== */

const IMG = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PHOTOS = {
  heroCoat: '1668952135120-7d997b1b3778',
  blazerMono: '1613915617430-8ab0fd7c6baf',
  whiteSuit: '1659522761084-79196b64abe4',
  whiteWalk: '1657815929003-b97cc426cb3d',
  silhouette: '1603189343302-e603f7add05a',
  armRaised: '1552393700-42696fb89bfa',
  flower: '1571513800374-df1bbe650e56',
  bwPortrait: '1508964801641-4b2410705b73',
  hat: '1590131222139-91ba5992e4ed',
  greyShirt: '1601762603339-fd61e28b698a',
  sweaterStack: '1641642231157-0849081598a2',
  knitTexture: '1602706294170-1fed8eecd9f9',
  cardiganHanger: '1773747310674-b42a55d72003',
};

const PRODUCTS = [
  {
    slug: 'arles-wrap-coat',
    name: 'Arles Wrap Coat',
    category: 'Outerwear',
    price: 2450,
    colour: 'Camel',
    material: 'Double-faced wool and cashmere',
    images: ['1668952135120-7d997b1b3778', '1539533018447-63fcce2678e3', '1608635680046-aebf91c1a9c8'],
    description:
      'An unstructured wrap coat cut from a double-faced wool and cashmere blend. Hand-finished seams allow the coat to fall softly from the shoulder, closed with a self-tie belt.',
  },
  {
    slug: 'mercier-blazer',
    name: 'Mercier Blazer',
    category: 'Tailoring',
    price: 1680,
    colour: 'Charcoal',
    material: 'Virgin wool gabardine',
    images: ['1613915617430-8ab0fd7c6baf', '1659522761084-79196b64abe4', '1508964801641-4b2410705b73'],
    description:
      'A single-breasted blazer with an elongated lapel and softly padded shoulders. Half-canvassed construction gives the jacket a quiet, natural shape that improves with wear.',
  },
  {
    slug: 'orne-overcoat',
    name: 'Orne Overcoat',
    category: 'Outerwear',
    price: 2890,
    colour: 'Tobacco',
    material: 'Brushed alpaca and wool',
    images: ['1619603364904-c0498317e145', '1619603364937-8d7af41ef206', '1737508945707-ebdccee97cc5'],
    description:
      'A generous overcoat in brushed alpaca, with dropped shoulders and a concealed placket. Lined in cupro for ease over tailoring and knitwear alike.',
  },
  {
    slug: 'lune-tote',
    name: 'Lune Tote',
    category: 'Leather goods',
    price: 1350,
    colour: 'Cognac',
    material: 'Vegetable-tanned calfskin',
    images: ['1624687943971-e86af76d57de', '1713425886143-6ea8c776bf2d', '1596552639068-99bd471b579c'],
    description:
      'A structured tote in vegetable-tanned calfskin that deepens in colour with time. Edges are painted by hand in seven layers; the interior is left raw and unlined.',
  },
  {
    slug: 'sable-knit',
    name: 'Sable Knit',
    category: 'Knitwear',
    price: 690,
    colour: 'Ecru',
    material: 'Brushed mohair and silk',
    images: ['1773747310674-b42a55d72003', '1602706294170-1fed8eecd9f9', '1641642231157-0849081598a2'],
    description:
      'A cloud-light sweater knitted from brushed mohair and silk. Relaxed through the body with a dropped shoulder and a deep ribbed hem.',
  },
  {
    slug: 'vesper-trench',
    name: 'Vesper Trench',
    category: 'Outerwear',
    price: 2150,
    colour: 'Stone',
    material: 'Water-repellent cotton gabardine',
    images: ['1737508945707-ebdccee97cc5', '1648066380643-675d30c3cd17', '1676716105765-e19fe6a01851'],
    description:
      'Our reading of the classic trench: a softened storm flap, horn buttons and a longer, fluid line. Woven in Italy from tightly spun cotton gabardine.',
  },
  {
    slug: 'noor-top',
    name: 'Noor Sleeveless Top',
    category: 'Tailoring',
    price: 520,
    colour: 'Black',
    material: 'Silk crêpe de Chine',
    images: ['1645996830718-127f7e4f74fc', '1524504542391-127872011665', '1590131222139-91ba5992e4ed'],
    description:
      'A sleeveless shell in heavy silk crêpe de Chine, cut on the bias for movement. Finished with a hand-rolled neckline and a concealed side zip.',
  },
  {
    slug: 'cellier-bag',
    name: 'Cellier Bag',
    category: 'Leather goods',
    price: 1890,
    colour: 'Bordeaux',
    material: 'Box calf leather',
    images: ['1596552639068-99bd471b579c', '1605733513597-a8f8341084e6', '1624687943971-e86af76d57de'],
    description:
      'A compact top-handle bag in polished box calf with a turn-lock closure in brushed brass. Sized for the essentials and carried by hand or on the detachable strap.',
  },
  {
    slug: 'ivoire-suit',
    name: 'Ivoire Suit',
    category: 'Tailoring',
    price: 2240,
    colour: 'Ivory',
    material: 'Wool and silk twill',
    images: ['1659522761084-79196b64abe4', '1657815929003-b97cc426cb3d', '1613915617430-8ab0fd7c6baf'],
    description:
      'A relaxed two-piece suit in a wool and silk twill with a subtle lustre. The trousers sit high on the waist with a single pleat and a long, clean leg.',
  },
  {
    slug: 'brume-coat',
    name: 'Brume Coat',
    category: 'Outerwear',
    price: 2380,
    colour: 'Caramel',
    material: 'Felted virgin wool',
    images: ['1539533018447-63fcce2678e3', '1514813836041-518668f092b1', '1668952135120-7d997b1b3778'],
    description:
      'A notched-lapel coat in densely felted wool, cut close at the shoulder and falling straight to mid-calf. Pockets are hidden in the side seams to keep the line uninterrupted.',
  },
  {
    slug: 'atelier-cardigan',
    name: 'Atelier Cardigan',
    category: 'Knitwear',
    price: 780,
    colour: 'Oat',
    material: 'Undyed baby alpaca',
    images: ['1641642231157-0849081598a2', '1602706294170-1fed8eecd9f9', '1773747310674-b42a55d72003'],
    description:
      'Hand-framed in undyed baby alpaca, keeping the natural tone of the fibre. Mother-of-pearl buttons and a softly rounded collar.',
  },
  {
    slug: 'mira-satchel',
    name: 'Mira Satchel',
    category: 'Leather goods',
    price: 1590,
    colour: 'Slate',
    material: 'Grained calfskin',
    images: ['1605733513597-a8f8341084e6', '1713425886143-6ea8c776bf2d', '1596552639068-99bd471b579c'],
    description:
      'A soft-structured satchel in grained calfskin with twin buckles and a padded internal sleeve. Designed to be carried every day and repaired for a lifetime.',
  },
];

const CATEGORIES = ['All', 'Outerwear', 'Tailoring', 'Knitwear', 'Leather goods'];

const formatPrice = (n) => '€' + n.toLocaleString('en-US');

const productCard = (p, i = 0, extra = '') => `
  <article class="card" data-category="${p.category}" ${extra}>
    <a href="product.html?p=${p.slug}" class="card__link" data-cursor="View" data-label="${p.name}">
      <div class="card__media">
        <img class="card__img" src="${IMG(p.images[0], 900)}" alt="${p.name} in ${p.colour.toLowerCase()}" loading="lazy">
        <img class="card__img card__img--alt" src="${IMG(p.images[1], 900)}" alt="" loading="lazy" aria-hidden="true">
      </div>
      <div class="card__info">
        <h3 class="card__name">${p.name}</h3>
        <p class="card__price">${formatPrice(p.price)}</p>
      </div>
    </a>
  </article>`;
