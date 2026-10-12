/**
 * Reads blog posts from the site query index.
 * Index rows carry: path, title, description, image, author, date, categories, tags.
 */

const INDEX_PATH = '/query-index.json';
const PAGE_SIZE = 500;

let postsPromise;

/**
 * Splits a comma separated metadata value into trimmed, non-empty entries.
 * @param {string|string[]} value The raw value
 * @returns {string[]} The entries
 */
export function splitList(value) {
  if (Array.isArray(value)) return value.map((v) => `${v}`.trim()).filter(Boolean);
  return `${value || ''}`.split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Turns a category or tag name into a URL slug,
 * e.g. "Declarative Services" → "declarative-services".
 * @param {string} name The name
 * @returns {string} The slug
 */
export function toSlug(name) {
  return `${name}`.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchIndexPage(offset) {
  const resp = await fetch(`${INDEX_PATH}?offset=${offset}&limit=${PAGE_SIZE}`);
  if (!resp.ok) return { data: [], total: 0 };
  return resp.json();
}

async function fetchAll() {
  const rows = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    // eslint-disable-next-line no-await-in-loop
    const json = await fetchIndexPage(offset);
    const data = json.data || [];
    rows.push(...data);
    total = Number.isFinite(json.total) ? json.total : rows.length;
    if (!data.length) break;
    offset += data.length;
  }

  return rows
    .filter((row) => row.date && row.path)
    .map((row) => ({
      ...row,
      categories: splitList(row.categories),
      tags: splitList(row.tags),
    }))
    .sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
}

/**
 * Returns all dated posts from the query index, newest first. The index is fetched once per page.
 * @returns {Promise<Object[]>} The posts
 */
export function getPosts() {
  if (!postsPromise) {
    postsPromise = fetchAll().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Loading the post index failed', error);
      return [];
    });
  }
  return postsPromise;
}
