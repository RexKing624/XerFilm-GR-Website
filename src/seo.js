import { SITE_VERSION } from './site-version.js';

export const SITE_ORIGIN = 'https://filmgr.xergnik.com';
export const PUBLIC_PAGES = ['/', '/community/', '/community/studio/'];

const metadata = {
  zh: {
    home: ['XerFilm GR 官网｜理光 GR III / IIIx / IV 胶片模拟固件', `XerFilm GR ${SITE_VERSION} 非官方定制固件，支持 RICOH GR III、GR IIIx、GR IV 及 HDF 机型。探索胶片模拟、ADJ 快速选择、颗粒、高光模拟、时间戳与画幅实时预览，阅读安装说明并下载。`],
    community: ['XerFilm GR 社群｜胶片效果分享与摄影作品', '发现 XerFilm GR 社群分享的胶片色彩与摄影作品，查看效果对比、使用说明，并使用胶片工作室制作自己的效果。'],
    studio: ['XerFilm GR 胶片工作室｜制作自定义胶片效果', '在浏览器中使用 XerFilm GR 胶片工作室，制作、预览并导出自定义胶片效果，供兼容的 XerFilm GR 固件导入使用。'],
  },
  en: {
    home: ['XerFilm GR | Film Simulation Firmware for Ricoh GR III, IIIx & IV', `XerFilm GR ${SITE_VERSION} unofficial custom firmware for RICOH GR III, GR IIIx, GR IV and HDF models. Explore film looks, ADJ selection, grain, highlight simulation, date stamps and live frame previews. Read the installation guide and download.`],
    community: ['XerFilm GR Community | Shared Film Looks & Photography', 'Discover shared XerFilm GR film looks and photographs, compare colours, read installation instructions and create your own look in Film Studio.'],
    studio: ['XerFilm GR Film Studio | Create Custom Film Looks', 'Create, preview and export custom film looks in your browser with XerFilm GR Film Studio, for import into compatible XerFilm GR firmware.'],
  },
  ja: {
    home: ['XerFilm GR 公式サイト｜リコー GR III / IIIx / IV 用フィルムシミュレーション', `XerFilm GR ${SITE_VERSION} は RICOH GR III・GR IIIx・GR IV と HDF モデル向けの非公式カスタムファームウェアです。フィルム表現、ADJ、粒状感、ハイライト、日付写し込み、画角プレビューの機能と導入方法をご案内します。`],
    community: ['XerFilm GR コミュニティ｜フィルム表現と写真作品', 'XerFilm GR コミュニティのフィルム表現や写真作品を紹介。色の比較、導入方法、独自のフィルム表現を作るスタジオをご覧いただけます。'],
    studio: ['XerFilm GR フィルムスタジオ｜独自のフィルム表現を作成', 'ブラウザーで XerFilm GR のフィルム表現を作成・プレビュー・書き出し。対応する XerFilm GR ファームウェアへ読み込めます。'],
  },
};

export function pageSeo(pathname = '/', language = 'zh') {
  const path = pathname === '/studio/' || pathname === '/studio' ? '/community/studio/'
    : PUBLIC_PAGES.find(page => page !== '/' && pathname.replace(/\/$/, '') === page.replace(/\/$/, '')) || '/';
  const key = path === '/' ? 'home' : path === '/community/' ? 'community' : 'studio';
  const locale = Object.hasOwn(metadata, language) ? language : 'zh';
  const [title, description] = metadata[locale][key];
  return { path, title, description, language: locale === 'zh' ? 'zh-CN' : locale, url: SITE_ORIGIN + path, image: SITE_ORIGIN + '/brand/xerfilm-gr-showcase-en.png' };
}

// Navigation and language changes must update the same metadata as the static page.
export function updatePageSeo(pathname, language) {
  const page = pageSeo(pathname, language);
  document.documentElement.lang = page.language;
  document.title = page.title;
  for (const [selector, attribute, value] of [
    ['meta[name="description"]', 'content', page.description],
    ['link[rel="canonical"]', 'href', page.url],
    ['meta[property="og:title"]', 'content', page.title],
    ['meta[property="og:description"]', 'content', page.description],
    ['meta[property="og:url"]', 'content', page.url],
    ['meta[name="twitter:title"]', 'content', page.title],
    ['meta[name="twitter:description"]', 'content', page.description],
  ]) document.querySelector(selector)?.setAttribute(attribute, value);
  const structuredData = document.querySelector('#xerfilm-page-schema');
  if (structuredData) structuredData.textContent = JSON.stringify(pageSchema(page));
}

export function pageSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': SITE_ORIGIN + '/#website', url: SITE_ORIGIN + '/', name: 'XerFilm GR', alternateName: 'XerFilm', inLanguage: ['zh-CN', 'en', 'ja'], publisher: { '@type': 'Person', name: 'XER_GNIK', url: 'https://xergnik.com/' } },
      { '@type': 'WebPage', '@id': page.url + '#webpage', url: page.url, name: page.title, description: page.description, inLanguage: page.language, isPartOf: { '@id': SITE_ORIGIN + '/#website' } },
    ],
  };
}
