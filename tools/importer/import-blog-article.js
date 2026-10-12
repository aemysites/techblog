/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS - all transformers found in tools/importer/transformers/
import osocoMetadataTransformer from './transformers/osoco-metadata.js';
import osocoCodeSamplesTransformer from './transformers/osoco-code-samples.js';
import osocoCleanupTransformer from './transformers/osoco-cleanup.js';

// PARSER REGISTRY - blog-article is all default content, no block parsers
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'blog-article',
  description: 'Two-column post page: header with site title and nav, main column with post title, body (text, images, code), entry meta line (categories and date), prev/next post links; right sidebar with recent posts and categories; simple footer',
  urls: [
    'https://blog.osoco.de/2007/06/maven-207-is-out/',
    'https://blog.osoco.de/2007/06/silence-is-over/',
    'https://blog.osoco.de/2007/06/turn-it-on-again-singing-in-the-rain/',
    'https://blog.osoco.de/2007/07/apache-felix-100-released/',
    'https://blog.osoco.de/2007/07/excalibur-sourceresolver-released/',
    'https://blog.osoco.de/2007/07/movable-type-sucks-wordpress-rocks/',
    'https://blog.osoco.de/2007/07/portlet-api-20-and-jcr-20-public-review/',
    'https://blog.osoco.de/2007/08/maven-release-plugin-removes-headers/',
    'https://blog.osoco.de/2007/10/cocoon-gettogether-2007-in-rome/',
    'https://blog.osoco.de/2007/10/garbage-collection-in-objective-c/',
    'https://blog.osoco.de/2007/10/new-projects-apache-sling-and-apache-sanselan/',
    'https://blog.osoco.de/2007/11/apache-ibatis-and-apache-sanselan-session/',
    'https://blog.osoco.de/2007/11/arrived-in-atlanta-for-apachecon/',
    'https://blog.osoco.de/2007/11/creating-osgi-services-with-the-apache-felix-scr-plugin/',
    'https://blog.osoco.de/2007/11/jcr-in-action-session/',
    'https://blog.osoco.de/2007/11/leaving-orlando/',
    'https://blog.osoco.de/2007/11/orlando-florida/',
    'https://blog.osoco.de/2007/11/portals-track-at-apachecon/',
    'https://blog.osoco.de/2007/11/the-musical-box-live-in-hamburg/',
    'https://blog.osoco.de/2007/12/back-in-paderborn/',
    'https://blog.osoco.de/2007/12/cocoon-portal-and-jcr/',
    'https://blog.osoco.de/2007/12/conference-season-2008/',
    'https://blog.osoco.de/2008/04/apachecon-eu-in-amsterdam/',
    'https://blog.osoco.de/2008/04/cocoon-22-is-released/',
    'https://blog.osoco.de/2008/04/cool-eclipse-plugin-mvn-indexer/',
    'https://blog.osoco.de/2008/04/innovation-at-apache-the-fun-is-back-with-apache-sling/',
    'https://blog.osoco.de/2008/04/thanks-to-apache-commons-support-for-osgi/',
    'https://blog.osoco.de/2008/08/happy-birthday-madonna/',
    'https://blog.osoco.de/2008/10/first-steps-with-jquery/',
    'https://blog.osoco.de/2008/10/ray-wilson-live-in-paderborn/',
    'https://blog.osoco.de/2008/11/heading-east/',
    'https://blog.osoco.de/2008/11/heading-west/',
    'https://blog.osoco.de/2008/11/interesting-session-in-new-orleans/',
    'https://blog.osoco.de/2008/11/osgiapachecon/',
    'https://blog.osoco.de/2008/11/sling-polo-shirts-arrived/',
    'https://blog.osoco.de/2008/11/what-happened-to-the-springframework-site/',
    'https://blog.osoco.de/2009/01/portlets-and-osgi/',
    'https://blog.osoco.de/2009/02/getting-started-with-portal-servers-and-spec-compliance/',
    'https://blog.osoco.de/2009/03/conference-season-apachecon-europe-and-jax/',
    'https://blog.osoco.de/2009/03/portals-meetup-at-apachecon-europe/',
    'https://blog.osoco.de/2009/04/jax-apache-sling-and-accidental-complexity/',
    'https://blog.osoco.de/2009/04/rapid-development-with-apache-sling-using-an-ide/',
    'https://blog.osoco.de/2009/11/increasing-interest-in-jcr-and-apache-sling/',
    'https://blog.osoco.de/2011/04/apache-axis2-book/',
    'https://blog.osoco.de/2015/04/hello-world/',
    'https://blog.osoco.de/2015/08/osgi-components-simply-simple-part-i/',
    'https://blog.osoco.de/2015/08/osgi-components-simply-simple-part-ii/',
    'https://blog.osoco.de/2015/11/osgi-components-simply-simple-part-iii/',
    'https://blog.osoco.de/2016/04/example-osgi-web-application/',
    'https://blog.osoco.de/2016/04/http-whiteboard-simply-simple-part-i/',
    'https://blog.osoco.de/2016/05/building-osgi-bundles-with-apache-maven/',
    'https://blog.osoco.de/2016/05/migrating-from-the-apache-felix-scr-annotations-to-the-osgi-declarative-services-annotations/',
    'https://blog.osoco.de/2016/09/http-whiteboard-simply-simple-part-ii/',
    'https://blog.osoco.de/2016/10/http-whiteboard-simply-simple-part-iii/',
    'https://blog.osoco.de/2017/07/new-osgi-configuration-features-r7/',
    'https://blog.osoco.de/2017/08/osgi-declarative-services-configuration-binding/',
    'https://blog.osoco.de/2020/07/guide-on-using-osgi-configurations/',
    'https://blog.osoco.de/2021/07/the-truth-about-aem-run-modes/',
    'https://blog.osoco.de/2024/02/value-created-by-developers/',
  ],
  blocks: [],
  sections: [
    {
      id: 'rc2',
      name: 'article',
      selector: ['#content article.post', '#main article'],
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

    // 6. Keep the original WordPress URLs: /yyyy/mm/slug/ is served from /yyyy/mm/slug/index
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
