/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: blog.osoco.de (WordPress Twenty Twelve) site-wide cleanup.
 *
 * Removes site chrome and non-authorable content so only the article
 * (h1.entry-title + .entry-content) remains, then rewrites internal
 * https://blog.osoco.de/... links to root-relative paths.
 *
 * Selectors verified in migration-work/cleaned.html:
 *   a.skip-link.screen-reader-text, header#masthead.site-header (incl. nav#site-navigation),
 *   footer.entry-meta, nav.nav-single (.nav-previous/.nav-next, h3.assistive-text),
 *   div#secondary.widget-area (search, recent posts, archives, categories, meta widgets),
 *   footer#colophon, label.screen-reader-text
 * Theme selectors not present on the representative page but part of Twenty Twelve
 * single/page templates (requested for other posts): #nav-below, #comments, #respond.
 *
 * Works for article.post (blog-article), article.page (static-page) and the homepage.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SITE_HOST_RE = /^https?:\/\/(www\.)?blog\.osoco\.de(?=[/?#]|$)/i;

function makeInternalLinksRelative(element) {
  element.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || !SITE_HOST_RE.test(href)) return;
    const rel = href.replace(SITE_HOST_RE, '');
    a.setAttribute('href', rel === '' || rel.startsWith('?') || rel.startsWith('#') ? `/${rel}` : rel);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-content elements that never carry authorable content
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      '.skip-link',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header: site title, tagline, main navigation
      '#masthead',
      'header.site-header',
      // Entry meta line ("This entry was posted in ... on ... by ...") -> page metadata
      // (read by osoco-metadata.js in beforeTransform, before this removal)
      '.entry-meta',
      // Prev/next post navigation
      'nav.nav-single',
      '#nav-below',
      '.nav-previous',
      '.nav-next',
      // Comments and comment form
      '#comments',
      '#respond',
      // Sidebar widgets
      '#secondary',
      // Global footer
      '#colophon',
      // Accessibility-only helpers (not authored)
      '.assistive-text',
      '.screen-reader-text',
    ]);

    makeInternalLinksRelative(element);
  }
}
