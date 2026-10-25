<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { copy } from './i18n';
import films from './films.json';
import {filmPhotoFilterId,photoGalleryURL} from './photo-looks';
import {photographyCopy} from './photography-copy';
import release from './release.json';
import originalReleases from './original-releases.json';
import historicalSource from './historical-source.json';
import { loadFirmware, unlockFirmware } from './download';
import { trackFirmwareDownload } from './download-statistics';
import { cameras, fileSize, enhancedReleases, isModelAvailable } from './releases';
import EnhancedDownload from './EnhancedDownload.vue';
import CommunityGallery from './CommunityGallery.vue';
import FirmwareChoices from './FirmwareChoices.vue';
import StudioEditor from './StudioEditor.vue';
import { communityCopy } from './community-copy';
import { SITE_VERSION } from './site-version';
import {startPublicEngagement} from './public-engagement';
let stopEngagement;
onMounted(()=>{stopEngagement=startPublicEngagement();});

const readPreference = (name) => { try { return localStorage.getItem(name); } catch { return null; } };
const savePreference = (name, value) => { try { localStorage.setItem(name, value); } catch {} };
const browserLocale = navigator.language.startsWith('zh') ? 'zh' : navigator.language.startsWith('ja') ? 'ja' : 'en';
const language = ref(['zh', 'en', 'ja'].includes(readPreference('site-language')) ? readPreference('site-language') : browserLocale);
const theme = ref(['dark', 'light'].includes(readPreference('site-theme')) ? readPreference('site-theme') : 'dark');
const t = computed(() => copy[language.value]);
const ct = computed(() => communityCopy[language.value]);
const photoLabels=computed(()=>photographyCopy[language.value]);
// Keep older local bookmarks working while using one site's clean paths.
if (['#community', '#community-submit'].includes(location.hash)) history.replaceState(null, '', location.hash === '#community-submit' ? '/community/#submit' : '/community/');
if (/^\/studio\/?$/.test(location.pathname)) history.replaceState(null, '', '/community/studio/');
const currentHash = ref(location.hash);
const communityPage = ref(/^\/community\/?$/.test(location.pathname));
const studioPage = ref(/^\/community\/studio\/?$/.test(location.pathname));
const communitySection = computed(() => communityPage.value || studioPage.value);
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function syncPage() {
 const nextCommunity = /^\/community\/?$/.test(location.pathname);
 const nextStudio = /^\/community\/studio\/?$/.test(location.pathname);
 const changed = communityPage.value !== nextCommunity || studioPage.value !== nextStudio;
 currentHash.value = location.hash;
 communityPage.value = nextCommunity;
 studioPage.value = nextStudio;
 if (changed) { window.dispatchEvent(new Event('xerfilm-page-changed')); closeDrawer(); nextTick(() => window.scrollTo({ top: 0, behavior: 'instant' })); }
}
function navigateWithinSite(event) {
 if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 const link = event.target.closest?.('a[href]');
 if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
 const url = new URL(link.href, location.href);
 if (url.origin !== location.origin || !['/', '/community/', '/community/studio/'].includes(url.pathname)) return;
 if (url.pathname === location.pathname && url.hash !== location.hash && url.hash !== '#submit') return;
 event.preventDefault();
 if (url.href !== location.href) { history.pushState(null, '', url.pathname + url.search + url.hash); syncPage(); }
}
window.addEventListener('hashchange', syncPage);
window.addEventListener('popstate', syncPage);
const selectedModel = ref('gr4');
const selectedCamera = computed(() => cameras.find(camera => camera.id === selectedModel.value));
const selectedRelease = computed(() => selectedCamera.value.release);
const enhancedCopy = computed(() => ({ ...t.value, ...(t.value.enhancedModels?.[selectedModel.value] ?? {}) }));
const releaseCopy = computed(() => t.value.modelReleases[selectedModel.value]);
const password = ref('');
const passwordError = ref(false);
const unlocking = ref(false);
const decryptionKey = shallowRef(null);
let unlockAttempt = 0;
const emptyAcknowledgements = () => t.value.checks.map(() => false);
const acks = ref(emptyAcknowledgements());
const acknowledged = computed(() => acks.value.filter(Boolean).length);
const allAcknowledged = computed(() => acknowledged.value === t.value.checks.length);
const typed = ref('');
const inputHint = ref('');
const verified = computed(() => allAcknowledged.value && typed.value === t.value.phrase);
const dialog = ref(null);
const drawer = ref('');
const filter = ref('all');
const search = ref('');
const filteredFilms = computed(() => films.filter(f => (filter.value === 'all' || f.brand === filter.value) && f.name.toLowerCase().includes(search.value.trim().toLowerCase())));
const assetBase = import.meta.env.BASE_URL;
const filmIcon = id => `${import.meta.env.BASE_URL}films/${id}.png`;
const licenseURL = `${assetBase}licenses/GPL-2.0.txt`;
const historicalSourceURL = `${assetBase}${historicalSource.file}`;
const busy = ref(false);
const enhancedBusy = ref(false);
const progress = ref(0);
const downloadState = ref('');
const stockDownloadId = ref('');
let controller;
let downloadAttempt = 0;
let lastFocus;
const heroFilms = [films[11], films[0], films[10], films[6], films[16], films[14]];
const mockEnabled = ref([true, true, true, true, true, false]);
const selectedMock = ref(2);

watch(language, () => {
  acks.value = emptyAcknowledgements(); typed.value = ''; inputHint.value = '';
  closeDrawer(); savePreference('site-language', language.value);
});
watch(selectedModel, () => {
  closeDrawer();
  acks.value = emptyAcknowledgements(); typed.value = ''; inputHint.value = '';
});
watch(password, () => { passwordError.value = false; });
watch([language, communityPage, studioPage], ([value, community, studio]) => { document.documentElement.lang = value === 'zh' ? 'zh-CN' : value; document.title = `XerFilm GR ${SITE_VERSION} · ${studio ? communityCopy[value].studioNav : community ? communityCopy[value].nav : copy[value].download}`; }, { immediate: true });
watch(theme, value => { document.documentElement.dataset.theme = value; document.documentElement.style.colorScheme = value; savePreference('site-theme', value); }, { immediate: true });
watch(allAcknowledged, value => { if (!value) { typed.value = ''; if (drawer.value === 'download') closeDrawer(); } });
watch(verified, value => { if (value) openDrawer('download'); });

async function openDrawer(kind) {
  if (kind === 'download' && (!verified.value || !isModelAvailable(selectedModel.value))) return;
  lastFocus = document.activeElement;
  drawer.value = kind;
  downloadState.value = ''; stockDownloadId.value = ''; progress.value = 0;
  await nextTick();
  if (!dialog.value.open) dialog.value.showModal();
  document.body.style.overflow = 'hidden';
  dialog.value.querySelector('button')?.focus();
}
function resetPassword() { unlockAttempt++; password.value = ''; passwordError.value = false; unlocking.value = false; decryptionKey.value = null; }
function cancelDownload() { controller?.abort(); downloadAttempt++; busy.value = false; downloadState.value = ''; stockDownloadId.value = ''; }
function closeDrawer() {
  cancelDownload(); resetPassword();
  dialog.value?.close(); drawer.value = '';
  document.body.style.overflow = '';
  lastFocus?.focus?.();
}
function onDialogClose() { cancelDownload(); resetPassword(); drawer.value = ''; document.body.style.overflow = ''; }
function blockTransfer(event) { event.preventDefault(); inputHint.value = t.value.blocked; }
function beforeInput(event) { if (['insertFromPaste', 'insertFromDrop', 'insertReplacementText'].includes(event.inputType)) blockTransfer(event); }
async function downloadFirmware() {
  if (!isModelAvailable(selectedModel.value) || !verified.value || busy.value || enhancedBusy.value) return;
  const target = selectedRelease.value;
  if (target.encryption && !decryptionKey.value) return;
  const attempt = ++downloadAttempt;
  const activeController = new AbortController(); controller = activeController; busy.value = true; progress.value = 0; downloadState.value = 'downloading';
  try {
    const blob = await loadFirmware(target, { signal: activeController.signal, decryptionKey: decryptionKey.value, onProgress: value => { if (attempt !== downloadAttempt) return; progress.value = value; if (value === 1) downloadState.value = 'checking'; } });
    if (attempt !== downloadAttempt || !verified.value || drawer.value !== 'download') return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = target.filename;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    downloadState.value = 'saved';
    trackFirmwareDownload(target);
  } catch (error) { if (attempt === downloadAttempt && error.name !== 'AbortError') downloadState.value = 'failed'; }
  finally { if (attempt === downloadAttempt) busy.value = false; }
}
async function downloadOriginal(target) {
  if (!isModelAvailable(target.id) || drawer.value !== 'original' || busy.value || enhancedBusy.value) return;
  const attempt = ++downloadAttempt;
  const activeController = new AbortController(); controller = activeController;
  busy.value = true; stockDownloadId.value = target.id; progress.value = 0; downloadState.value = 'downloading';
  try {
    const blob = await loadFirmware(target, { signal: activeController.signal, onProgress: value => { if (attempt !== downloadAttempt) return; progress.value = value; if (value === 1) downloadState.value = 'checking'; } });
    if (attempt !== downloadAttempt || drawer.value !== 'original') return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = target.filename;
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); downloadState.value = 'saved'; trackFirmwareDownload(target);
  } catch (error) { if (attempt === downloadAttempt && error.name !== 'AbortError') downloadState.value = 'failed'; }
  finally { if (attempt === downloadAttempt) busy.value = false; }
}
async function unlockDownload() {
  if (!verified.value || !selectedRelease.value.encryption || unlocking.value) return;
  const attempt = ++unlockAttempt;
  unlocking.value = true; passwordError.value = false;
  try {
    const key = await unlockFirmware(selectedRelease.value, password.value);
    if (attempt !== unlockAttempt || drawer.value !== 'download' || !verified.value) return;
    decryptionKey.value = key; password.value = '';
    await nextTick(); dialog.value.querySelector('.actual-download')?.focus();
  } catch { if (attempt === unlockAttempt) passwordError.value = true; }
  finally { if (attempt === unlockAttempt) unlocking.value = false; }
}
onBeforeUnmount(() => { stopEngagement?.(); window.removeEventListener('hashchange', syncPage); window.removeEventListener('popstate', syncPage); controller?.abort(); document.body.style.overflow = ''; });
</script>

<template>
 <div id="top" class="site-shell" @click="navigateWithinSite">
  <header class="site-header">
   <a href="/" class="brand" aria-label="XerFilm GR"><img class="brand-logo" :src="`${assetBase}brand/xerfilm-gr-${theme}.svg`" alt=""><span>XerFilm GR<span class="brand-sub">BY XER_GNIK / {{ SITE_VERSION }}</span></span></a>
   <div class="header-tools">
    <nav class="primary-nav" :aria-label="ct.siteNavigation"><a class="nav-link" href="/" :aria-current="!communitySection ? 'page' : undefined">{{ ct.homeNav }}</a><span aria-hidden="true">/</span><a class="nav-link" href="/community/" :aria-current="communitySection ? 'page' : undefined">{{ ct.communityNav }}</a></nav>
    <div class="language-switch" role="group" :aria-label="t.lang"><button v-for="item in [{ id:'zh',label:'中' },{ id:'en',label:'EN' },{ id:'ja',label:'日' }]" :key="item.id" :aria-pressed="language === item.id" @click="language = item.id">{{ item.label }}</button></div>
    <button class="theme-switch" :aria-label="t.theme" :title="t.theme" @click="theme = theme === 'dark' ? 'light' : 'dark'"><svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg><svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.4A8.5 8.5 0 0 1 9.6 4a8.5 8.5 0 1 0 10.4 10.4Z"/></svg></button>
   </div>
  </header>
  <template v-if="!communitySection">
  <section class="intro">
   <div><p class="eyebrow"><span class="status-dot"></span> XerFilm GR · GR IV / III / IIIx · HDF / {{ t.edition }}</p><h1>{{ t.hero1 }}<br><em>{{ t.hero2 }}</em></h1><p class="intro-copy">{{ t.intro }}</p><FirmwareChoices :language="language" /></div>
   <div class="hero-stack" aria-hidden="true"><img v-for="(film,i) in heroFilms.slice(0,4)" :key="film.name" :src="filmIcon(film.icon)" :style="{ '--i': i }" alt=""><span class="stack-label">17 FAMILIES<br>27 WAYS TO SEE.</span></div>
  </section>
  <main class="main-layout">
   <aside id="download" class="download-panel" :aria-label="t.download">
    <div class="panel-top"><span class="eyebrow">01 / {{ t.download }}</span><span class="version-pill">{{ selectedRelease.version }}</span></div>
    <h2>{{ t.get }}</h2><p class="subtle">{{ t.getSub }}</p>
    <div class="restore-warning"><strong>{{ t.restoreWarning }}</strong><button type="button" class="original-firmware-button" @click="openDrawer('original')">{{ t.originalFirmware }} <span aria-hidden="true">↗</span></button></div>
    <div class="official-update-alert" role="note"><strong>{{ t.officialUpdateTitle }}</strong><p>{{ t.officialUpdateNotice }}</p></div>
    <fieldset class="camera-choices"><legend class="sr-only">{{ t.chooseCamera }}</legend><label v-for="camera in cameras" :key="camera.id" class="camera-choice" :class="{ checked: selectedModel === camera.id, unavailable: !isModelAvailable(camera.id) }"><input v-model="selectedModel" type="radio" :disabled="!isModelAvailable(camera.id)" name="camera-model" :value="camera.id" :data-testid="`camera-${camera.id}`"><strong>{{ camera.label }}</strong><small>{{ isModelAvailable(camera.id) ? `${camera.release.version} ${fileSize(camera.release)} · .bin` : t.downloadSuspended }}</small></label></fieldset>
    <p v-if="cameras.some(camera => !isModelAvailable(camera.id))" class="download-suspension" role="status">{{ t.downloadSuspensionNotice }}</p>
    <div class="terms"><section><h3><span>!</span>{{ t.riskTitle }}</h3><p>{{ t.risk }}</p><p>{{ t.compatibility }}</p></section><section class="reset-warning" role="note"><h3><span>!</span>{{ t.resetTitle }}</h3><p>{{ t.resetWarning }}</p><strong class="reset-menu-path">{{ t.resetPath }}</strong><p class="reset-settings-note">{{ t.resetSettingsNote }}</p></section><section><h3>{{ t.communityTitle }}</h3><p>{{ t.community }}</p><p class="license-note">{{ t.license }}</p></section></div>
    <fieldset class="acknowledgements"><legend class="sr-only">{{ t.getSub }}</legend><label v-for="(label,i) in t.checks" :key="i" :class="{ checked: acks[i] }"><input v-model="acks[i]" type="checkbox" required :data-testid="`ack-${i}`"><span class="custom-check" aria-hidden="true">{{ acks[i] ? '✓' : '' }}</span><span>{{ label }}</span></label></fieldset>
    <div class="ack-progress"><span>{{ acknowledged }}/{{ t.checks.length }} {{ t.acknowledged }}</span><span class="mini-bars"><i v-for="i in t.checks.length" :key="i" :class="{ done: acknowledged >= i }"></i></span></div>
    <div v-if="allAcknowledged && isModelAvailable(selectedModel)" class="manual-confirm"><label for="confirmation">{{ t.typeTitle }}</label><p>{{ t.typeHelp }}</p><p class="confirmation-phrase" @copy.prevent @cut.prevent @contextmenu.prevent @dragstart.prevent>{{ t.phrase }}</p><input id="confirmation" v-model="typed" :placeholder="t.placeholder" :aria-describedby="'confirmation-hint'" autocomplete="off" autocorrect="off" autocapitalize="off" :spellcheck="false" @paste="blockTransfer" @copy.prevent @cut.prevent @drop="blockTransfer" @dragover.prevent @contextmenu.prevent @beforeinput="beforeInput" @input="inputHint = ''"><p id="confirmation-hint" role="status" class="input-hint">{{ inputHint || (verified ? t.valid : t.typing) }}</p></div>
    <button class="primary request-button" :disabled="!verified || !isModelAvailable(selectedModel)" @click="openDrawer('download')"><span>{{ !isModelAvailable(selectedModel) ? t.downloadSuspended : verified ? t.request : allAcknowledged ? t.typeTitle : t.locked }}</span><span aria-hidden="true">↗</span></button>
    <p class="gate-note">{{ t.manualOnly }}</p>
   </aside>
   <div id="features" class="features">
    <div class="section-heading"><p class="eyebrow">02 / {{ t.featureKicker }}</p><h2>{{ t.featureTitle }}</h2></div>
    <section class="film-feature">
     <div class="feature-top"><div><span class="tiny-number">01—</span><h3>{{ t.filmTitle }}</h3></div><img class="entry-icon" :src="filmIcon(732)" alt="FILM"></div>
     <p class="feature-copy">{{ t.filmDesc }}</p>
     <div class="film-strip"><a v-for="film in heroFilms" :key="film.name" :href="photoGalleryURL(filmPhotoFilterId(film))" :aria-label="`${film.name} · ${photoLabels.viewPhotos}`"><img :src="filmIcon(film.icon)" :alt="film.name"><span>{{ film.name }}</span></a></div>
     <div class="film-feature-bottom"><div class="stats"><span><b>17</b>{{ t.familyUnit }}</span><span><b>27</b>{{ t.lookUnit }}</span></div><button class="outlined" @click="openDrawer('films')">{{ t.viewFilms }} <span aria-hidden="true">↗</span></button></div>
     <div class="curated"><span aria-hidden="true">↳</span><div class="curated-copy"><strong>{{ t.curatedTitle }}</strong><p>{{ t.curated }}</p><small>{{ ct.compatibility }}</small></div><div class="curated-actions"><a class="outlined community-entry" href="/community/">{{ ct.explore }} <span aria-hidden="true">↗</span></a></div></div>
    </section>
    <section class="interaction-feature"><div class="interaction-copy"><span class="tiny-number">02—</span><h3>{{ t.adjTitle }}</h3><p>{{ t.adjDesc }}</p><h4>{{ t.listTitle }}</h4><p>{{ t.listDesc }}</p></div><div class="camera-demo"><div class="demo-title"><img :src="filmIcon(732)" alt="FILM"><span>FILM LIST</span><span class="demo-dot"></span></div><p class="demo-caption">{{ t.demo }}</p><div class="demo-grid"><button v-for="(film,i) in heroFilms" :key="film.name" :class="{ selected:selectedMock === i, off:!mockEnabled[i] }" :aria-label="film.name" :aria-pressed="mockEnabled[i]" @click="selectedMock = i; mockEnabled[i] = !mockEnabled[i]"><img :src="filmIcon(film.icon)" :alt="film.name"><span v-if="mockEnabled[i]" class="demo-check">✓</span></button></div><div class="demo-bottom"><span>{{ heroFilms[selectedMock].name }}</span><span>OK <b>↵</b></span></div></div></section>
    <div id="finishing" class="two-features effect-features">
     <section><span class="tiny-number">03—</span><h3>{{ t.grainTitle }}</h3><div class="grain-samples" aria-hidden="true"><div v-for="(level,i) in t.grainLevels" :key="i" :class="`grain-${i}`"><span>{{ level }}</span></div></div><p>{{ t.grainDesc }}</p></section>
     <section><span class="tiny-number">04—</span><h3>{{ t.highlightTitle }}</h3><div class="highlight-samples"><figure v-for="sample in [{ file: 'highlight-white.jpg', label: t.highlightWhite }, { file: 'highlight-red-800t.jpg', label: t.highlightRed }]" :key="sample.file"><img :src="`${assetBase}examples/${sample.file}`" :alt="sample.label" loading="lazy"><figcaption>{{ sample.label }}</figcaption></figure></div><p>{{ t.highlightDesc }}</p><small class="example-note highlight-notes"><span>{{ t.highlightNote }}</span><span class="playback-note">{{ t.highlightPlaybackNote }}</span></small></section>
    </div>
    <div class="two-features framing-features">
     <section><span class="tiny-number">05—</span><h3>{{ t.stampTitle }}</h3><figure class="stamp-sample"><div class="date-sample" aria-hidden="true"><span>26.10.17</span><span>14:36</span></div><figcaption>{{ t.stampCaption }}</figcaption></figure><p>{{ t.stampDesc }}</p></section>
     <section><span class="tiny-number">06—</span><h3>{{ t.frameTitle }}</h3><figure class="frame-sample" :aria-label="t.frameAlt"><div class="frame-stage"><div class="frame-view"><img :src="`${assetBase}examples/frame-seaside.jpg`" alt="" loading="lazy"><div class="frame-native-grid" aria-hidden="true"></div><div class="frame-mask frame-mask-top" aria-hidden="true"></div><div class="frame-mask frame-mask-bottom" aria-hidden="true"></div><div class="frame-boundary" aria-hidden="true"></div><span class="frame-format" aria-hidden="true">XPAN <span>65:24</span></span></div></div><figcaption>{{ t.frameCaption }}</figcaption></figure><p>{{ releaseCopy.frameDesc || t.frameDesc }}</p><small class="example-note">{{ t.frameIndependent }}</small></section>
    </div>
    <section class="raw-feature"><span class="raw-symbol">RAW<span>+</span>JPG</span><div><h3>{{ t.rawTitle }}</h3><p>{{ t.rawDesc }}</p></div></section>
    <section class="changelog"><div class="release-heading"><span class="eyebrow">03 / {{ releaseCopy.changesTitle }}</span><b>{{ selectedRelease.version }}</b></div><p class="release-compat">{{ releaseCopy.compatible }}</p><ul><li v-for="item in releaseCopy.changes" :key="item">{{ item }}</li></ul></section>
   </div>
  </main>
  </template>
  <CommunityGallery v-else-if="communityPage" :language="language" :asset-base="assetBase" :submission-requested="currentHash === '#submit'" />
  <StudioEditor v-else :language="language" :theme="theme" />
  <footer class="site-footer"><div class="footer-main"><a href="https://xergnik.com/">© 2026 XER_GNIK <span>↗</span></a><div><p>{{ t.location }}</p></div><div><a class="footer-email" href="mailto:hello@xergnik.com">hello@xergnik.com</a></div><div class="footer-support"><a href="https://xergnik.com/support/" target="_blank" rel="noopener noreferrer">{{ t.support }} <span>↗</span></a></div></div><div v-if="!communitySection" class="footer-bottom"><p>{{ t.footerNote }}</p><div class="source-links"><a class="project-source" href="https://github.com/RexKing624/XerFilm-GR-Website" target="_blank" rel="noopener noreferrer">{{ t.projectSource }} ↗</a><details class="firmware-source"><summary>{{ t.firmwareSource }}</summary><a class="project-source" :href="historicalSourceURL" :title="t.historicalSourceNote" download="XerFilm-GR-V1.1-source.zip">V1.1 ↓</a></details></div><details><summary>{{ t.licenses }}</summary><p>{{ t.origin }}</p><div class="credit-links"><a :href="licenseURL" target="_blank" rel="noopener">GPL-2.0</a><a href="https://github.com/Maxwooow/Ricoh-GRMod" target="_blank" rel="noopener">Ricoh-GRMod</a><a href="https://github.com/DoYitNow/gr-custom-tool" target="_blank" rel="noopener">gr-custom-tool</a></div></details><a :href="communityPage ? '/community/#top' : '/#top'" :aria-label="t.home" @click.prevent="scrollToTop">↑</a></div></footer>

  <dialog ref="dialog" class="drawer" :class="{ 'download-drawer':drawer === 'download' }" :aria-labelledby="'drawer-title'" @close="onDialogClose" @cancel.prevent="closeDrawer" @click="($event.target === dialog) && closeDrawer()">
   <div class="drawer-surface">
    <div class="drawer-header"><div><span class="eyebrow">{{ `${drawer === 'original' ? 'ORIGINAL FIRMWARE' : drawer === 'films' ? 'FILM CATALOG' : 'DOWNLOAD'} / ${drawer === 'original' ? 'BACKUPS' : selectedRelease.version}` }}</span><h2 id="drawer-title">{{ drawer === 'original' ? t.originalTitle : drawer === 'films' ? t.library : selectedCamera.label }}</h2></div><button class="close-button" :aria-label="t.close" @click="closeDrawer">✕</button></div>
    <template v-if="drawer === 'films'">
     <p class="drawer-intro">{{ t.libraryIntro }}</p><div class="catalog-toolbar"><div class="filters" role="group" :aria-label="t.library"><button v-for="brand in ['all','FUJIFILM','KODAK']" :key="brand" :class="{ active:filter === brand }" :aria-pressed="filter === brand" @click="filter = brand">{{ brand === 'all' ? t.all : brand }}</button></div><input v-model="search" type="search" :placeholder="t.search" :aria-label="t.search"></div><p class="catalog-count">{{ t.count }}</p>
     <div class="catalog-grid"><article v-for="film in filteredFilms" :key="film.name" class="catalog-film"><a class="catalog-family catalog-film-link" :href="photoGalleryURL(filmPhotoFilterId(film))" :aria-label="`${film.name} · ${photoLabels.viewPhotos}`"><img :src="filmIcon(film.icon)" :alt="film.name"><div><span>{{ film.brand }}</span><h3>{{ film.name }}</h3></div><span class="catalog-photo-arrow" aria-hidden="true">↗</span></a><div v-if="film.variants.length" class="variants"><span>{{ t.variants }}</span><a class="variant catalog-film-link" v-for="variant in film.variants" :key="variant.name" :href="photoGalleryURL(`builtin-${variant.icon}`)" :aria-label="`${film.name} ${variant.name} · ${photoLabels.viewPhotos}`"><img :src="filmIcon(variant.icon)" :alt="`${film.name} ${variant.name}`"><span>{{ variant.name }}</span></a></div></article></div><p v-if="!filteredFilms.length" class="empty">{{ t.noResult }}</p><div class="catalog-footer">{{ t.curated }} {{ ct.compatibility }}</div>
    </template>
    <template v-if="drawer === 'original'">
     <p class="drawer-intro">{{ t.originalIntro }}</p>
     <div class="official-update-alert" role="note"><strong>{{ t.officialUpdateTitle }}</strong><p>{{ t.officialUpdateNotice }}</p></div>
     <div class="original-firmware-grid"><article v-for="stock in originalReleases" :key="stock.id" class="original-firmware-card">
      <h3>{{ stock.label }}</h3><p>{{ t.originalVersion }} {{ stock.version }} · {{ fileSize(stock) }}</p><code>{{ stock.filename }}</code>
      <button class="outlined" type="button" :disabled="!isModelAvailable(stock.id) || busy || enhancedBusy" @click="downloadOriginal(stock)">{{ !isModelAvailable(stock.id) ? t.downloadSuspended : busy && stockDownloadId === stock.id ? t[downloadState] : t.originalDownload }} <span aria-hidden="true">↓</span></button>
      <template v-if="stockDownloadId === stock.id"><progress v-if="busy" :value="progress" max="1" :aria-label="t.downloading"></progress><div class="download-feedback" aria-live="polite"><span>{{ t[downloadState] }} {{ busy ? `${Math.round(progress*100)}%` : '' }}</span><button v-if="busy" class="text-link" @click="cancelDownload">{{ t.cancel }}</button></div></template>
      <details class="original-checksum"><summary>{{ t.checksum }}</summary><code>{{ stock.sha256 }}</code></details>
     </article></div><p class="download-hint">{{ t.originalBackupOnly }}</p>
    </template>
    <template v-if="drawer === 'download' && isModelAvailable(selectedModel)">
     <p class="drawer-intro">{{ t.downloadIntro }}</p>
     <dl class="file-details"><div><dt>{{ t.camera }}</dt><dd>RICOH {{ selectedCamera.label }}</dd></div><div><dt>{{ t.release }}</dt><dd>{{ selectedRelease.version }}</dd></div><div><dt>{{ t.filename }}</dt><dd>{{ selectedRelease.filename }}</dd></div><div><dt>{{ t.sizeLabel }}</dt><dd>{{ fileSize(selectedRelease) }} · {{ selectedRelease.size.toLocaleString('en-US') }} bytes</dd></div></dl><p class="release-description">{{ releaseCopy.note }}</p>
     <p v-if="releaseCopy.rollback" class="release-rollback">{{ releaseCopy.rollback }}</p>
     <div class="checksum"><span>{{ t.checksum }}</span><code>{{ selectedRelease.sha256 }}</code></div>
     <form v-if="selectedRelease.encryption && !decryptionKey" class="model-password" @submit.prevent="unlockDownload"><label for="download-password">{{ t.downloadPassword }}</label><p>{{ t.downloadPasswordHelp }}</p><input id="download-password" v-model="password" type="password" inputmode="numeric" autocomplete="off" :placeholder="t.downloadPasswordPlaceholder" :aria-invalid="passwordError" :aria-describedby="passwordError ? 'download-password-error' : undefined" :disabled="unlocking" required><p v-if="passwordError" id="download-password-error" class="enhanced-error" role="alert">{{ t.downloadPasswordError }}</p><button class="outlined" type="submit" :disabled="unlocking || !verified">{{ unlocking ? t.checkingPassword : t.unlockDownload }} <span aria-hidden="true">↗</span></button></form>
     <template v-else><button class="primary actual-download" :disabled="busy || enhancedBusy || !verified" @click="downloadFirmware"><span>{{ busy ? t[downloadState] : t.downloadFile }}</span><span aria-hidden="true">↓</span></button><progress v-if="busy" :value="progress" max="1" :aria-label="t.downloading"></progress><div class="download-feedback" aria-live="polite"><span v-if="downloadState">{{ t[downloadState] }} {{ busy ? `${Math.round(progress*100)}%` : '' }}</span><button v-if="busy" class="text-link" @click="cancelDownload">{{ t.cancel }}</button></div></template>
     <p class="download-hint">{{ t.downloadHint.replace('{filename}', selectedRelease.filename) }}</p>
     <EnhancedDownload :key="selectedModel" :release="enhancedReleases[selectedModel]" :t="enhancedCopy" :verified="verified" :base-busy="busy" @busy="enhancedBusy = $event" />
    </template>
   </div>
  </dialog>
 </div>
</template>
