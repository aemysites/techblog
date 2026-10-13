/* eslint-disable */
/* global WebImporter */

/**
 * Parser: site-nav (shared /nav fragment).
 *
 * Builds the nav fragment from the WordPress masthead (Twenty Twelve):
 *   section 1: site title link (header hgroup h1.site-title a) + tagline (h2.site-description)
 *   section 2: primary navigation links (#site-navigation li > a)
 * Sections are separated by <hr> so the fragment has two top-level divs.
 *
 * Source: #page (whole page; the nav replaces everything)
 */

export default function parse(element, { document }) {
  const masthead = element.querySelector('#masthead') || element.querySelector('header.site-header');
  if (!masthead) return;

  const content = [];

  const titleLink = masthead.querySelector('.site-title a');
  if (titleLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = titleLink.getAttribute('href');
    a.textContent = titleLink.textContent.trim();
    p.append(a);
    content.push(p);
  }

  const tagline = masthead.querySelector('.site-description');
  if (tagline && tagline.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = tagline.textContent.trim();
    content.push(p);
  }

  const links = [...masthead.querySelectorAll('#site-navigation li > a, .main-navigation li > a')];
  if (links.length) {
    content.push(document.createElement('hr'));
    const ul = document.createElement('ul');
    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent.trim();
      li.append(a);
      ul.append(li);
    });
    content.push(ul);
  }

  if (content.length) element.replaceWith(...content);
}
