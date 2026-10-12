// media query match for the horizontal nav (the toggle button is used below it)
const isWide = window.matchMedia('(width >= 600px)');

/**
 * Loads the nav fragment markup. Metadata-independent: /content first (local preview),
 * then the site root (DA / Edge Delivery).
 * @returns {Promise<Element|null>} A container with the fragment's sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return container;
}

/**
 * Normalizes a path so /content/blog/index, /blog/ and /blog compare equal.
 * @param {string} path The path
 * @returns {string} The normalized path
 */
function normalizePath(path) {
  return path
    .replace(/^\/content(?=\/|$)/, '')
    .replace(/(\/index)?(\.html)?$/, '')
    .replace(/\/$/, '') || '/';
}

/**
 * Marks the link to the current page.
 * @param {Element} list The nav list
 */
function markCurrentPage(list) {
  const current = normalizePath(window.location.pathname);
  list.querySelectorAll('a[href]').forEach((a) => {
    const target = normalizePath(new URL(a.getAttribute('href'), window.location).pathname);
    if (target === current) {
      a.setAttribute('aria-current', 'page');
      a.closest('li').classList.add('nav-current');
    }
  });
}

/**
 * Opens or closes the menu (narrow screens only).
 * @param {Element} nav The nav element
 * @param {boolean} [force] Force the open state
 */
function toggleMenu(nav, force) {
  const button = nav.querySelector('.nav-toggle');
  const open = typeof force === 'boolean' ? force : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/**
 * Builds the brand row (site title + tagline) from the first fragment section.
 * @param {Element} section The fragment section
 * @returns {Element} The brand element
 */
function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const [titleP, ...rest] = [...section.querySelectorAll(':scope > p')];
  if (titleP) {
    const title = document.createElement('p');
    title.className = 'nav-title';
    title.append(...titleP.childNodes);
    brand.append(title);
  }
  rest.forEach((p) => {
    const tagline = document.createElement('p');
    tagline.className = 'nav-tagline';
    tagline.append(...p.childNodes);
    brand.append(tagline);
  });
  return brand;
}

/**
 * Loads and decorates the header.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > div')];
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  if (sections[0]) nav.append(buildBrand(sections[0]));

  const list = sections.slice(1).map((s) => s.querySelector('ul')).find(Boolean);
  if (list) {
    const menu = document.createElement('div');
    menu.className = 'nav-menu';
    menu.id = 'nav-menu';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.setAttribute('aria-controls', 'nav-menu');
    button.setAttribute('aria-label', 'Menu');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = 'Menu';
    button.addEventListener('click', () => toggleMenu(nav));

    list.className = 'nav-list';
    markCurrentPage(list);
    menu.append(button, list);
    nav.append(menu);

    nav.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !isWide.matches && nav.getAttribute('aria-expanded') === 'true') {
        toggleMenu(nav, false);
        button.focus();
      }
    });
    // the menu is always shown on wide screens; reset the narrow-screen state when resizing
    isWide.addEventListener('change', () => toggleMenu(nav, false));
    toggleMenu(nav, false);
  }

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
