/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: blog.osoco.de page metadata.
 *
 * Runs in beforeTransform, i.e. BEFORE osoco-cleanup.js removes .entry-meta (afterTransform),
 * and appends a single Metadata block to the end of the content.
 *
 * Sources (verified in migration-work/cleaned.html and migration-work/metadata.json):
 *   Title            h1.entry-title  | og:title / <title> minus " - A Matter of Unimportance"
 *   Description      og:description | meta[name=description], trailing "[…]" / "[...]" trimmed
 *   Author           .entry-meta .author a | meta[name=author]
 *   Publication Date time.entry-date[datetime] (or its text) -> YYYY-MM-DD | article:published_time
 *   Categories       .entry-meta a[rel~=category] (fallback: href contains /category/)
 *   Tags             .entry-meta a[rel=tag] that are not categories (fallback: href contains /tag/)
 *   Image            og:image
 *
 * Tolerant for article.post, article.page (no entry-meta) and the homepage.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SITE_SUFFIX_RE = /\s*[-–|]\s*A Matter of Unimportance\s*$/i;

function getMeta(document, name) {
  const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  const v = el && el.getAttribute('content');
  return v ? v.trim() : '';
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function toIsoDate(value) {
  const m = (value || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

function linkPath(a) {
  const href = a.getAttribute('href') || '';
  try {
    return new URL(href, 'https://blog.osoco.de/').pathname;
  } catch (e) {
    return href;
  }
}

function extractListingMetadata(element, document, templateName) {
  const meta = {};
  const span = element.querySelector('.archive-title span');
  const titleEl = document.querySelector('title');
  const title = text(span) || (getMeta(document, 'og:title') || text(titleEl))
    .replace(SITE_SUFFIX_RE, '').replace(/\s+Archives\s*$/i, '').trim();
  if (title) meta.Title = title;
  meta.Template = templateName;
  return meta;
}

function extractMetadata(element, document, templateName) {
  // Shared fragments carry no page metadata
  if (templateName === 'sidebar-fragment') return {};
  // Listing pages must not pick up the first listed post's title, date or categories
  if (templateName === 'post-listing') return extractListingMetadata(element, document, templateName);

  const meta = {};

  // Title
  const h1 = element.querySelector('h1.entry-title') || element.querySelector('#content article h1');
  let title = text(h1);
  if (!title) {
    const titleEl = document.querySelector('title');
    title = (getMeta(document, 'og:title') || text(titleEl)).replace(SITE_SUFFIX_RE, '').trim();
  }
  if (title) meta.Title = title;

  // Description
  const description = (getMeta(document, 'og:description') || getMeta(document, 'description'))
    .replace(/\s*(\[…\]|\[\.\.\.\]|\[&hellip;\]|…|\.\.\.)\s*$/, '')
    .trim();
  if (description) meta.Description = description;

  const entryMeta = element.querySelector('.entry-meta');

  // Author
  const author = text(entryMeta && entryMeta.querySelector('.author a'))
    || getMeta(document, 'author');
  if (author) meta.Author = author;

  // Publication Date
  const time = (entryMeta && entryMeta.querySelector('time.entry-date'))
    || element.querySelector('#content article time.entry-date');
  let date = time ? toIsoDate(time.getAttribute('datetime')) || toIsoDate(time.textContent) : '';
  if (!date) date = toIsoDate(getMeta(document, 'article:published_time'));
  if (date) meta['Publication Date'] = date;

  // Categories / Tags
  if (entryMeta) {
    const links = [...entryMeta.querySelectorAll('a[href]')];
    const isCategory = (a) => /(^|\s)category(\s|$)/.test(a.getAttribute('rel') || '')
      || /\/category\//.test(linkPath(a));
    const isTag = (a) => !isCategory(a)
      && ((a.getAttribute('rel') || '').trim() === 'tag' || /\/tag\//.test(linkPath(a)));

    const categories = uniq(links.filter(isCategory).map(text));
    const tags = uniq(links.filter(isTag).map(text));
    if (categories.length) meta.Categories = categories.join(', ');
    if (tags.length) meta.Tags = tags.join(', ');
  }

  // Image
  const ogImage = getMeta(document, 'og:image');
  if (ogImage) {
    const img = document.createElement('img');
    img.src = ogImage;
    meta.Image = img;
  }

  // Template (drives template-specific rendering, e.g. no sidebar on the homepage)
  if (templateName) meta.Template = templateName;

  return meta;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const document = element.ownerDocument;
    const templateName = payload && payload.template && payload.template.name;
    const meta = element.querySelector('[data-osoco-metadata]') ? {} : extractMetadata(element, document, templateName);

    if (Object.keys(meta).length) {
      const block = (WebImporter.Blocks.getMetadataBlock)
        ? WebImporter.Blocks.getMetadataBlock(document, meta)
        : WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: meta });
      block.setAttribute('data-osoco-metadata', '');

      // Append after the article if present, otherwise at the end of the content root.
      // Listing parsers replace the whole #primary, so keep their metadata outside it.
      const article = templateName === 'post-listing' ? null
        : (element.querySelector('#content article') || element.querySelector('#main article'));
      if (article) article.after(block);
      else element.append(block);
    }
  }

  if (hookName === TransformHook.afterTransform) {
    const block = element.querySelector('[data-osoco-metadata]');
    if (block) {
      // Move metadata to the very end of the document so it is the last block.
      block.removeAttribute('data-osoco-metadata');
      element.append(block);
    }
  }
}
