/* eslint-disable */
/* global WebImporter */

/**
 * Parser: post-list (listing pages /blog/, /category/*, /tag/*).
 *
 * WordPress renders these archives as the full text of every post. They are rebuilt as
 * an h1 plus a query-driven Post List block, filtered by the archive's category or tag.
 *
 * Source: #primary (#content with header.archive-header > h1.archive-title > span, then articles)
 * Output: <h1>{name}</h1> + Post List block (rows: Category | name, or Tag | name; none for /blog/)
 */

const SITE_SUFFIX_RE = /\s*[-–|]\s*A Matter of Unimportance\s*$/i;

function archiveName(element, document) {
  const span = element.querySelector('.archive-title span');
  if (span && span.textContent.trim()) return span.textContent.replace(/\s+/g, ' ').trim();
  const title = (document.querySelector('title') || {}).textContent || '';
  return title.replace(SITE_SUFFIX_RE, '').replace(/\s+Archives\s*$/i, '').trim();
}

export default function parse(element, { document }) {
  const bodyClasses = document.body.classList;
  const name = archiveName(element, document);

  const cells = [];
  if (bodyClasses.contains('category')) cells.push(['Category', name]);
  else if (bodyClasses.contains('tag')) cells.push(['Tag', name]);

  const heading = document.createElement('h1');
  heading.textContent = name || 'Blog';

  const block = WebImporter.Blocks.createBlock(document, { name: 'Post List', cells });
  element.replaceWith(heading, block);
}
