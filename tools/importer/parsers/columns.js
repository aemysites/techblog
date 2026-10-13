/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns.
 * Source: https://blog.osoco.de/ (template: homepage)
 * Instances: "#content article.page .entry-content", "#main article .entry-content"
 * Generated: 2026-10-12
 *
 * Output: one row, two cells -> [ text content | image ].
 *  - cell 1: all text blocks of the entry content (paragraphs keep <br> and inline
 *    formatting); the floated image is removed from the text flow.
 *  - cell 2: the image (img.alignright preferred, else first img), alt/title preserved.
 * Variations handled:
 *  - no image -> single-cell row
 *  - image wrapped in a link/figure/picture -> the wrapper is moved with it
 *  - empty paragraphs (whitespace / &nbsp; only) are dropped
 *  - stray top-level text nodes are wrapped in <p>
 */
export default function parse(element, { document }) {
  // Validated against source.html: <p><img class="alignright wp-image-105 size-medium" ...>text…</p>
  const img = element.querySelector('img.alignright') || element.querySelector('img');

  let imageNode = null;
  if (img) {
    imageNode = img;
    // Carry a wrapper along when it exists only to hold the image (WP link-to-file, figure, picture).
    const wrapper = img.closest('figure, picture, a');
    if (wrapper && element.contains(wrapper) && wrapper !== element
      && wrapper.textContent.trim() === '' && wrapper.querySelectorAll('img').length === 1) {
      imageNode = wrapper.tagName === 'FIGURE' ? img : wrapper;
      if (wrapper.tagName === 'FIGURE') wrapper.remove();
    }
    imageNode.remove();
  }

  const isEmpty = (el) => {
    if (el.querySelector('img, picture, video, iframe, svg')) return false;
    return el.textContent.replace(/ /g, ' ').trim() === '';
  };

  // Text cell: every remaining top-level child, minus empty ones.
  const textCell = [];
  [...element.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        textCell.push(p);
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) return;
    if (isEmpty(node)) return;
    // Trim leading whitespace text left behind where the floated image used to sit.
    const first = node.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
    textCell.push(node);
  });

  // Empty-block guard.
  if (!textCell.length && !imageNode) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = [];
  if (textCell.length) row.push(textCell);
  if (imageNode) row.push(imageNode);

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
