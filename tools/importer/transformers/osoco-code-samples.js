/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: blog.osoco.de code samples -> single <pre><code> per sample.
 *
 * Structure verified in migration-work/cleaned.html:
 *   pre.wp-block-preformatted > div > div.syntaxhighlighter.{lang} > table > tbody > tr >
 *     td.gutter (line numbers, dropped)
 *     td.code > div.container > div.line > code.{lang}.{plain|string|spaces|keyword|...}
 *
 * Rules:
 * - one source line per .line row, joined with "\n"; gutter line numbers dropped
 * - &nbsp; / U+00A0 converted to regular spaces so indentation survives
 * - text kept exactly as displayed (e.g. a literal "&amp;&amp;" stays as-is)
 * - language from the syntaxhighlighter class (or WordPress "brush: x" class on
 *   un-rendered <pre>) kept as class "language-{lang}" on <code>
 * - plain <pre> / pre.wp-block-preformatted without SyntaxHighlighter: textContent
 *   with <br> -> "\n" and nbsp -> space
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// SyntaxHighlighter non-language state classes
const SH_NON_LANG = new Set(['syntaxhighlighter', 'nogutter', 'collapsed', 'ie', 'printing', 'highlighted', 'show']);
const LANG_ALIASES = { jscript: 'js', javascript: 'js', js: 'js' };

function normalizeLang(lang) {
  if (!lang) return '';
  const l = lang.toLowerCase();
  return LANG_ALIASES[l] || l;
}

function langFromSyntaxHighlighter(sh) {
  const cls = [...sh.classList].find((c) => !SH_NON_LANG.has(c));
  return normalizeLang(cls);
}

function langFromBrush(pre) {
  // WordPress SyntaxHighlighter Evolved raw markup: <pre class="brush: java; title: ; notranslate">
  const m = (pre.getAttribute('class') || '').match(/brush:\s*([\w-]+)/i);
  return m ? normalizeLang(m[1]) : '';
}

function nbspToSpace(s) {
  return s.replace(/\u00a0/g, ' ');
}

// Text of one SyntaxHighlighter .line row. Child <code> elements carry the source text;
// literal inter-token spaces are text nodes. Whitespace text nodes that contain a newline
// are formatting artifacts (pretty-printed markup), not source text.
function lineText(line) {
  let out = '';
  line.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const t = node.textContent;
      if (/\n/.test(t) && !t.trim()) return;
      out += t.replace(/[ \t\r\n]+/g, ' ');
    } else if (node.nodeType === 1) {
      out += node.textContent;
    }
  });
  return nbspToSpace(out).replace(/\s+$/, '');
}

function buildPre(document, text, lang) {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  if (lang) code.className = `language-${lang}`;
  code.textContent = text;
  pre.append(code);
  return pre;
}

function flattenSyntaxHighlighter(element, document) {
  element.querySelectorAll('div.syntaxhighlighter').forEach((sh) => {
    if (!sh.isConnected) return; // forEach callback skip, not a transform return
    const rows = [...sh.querySelectorAll('td.code .line')];
    const lines = rows.length
      ? rows.map(lineText)
      : [...sh.querySelectorAll('.line')].filter((l) => !l.closest('td.gutter')).map(lineText);
    // drop leading/trailing empty lines only
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

    const outerPre = sh.closest('pre');
    const target = outerPre && element.contains(outerPre) ? outerPre : sh;
    const lang = langFromSyntaxHighlighter(sh) || (outerPre ? langFromBrush(outerPre) : '');
    target.replaceWith(buildPre(document, lines.join('\n'), lang));
  });
}

function flattenPlainPre(element, document) {
  element.querySelectorAll('pre').forEach((pre) => {
    if (!pre.isConnected) return;
    // Already flattened: <pre><code>…</code></pre> with a single code child
    const kids = [...pre.children];
    if (kids.length === 1 && kids[0].tagName === 'CODE' && !kids[0].children.length) {
      kids[0].textContent = nbspToSpace(kids[0].textContent);
      return;
    }
    pre.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    let text = nbspToSpace(pre.textContent).replace(/\r\n?/g, '\n');
    // drop leading/trailing blank lines but keep indentation of the first real line
    text = text.replace(/^\s*\n/, '').replace(/\s+$/, '');
    const codeEl = pre.querySelector('code');
    const lang = langFromBrush(pre) || (codeEl && (codeEl.className.match(/language-([\w-]+)/) || [])[1]) || '';
    pre.replaceWith(buildPre(document, text, normalizeLang(lang)));
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const document = element.ownerDocument;
    // SyntaxHighlighter toolbar ("?" link), if rendered
    WebImporter.DOMUtils.remove(element, ['div.syntaxhighlighter .toolbar']);
    flattenSyntaxHighlighter(element, document);
    flattenPlainPre(element, document);
  }
}
