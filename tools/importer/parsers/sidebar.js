/* eslint-disable */
/* global WebImporter */

/**
 * Parser: sidebar (shared /fragments/sidebar).
 *
 * Builds the shared sidebar from the WordPress widget area (#secondary) of any post:
 *   - "Recent Posts" widget → h3 + Post List (compact) block limited to the same number of items
 *   - "Categories" widget  → h3 + list of category links (keeps nested paths such as /category/software/osgi/)
 * Search, Archives and Meta widgets are intentionally dropped.
 *
 * Source: #page (whole page; the sidebar replaces everything)
 */

function widgetTitle(widget, fallback) {
  const title = widget && widget.querySelector('.widget-title');
  return title ? title.textContent.trim() : fallback;
}

export default function parse(element, { document }) {
  const recent = element.querySelector('.widget_recent_entries');
  const categories = element.querySelector('.widget_categories');
  const content = [];

  if (recent) {
    const heading = document.createElement('h3');
    heading.textContent = widgetTitle(recent, 'Recent Posts');
    const count = recent.querySelectorAll('li').length || 5;
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'Post List (compact)',
      cells: [['Limit', `${count}`]],
    });
    content.push(heading, block);
  }

  if (categories) {
    const heading = document.createElement('h3');
    heading.textContent = widgetTitle(categories, 'Categories');
    const list = document.createElement('ul');
    categories.querySelectorAll('li > a[href]').forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      li.append(link);
      list.append(li);
    });
    content.push(heading, list);
  }

  if (content.length) element.replaceWith(...content);
}
