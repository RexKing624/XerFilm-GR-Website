<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import entries from './community-data.json';
import { communityCopy } from './community-copy';
import PhotoCompare from './PhotoCompare.vue';
import PhotographyGallery from './PhotographyGallery.vue';
import {photographyCopy} from './photography-copy';
import {findPhotoLook} from './photo-looks';
import LookEngagement from './LookEngagement.vue';
import { trackCommunityDownload } from './download-statistics';
import { loadVerifiedCommunityPack, saveCommunityPack } from './community-download';
const props=defineProps({language:{type:String,required:true},assetBase:{type:String,default:'/'},submissionRequested:Boolean});
const t=computed(()=>communityCopy[props.language]);
const pt=computed(()=>photographyCopy[props.language]);
const galleryRoute=ref({tab:'photos',photo:'',look:'',fromLook:'',q:'',camera:''}),photography=ref(null);
const photoView=computed(()=>galleryRoute.value.tab==='photos');
function readRoute(){const q=new URLSearchParams(location.search);return {tab:q.has('photo')?'photos':q.has('look')?'looks':q.get('tab')==='looks'?'looks':'photos',photo:q.get('photo')||'',look:q.get('look')||'',fromLook:q.get('fromLook')||'',q:q.get('q')||'',camera:q.get('camera')||''};}
async function syncRoute(){galleryRoute.value=readRoute();const item=findPhotoLook(galleryRoute.value.look);if(item)await showDetail(item);else detailDialog.value?.close();}
function navigateGallery(values,{replace=false}={}){const url=new URL(location.href);for(const [key,value] of Object.entries(values))value?url.searchParams.set(key,value):url.searchParams.delete(key);if(url.href!==location.href)history[replace?'replaceState':'pushState'](null,'',url.pathname+url.search+url.hash);void syncRoute();}
function changePhotoFilters(values){navigateGallery({...values,photo:''},{replace:Object.hasOwn(values,'q')});}
function clearPhotoFilters(){navigateGallery({fromLook:'',q:'',camera:''});}
function switchSection(tab){navigateGallery({tab,photo:'',look:'',fromLook:'',q:'',camera:''});}
function openDetail(item){if(!item)return;navigateGallery({tab:'looks',look:item.id,photo:'',fromLook:''});}
function openRelatedPhotos(id){navigateGallery({tab:'photos',look:'',photo:'',fromLook:id,q:'',camera:''});}
function openPhoto(id){navigateGallery({tab:'photos',photo:id,look:''});}
function openSubmission(){if(photoView.value)photography.value?.openSubmit();else openSubmit();}
const local=value=>typeof value==='string'?value:value[props.language];
const selected=ref(null),detailDialog=ref(null),submitDialog=ref(null),installDialog=ref(null);
let lastFocus,installFocus;
const downloading=ref('');
async function downloadPack(item){if(downloading.value)return;downloading.value=item.id;try{const blob=await loadVerifiedCommunityPack(item,props.assetBase);saveCommunityPack(blob,item.download.split('/').pop());trackCommunityDownload(item);}catch{window.alert(props.language==='zh'?'下载或校验失败，请重试。':'Download verification failed. Please retry.');}finally{downloading.value='';}}
async function showDetail(item){lastFocus=document.activeElement;selected.value=item;await nextTick();if(!detailDialog.value.open)detailDialog.value.showModal();document.body.style.overflow='hidden';}
function openSubmit(){lastFocus=document.activeElement;if(!submitDialog.value.open)submitDialog.value.showModal();document.body.style.overflow='hidden';}
function openInstall(){installFocus=document.activeElement;if(!installDialog.value.open)installDialog.value.showModal();}
function afterInstallClose(){document.body.style.overflow=detailDialog.value?.open||submitDialog.value?.open?'hidden':'';installFocus?.focus?.();installFocus=null;}
function closeDialog(dialog){dialog?.close();}
function afterClose(event){document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';lastFocus?.focus?.();if(event?.target===detailDialog.value&&galleryRoute.value.look)navigateGallery({look:''});if(location.hash==='#submit')location.hash='';}
const mailHref=computed(()=>`mailto:hello@xergnik.com?subject=${encodeURIComponent(t.value.submitSubject)}&body=${encodeURIComponent(t.value.submitBody)}`);
watch(()=>props.submissionRequested,value=>{if(value&&submitDialog.value)openSubmission();});
onMounted(()=>{window.addEventListener('popstate',syncRoute);void syncRoute();if(props.submissionRequested)openSubmission();});
onBeforeUnmount(()=>{window.removeEventListener('popstate',syncRoute);installDialog.value?.close();detailDialog.value?.close();submitDialog.value?.close();document.body.style.overflow='';});
</script>
<template>
 <main class="community-page community-compact">
  <section class="community-intro">
   <div><p class="eyebrow">{{photoView?'COMMUNITY / PHOTOGRAPHY':t.kicker}}</p><h1>{{photoView?pt.title:t.title}} <em>{{photoView?pt.accent:t.titleAccent}}</em></h1><p class="community-lead">{{photoView?pt.intro:t.intro}}</p></div>
   <div class="community-actions"><a class="outlined" :href="`${assetBase}community/studio/`" target="_blank" rel="noopener noreferrer">{{t.make}} <span aria-hidden="true">↗</span></a><button class="primary" @click="openSubmission">{{photoView?pt.submit:t.submit}} <span aria-hidden="true">＋</span></button></div>
  </section>
  <div class="community-view-tabs" role="group" :aria-label="t.nav"><button :class="{active:photoView}" :aria-pressed="photoView" @click="switchSection('photos')">{{pt.photos}} <span>01</span></button><button :class="{active:!photoView}" :aria-pressed="!photoView" @click="switchSection('looks')">{{pt.looks}} <span>02</span></button></div>
  <PhotographyGallery ref="photography" v-show="photoView" :language="language" :asset-base="assetBase" :photo-id="galleryRoute.photo" :look-filter="galleryRoute.fromLook" :search-query="galleryRoute.q" :camera-filter="galleryRoute.camera" @open-photo="openPhoto" @close-photo="navigateGallery({photo:''})" @open-look="id=>openDetail(findPhotoLook(id))" @clear-filter="clearPhotoFilters" @change-filters="changePhotoFilters" />
  <template v-if="!photoView">
  <p class="community-compatibility" role="note"><span aria-hidden="true">↳</span>{{t.compatibility}}</p>
  <div class="community-section-label"><h2>{{t.collection}}</h2><span class="eyebrow">XERFILM / COMMUNITY</span></div>
  <div class="community-card-grid">
   <article v-for="item in entries" :key="item.id" class="look-card">
    <PhotoCompare :item="item" :language="language" :asset-base="assetBase" compact />
    <div class="look-card-body"><div class="look-card-title"><h2><button @click="openDetail(item)">{{item.name}}</button></h2><span v-if="item.demo" class="community-badge">{{t.demo}}</span></div>
     <div class="card-creator"><img :src="`${assetBase}${item.creator.avatar}`" :alt="item.creator.name" width="28" height="28"><span>{{item.creator.name}}</span></div>
     <p class="card-description">{{local(item.description)}}</p>
     <div class="card-bottom"><button class="card-detail" @click="openDetail(item)">{{t.view}} <span aria-hidden="true">↗</span></button><div class="card-actions"><LookEngagement :item-id="item.id" :item-name="item.name" :language="language" /><a :href="`${assetBase}${item.download}`" :download="item.download.split('/').pop()" :aria-label="`${item.name} · ${t.download}`" @click.prevent="downloadPack(item)" :aria-busy="downloading===item.id">{{t.downloadShort}} <span aria-hidden="true">↓</span></a></div></div>
    </div>
   </article>
  </div>
  </template>
  <section class="community-maintenance"><span aria-hidden="true">↳</span><div><h2>{{t.maintenance}}</h2><p>{{t.maintenanceDesc}}</p></div><button class="text-link" @click="openSubmission">{{photoView?pt.submit:t.submit}} ↗</button></section>
 </main>
 <dialog ref="detailDialog" class="community-dialog look-detail-dialog" aria-labelledby="look-detail-title" @close="afterClose" @cancel.prevent="closeDialog(detailDialog)" @click="($event.target===detailDialog)&&closeDialog(detailDialog)">
  <template v-if="selected">
   <div class="community-dialog-heading"><div><span class="eyebrow">XERFILM / SHARED LOOK</span><h2 id="look-detail-title">{{selected.name}}</h2></div><button class="community-close" :aria-label="t.close" @click="closeDialog(detailDialog)">×</button></div>
   <div v-if="selected.kind==='builtin'" class="builtin-look-detail"><img :src="`${assetBase}films/${selected.icon}.png`" :alt="selected.name" width="96" height="96"><div><span class="eyebrow">{{selected.brand}} / {{pt.builtinsTitle}}</span><h3>{{selected.name}}</h3><p>{{pt.builtinIncluded}}</p><p>{{pt.builtinsIntro}}</p><div class="builtin-look-actions"><a class="text-link" :href="`${assetBase}#download`">{{pt.firmware}} ↗</a><a class="text-link" :href="`?tab=photos&fromLook=${selected.id}`" @click.prevent="openRelatedPhotos(selected.id)">{{pt.viewPhotos}} ↗</a></div></div></div>
   <div v-else class="shared-look-grid">
    <PhotoCompare :item="selected" :language="language" :asset-base="assetBase" />
    <aside class="look-details" :aria-label="selected.name">
     <div class="community-creator"><img :src="`${assetBase}${selected.creator.avatar}`" :alt="selected.creator.name" width="48" height="48"><div class="creator-identity"><small>{{t.by}}</small><strong>{{selected.creator.name}}</strong><span>{{local(selected.creator.note)}}</span></div><LookEngagement class="creator-engagement" :item-id="selected.id" :item-name="selected.name" :language="language" /></div>
     <p class="look-description">{{local(selected.description)}}</p><div class="look-tags"><span v-for="tag in selected.tags" :key="tag">{{tag}}</span></div>
     <dl class="look-metadata"><div><dt>{{t.package}}</dt><dd>{{selected.familyName}}</dd></div><div><dt>{{t.version}}</dt><dd>{{selected.revision}}</dd></div><div><dt>{{t.file}}</dt><dd>{{selected.size}}</dd></div></dl>
     <a class="primary community-download" @click.prevent="downloadPack(selected)" :aria-busy="downloading===selected.id" :href="`${assetBase}${selected.download}`" :download="selected.download.split('/').pop()"><span>{{t.download}}</span><span aria-hidden="true">↓</span></a><p class="slot-destination">{{t.destination}}</p>
     <a class="photo-related-link" :href="`?tab=photos&fromLook=${selected.id}`" @click.prevent="openRelatedPhotos(selected.id)"><small>{{pt.related}}</small><strong>{{pt.viewPhotos}} <span>↗</span></strong></a>
     <button class="community-install" type="button" aria-haspopup="dialog" aria-controls="community-install-dialog" @click="openInstall">{{t.install}} <span aria-hidden="true">+</span></button>
    </aside>
   </div>
  </template>
 </dialog>
 <dialog id="community-install-dialog" ref="installDialog" class="community-dialog install-dialog" aria-labelledby="install-title" @close="afterInstallClose" @cancel.prevent="closeDialog(installDialog)" @click="($event.target===installDialog)&&closeDialog(installDialog)">
  <div class="community-dialog-heading"><h2 id="install-title">{{t.install}}</h2><button class="community-close" :aria-label="t.close" @click="closeDialog(installDialog)">×</button></div>
  <ol class="install-steps"><li v-for="step in t.steps" :key="step">{{step}}</li></ol>
  <p class="install-slot-help">{{t.slotHelp}}</p>
 </dialog>
 <dialog ref="submitDialog" class="community-dialog submission-dialog" aria-labelledby="submission-title" @close="afterClose" @cancel.prevent="closeDialog(submitDialog)" @click="($event.target===submitDialog)&&closeDialog(submitDialog)">
  <div class="community-dialog-heading"><div><span class="eyebrow">COMMUNITY / SUBMIT</span><h2 id="submission-title">{{t.submitTitle}}</h2></div><button class="community-close" :aria-label="t.close" @click="closeDialog(submitDialog)">×</button></div>
  <p class="submission-lead">{{t.submitIntro}}</p>
  <ol class="submission-checklist"><li v-for="(item,i) in t.submitRequirements" :key="item.title"><span>{{String(i+1).padStart(2,'0')}}</span><div><h3>{{item.title}}</h3><p>{{item.detail}}</p></div></li></ol>
  <p class="submission-note">{{t.submitNote}}</p>
  <a class="primary submission-mail" :href="mailHref">{{t.emailSubmit}} <span aria-hidden="true">↗</span></a>
  <p class="submission-address">hello@xergnik.com · {{t.mailNote}}</p>
  <a class="text-link submission-studio" :href="`${assetBase}community/studio/`" target="_blank" rel="noopener noreferrer">{{t.makeFirst}} ↗</a>
 </dialog>
</template>
