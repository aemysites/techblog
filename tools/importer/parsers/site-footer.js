/* eslint-disable */
/* global WebImporter */

/**
 * Parser: site-footer (shared /footer fragment).
 *
 * Builds the footer fragment from the WordPress footer (#colophon .site-info):
 * keeps the site's own links (Privacy Policy) and drops the "Proudly powered by WordPress"
 * credit, which no longer applies after the migration (confirmed with the site owner).
 *
 * Source: #page (whole page; the footer replaces everything)
 */

export default function parse(element, { document }) {
  const info = element.querySelector('#colophon .site-info') || element.querySelector('#colophon');
  if (!info) return;

  const links = [...info.querySelectorAll('a[href]')]
    .filter((a) => !/wordpress\.org/i.test(a.getAttribute('href')));
  if (!links.length) return;

  const p = document.createElement('p');
  links.forEach((link, i) => {
    if (i > 0) p.append(' / ');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    p.append(a);
  });
  element.replaceWith(p);
}
