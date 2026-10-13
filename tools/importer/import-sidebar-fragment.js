/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import sidebarParser from './parsers/sidebar.js';

// TRANSFORMER IMPORTS - all transformers found in tools/importer/transformers/
import osocoMetadataTransformer from './transformers/osoco-metadata.js';
import osocoCodeSamplesTransformer from './transformers/osoco-code-samples.js';
import osocoCleanupTransformer from './transformers/osoco-cleanup.js';

// PARSER REGISTRY
const parsers = {
  sidebar: sidebarParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "sidebar-fragment",
  "description": "Shared sidebar fragment (/fragments/sidebar) built from the widget area: Recent Posts as a compact Post List, Categories as a link list",
  "urls": [
    "https://blog.osoco.de/2020/07/guide-on-using-osgi-configurations/"
  ],
  "blocks": [
    {
      "name": "sidebar",
      "instances": [
        "#page"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "sidebar",
      "selector": [
        "#secondary"
      ],
      "style": null,
      "blocks": [
        "sidebar"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - metadata reads the page in beforeTransform, before cleanup strips chrome
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

    // 1. beforeTransform: read metadata, strip site chrome
    executeTransformers('beforeTransform', main, payload);

    // 2-3. Find and parse blocks (both instance selectors can hit the same element)
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

    // 6. One shared fragment, whichever post it was built from
    const path = '/fragments/sidebar';

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [...new Set(pageBlocks.map((b) => b.name))],
      },
    }];
  },
};
