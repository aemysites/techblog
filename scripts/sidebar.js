import { getMetadata } from './aem.js';

export const SIDEBAR_PATH = '/fragments/sidebar';

/**
 * Whether the current page shows the shared sidebar. The homepage has none,
 * and any page can opt out with `Sidebar: off` metadata.
 * @returns {boolean}
 */
export function hasSidebar() {
  if (getMetadata('sidebar').toLowerCase() === 'off') return false;
  return getMetadata('template').toLowerCase() !== 'homepage';
}
