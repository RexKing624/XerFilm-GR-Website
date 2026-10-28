import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { copy } from '../src/i18n.js';
import { communityCopy } from '../src/community-copy.js';
import { SITE_VERSION } from '../src/site-version.js';
import { PUBLIC_PAGES, SITE_ORIGIN, pageSeo, pageSchema } from '../src/seo.js';

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

// Real, visible HTML for every visitor before Vue mounts, also useful without JS.
// Keep firmware URLs behind the existing application's reading confirmations.
function initialContent(pathname) {
  const t = copy.zh, ct = communityCopy.zh, page = pageSeo(pathname);
  const nav = '<nav aria-label="网站导航"><a href="/">固件</a> / <a href="/community/">社群</a> / <a href="/community/studio/">制作</a></nav>';
  let content;
  if (pathname === '/') {
    const films = JSON.parse(readFileSync(resolve('src/films.json'), 'utf8'));
    content = `<section class="intro"><section><p class="eyebrow">XerFilm GR · GR IV / III / IIIx · HDF / ${escape(t.edition)}</p><h1>${escape(t.hero1)}<br><em>${escape(t.hero2)}</em></h1><p class="intro-copy">${escape(t.intro).replaceAll('\n', '<br>')}</p></section></section>
      <section><h2>XerFilm GR ${escape(SITE_VERSION)} · 理光 GR 胶片模拟固件</h2><p>${escape(page.description)}</p></section>
      <section><h2>${escape(t.filmTitle)}</h2><p>${escape(t.filmDesc)}</p><p>${films.map(film => escape(film.name)).join(' · ')}</p></section>
      ${['adj', 'grain', 'highlight', 'stamp', 'frame', 'raw'].map(feature => `<section><h2>${escape(t[feature + 'Title'])}</h2><p>${escape(t[feature + 'Desc'])}</p></section>`).join('\n')}
      <section id="download"><h2>${escape(t.get)}</h2><p>${escape(t.risk)}</p><p>${escape(t.officialUpdateNotice)}</p><p>${escape(t.resetWarning)}</p><noscript><p>请启用 JavaScript，阅读并完成下载确认后获取固件。</p></noscript></section>`;
  } else if (pathname === '/community/') {
    const entries = JSON.parse(readFileSync(resolve('src/community-data.json'), 'utf8'));
    content = `<section><h1>XerFilm GR 社群</h1><p>${escape(ct.intro)}</p><h2>摄影作品与胶片效果</h2><p>${escape(ct.maintenanceDesc)}</p></section>
      ${entries.map(entry => `<article><h2>${escape(entry.name)}</h2><p>${escape(entry.description.zh)}</p><p>${escape(ct.by)}：${escape(entry.creator.name)}</p></article>`).join('\n')}
      <section><h2>${escape(ct.install)}</h2><ol>${ct.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><p>${escape(ct.slotHelp)}</p></section>`;
  } else {
    content = `<section><h1>XerFilm GR 胶片工作室</h1><p>${escape(page.description)}</p><h2>制作自己的胶片效果</h2><p>${escape(t.curated)}</p><noscript><p>请启用 JavaScript 以打开制作工具。</p></noscript></section>`;
  }
  return `<div id="app"><article class="site-shell seo-initial"><header class="site-header"><a class="brand" href="/">XerFilm GR</a>${nav}</header><main>${content}</main><footer class="site-footer"><p>© 2026 <a href="https://xergnik.com/">XER_GNIK</a> · Tokyo · Japan</p>${nav}</footer></article></div>`;
}

export function renderSeoPage(template, pathname) {
  const page = pageSeo(pathname);
  let html = template;
  const setTag = (pattern, value) => {
    if (pattern.test(html)) html = html.replace(pattern, () => value);
    else html = html.replace('</head>', () => value + '\n</head>');
  };
  setTag(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`);
  setTag(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(page.description)}">`);
  setTag(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${page.url}">`);
  setTag(/<meta name="xerfilm-site-version"[^>]*>/, `<meta name="xerfilm-site-version" content="${escape(SITE_VERSION)}">`);
  for (const [property, value] of Object.entries({ title: page.title, description: page.description, url: page.url, type: 'website', site_name: 'XerFilm GR', image: page.image })) {
    setTag(new RegExp(`<meta property="og:${property}"[^>]*>`), `<meta property="og:${property}" content="${escape(value)}">`);
  }
  for (const [name, value] of Object.entries({ card: 'summary_large_image', title: page.title, description: page.description, image: page.image })) {
    setTag(new RegExp(`<meta name="twitter:${name}"[^>]*>`), `<meta name="twitter:${name}" content="${escape(value)}">`);
  }
  setTag(/<meta name="robots"[^>]*>/, '<meta name="robots" content="index,follow,max-image-preview:large">');
  setTag(/<script id="xerfilm-page-schema"[^>]*>[\s\S]*?<\/script>/, `<script id="xerfilm-page-schema" type="application/ld+json">${JSON.stringify(pageSchema(page)).replaceAll('<', '\\u003c')}</script>`);
  if (!html.includes('<div id="app"></div>')) throw new Error('SEO requires the unmounted application template');
  html = html.replace('<div id="app"></div>', () => initialContent(pathname));
  return html;
}

export function writeSeoPages(directory = resolve('dist')) {
  const template = readFileSync(resolve(directory, 'index.html'), 'utf8');
  for (const pathname of PUBLIC_PAGES) {
    const target = resolve(directory, '.' + pathname);
    mkdirSync(target, { recursive: true });
    writeFileSync(resolve(target, 'index.html'), renderSeoPage(template, pathname));
  }
  // The embedded editor has its own public shell; avoid indexing a duplicate UI.
  const editor = resolve(directory, 'community/studio/editor.html');
  const editorHtml = readFileSync(editor, 'utf8');
  writeFileSync(editor, editorHtml.replace('</head>', '<meta name="robots" content="noindex,follow"></head>'));
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + PUBLIC_PAGES.map(pathname => `  <url><loc>${SITE_ORIGIN}${pathname}</loc></url>`).join('\n') + '\n</urlset>\n';
  writeFileSync(resolve(directory, 'sitemap.xml'), sitemap);
}
