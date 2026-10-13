import { getMetadata } from '../../scripts/aem.js';
import { splitList, toSlug } from '../../scripts/post-index.js';
import { SIDEBAR_PATH } from '../../scripts/sidebar.js';

/**
 * Category pages can be nested (e.g. /category/software/osgi/), so take their paths
 * from the links authored in the sidebar and fall back to /category/<slug>/.
 * @returns {Promise<Map<string, string>>} Lower-cased category name → path
 */
async function getCategoryPaths() {
  const paths = new Map();
  try {
    const resp = await fetch(`${SIDEBAR_PATH}.plain.html`);
    if (!resp.ok) return paths;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    doc.querySelectorAll('a[href*="/category/"]').forEach((a) => {
      paths.set(a.textContent.trim().toLowerCase(), new URL(a.getAttribute('href'), window.location).pathname);
    });
  } catch (e) {
    // fall back to slugs
  }
  return paths;
}

function buildLinks(names, toPath) {
  const fragment = document.createDocumentFragment();
  names.forEach((name, i) => {
    if (i > 0) fragment.append(', ');
    const a = document.createElement('a');
    a.href = toPath(name);
    a.textContent = name;
    fragment.append(a);
  });
  return fragment;
}

/**
 * Renders "This entry was posted in <categories> on <date>" from page metadata.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const date = getMetadata('publication-date');
  const categories = splitList(getMetadata('categories'));
  // Tags metadata is rendered as one <meta property="article:tag"> per tag
  const tags = splitList(getMetadata('article:tag') || getMetadata('tags'));
  if (!date && !categories.length && !tags.length) {
    block.remove();
    return;
  }

  const categoryPaths = categories.length ? await getCategoryPaths() : new Map();
  const p = document.createElement('p');
  p.append('This entry was posted');
  if (categories.length) {
    p.append(' in ');
    p.append(buildLinks(categories, (name) => categoryPaths.get(name.toLowerCase()) || `/category/${toSlug(name)}/`));
  }
  if (tags.length) {
    p.append(' and tagged ');
    p.append(buildLinks(tags, (name) => `/tag/${toSlug(name)}/`));
  }
  if (date) {
    const time = document.createElement('time');
    time.dateTime = date;
    time.textContent = date;
    p.append(' on ', time);
  }
  p.append('.');
  block.append(p);
}
