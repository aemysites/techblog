/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS - all transformers found in tools/importer/transformers/
import osocoMetadataTransformer from './transformers/osoco-metadata.js';
import osocoCodeSamplesTransformer from './transformers/osoco-code-samples.js';
import osocoCleanupTransformer from './transformers/osoco-cleanup.js';

// PARSER REGISTRY - static-page is all default content, no block parsers
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'static-page',
  description: 'Two-column static text page: page heading and long-form text body with sub-headings, right sidebar widgets, simple footer',
  urls: [
    'https://blog.osoco.de/privacy-policy/',
  ],
  blocks: [],
  sections: [
    {
      id: 'rc2',
      name: 'page',
      selector: ['#content article.page', '#main article'],
      style: null,
      blocks: [],
      defaultContent: ['header.entry-header h1.entry-title', '.entry-content'],
    },
  ],
};

// TRANSFORMER REGISTRY - metadata reads .entry-meta in beforeTransform, so it runs before
// cleanup removes it; a single section means no section transformer is needed
const transformers = [
  osocoMetadataTransformer,
  osocoCodeSamplesTransformer,
  osocoCleanupTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform (typically document.body)
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform: read metadata, flatten code samples, strip site chrome
    executeTransformers('beforeTransform', main, payload);

    // 2-3. Find and parse blocks (none on this template)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform: final cleanup, Metadata block moved to the end
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules. Metadata is built by osoco-metadata.js, so createMetadata is not called.
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Keep the original WordPress URLs: /privacy-policy/ is served from /privacy-policy/index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\.html?$/, '')
      .replace(/\/$/, '/index');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '/index' || rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
