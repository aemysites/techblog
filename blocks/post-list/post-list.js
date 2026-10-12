import { readBlockConfig } from '../../scripts/aem.js';
import { getPosts, splitList } from '../../scripts/post-index.js';

function matches(post, { categories, tags }) {
  const lower = (list) => list.map((v) => v.toLowerCase());
  const postCategories = lower(post.categories);
  const postTags = lower(post.tags);
  if (categories.length && !lower(categories).some((c) => postCategories.includes(c))) return false;
  if (tags.length && !lower(tags).some((t) => postTags.includes(t))) return false;
  return true;
}

function buildItem(post, compact) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = post.path;
  link.textContent = post.title || post.path;

  if (compact) {
    li.append(link);
    return li;
  }

  const article = document.createElement('article');
  const heading = document.createElement('h2');
  heading.append(link);
  article.append(heading);

  const time = document.createElement('time');
  time.dateTime = post.date;
  time.textContent = post.date;
  const meta = document.createElement('p');
  meta.className = 'post-list-date';
  meta.append(time);
  article.append(meta);

  if (post.description) {
    const description = document.createElement('p');
    description.className = 'post-list-description';
    description.textContent = post.description;
    article.append(description);
  }

  li.append(article);
  return li;
}

/**
 * Lists posts from the query index, newest first.
 * Optional config rows: Category, Tag (comma separated names), Limit.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const filter = {
    categories: splitList(config.category || config.categories),
    tags: splitList(config.tag || config.tags),
  };
  const limit = Number.parseInt(config.limit, 10);
  const compact = block.classList.contains('compact');

  block.textContent = '';
  const posts = (await getPosts()).filter((post) => matches(post, filter));
  const shown = Number.isFinite(limit) && limit > 0 ? posts.slice(0, limit) : posts;

  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'post-list-empty';
    empty.textContent = 'No posts found.';
    block.append(empty);
    return;
  }

  const list = document.createElement('ul');
  shown.forEach((post) => list.append(buildItem(post, compact)));
  block.append(list);
}
