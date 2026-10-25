<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import entries from './community-data.json';
import { communityCopy } from './community-copy';
import PhotoCompare from './PhotoCompare.vue';
import LookEngagement from './LookEngagement.vue';
import { trackCommunityDownload } from './download-statistics';
import { loadVerifiedCommunityPack, saveCommunityPack } from './community-download';
const props=defineProps({language:{type:String,required:true},assetBase:{type:String,default:'/'},submissionRequested:Boolean});
const t=computed(()=>communityCopy[props.language]);
const local=value=>typeof value==='string'?value:value[props.language];
const selected=ref(null),detailDialog=ref(null),submitDialog=ref(null),installDialog=ref(null);
let lastFocus,installFocus;
const downloading=ref('');
async function downloadPack(item){if(downloading.value)return;downloading.value=item.id;try{const blob=await loadVerifiedCommunityPack(item,props.assetBase);saveCommunityPack(blob,item.download.split('/').pop());trackCommunityDownload(item);}catch{window.alert(props.language==='zh'?'下载或校验失败，请重试。':'Download verification failed. Please retry.');}finally{downloading.value='';}}
async function openDetail(item){lastFocus=document.activeElement;selected.value=item;await nextTick();detailDialog.value.showModal();document.body.style.overflow='hidden';}
function openSubmit(){lastFocus=document.activeElement;if(!submitDialog.value.open)submitDialog.value.showModal();document.body.style.overflow='hidden';}
function openInstall(){installFocus=document.activeElement;if(!installDialog.value.open)installDialog.value.showModal();}
function afterInstallClose(){document.body.style.overflow=detailDialog.value?.open||submitDialog.value?.open?'hidden':'';installFocus?.focus?.();installFocus=null;}
function closeDialog(dialog){dialog?.close();}
function afterClose(){document.body.style.overflow='';lastFocus?.focus?.();if(location.hash==='#submit')location.hash='';}
const mailHref=computed(()=>`mailto:hello@xergnik.com?subject=${encodeURIComponent(t.value.submitSubject)}&body=${encodeURIComponent(t.value.submitBody)}`);
watch(()=>props.submissionRequested,value=>{if(value&&submitDialog.value)openSubmit();});
onMounted(()=>{if(props.submissionRequested)openSubmit();});
onBeforeUnmount(()=>{installDialog.value?.close();detailDialog.value?.close();submitDialog.value?.close();document.body.style.overflow='';});
</script>
<template>
 <main class="community-page community-compact">
  <section class="community-intro">
   <div><p class="eyebrow">{{t.kicker}}</p><h1>{{t.title}} <em>{{t.titleAccent}}</em></h1><p class="community-lead">{{t.intro}}</p></div>
   <div class="community-actions"><a class="outlined" :href="`${assetBase}community/studio/`" target="_blank" rel="noopener noreferrer">{{t.make}} <span aria-hidden="true">↗</span></a><button class="primary" @click="openSubmit">{{t.submit}} <span aria-hidden="true">＋</span></button></div>
  </section>
  <p class="community-compatibility" role="note"><span aria-hidden="true">↳</span>{{t.compatibility}}</p>
  <div class="community-section-label"><h2>{{t.collection}}</h2><span class="eyebrow">XERFILM / COMMUNITY</span></div>
  <div class="community-card-grid">
   <article v-for="item in entries" :key="item.id" class="look-card">
    <PhotoCompare :item="item" :language="language" :asset-base="assetBase" compact />
    <div class="look-card-body"><div class="look-card-title"><h2><button @click="openDetail(item)">{{item.name}}</button></h2><span v-if="item.demo" class="community-badge">{{t.demo}}</span></div>
     <div class="card-creator"><img :src="`${assetBase}${item.creator.avatar}`" :alt="item.creator.name" width="28" height="28"><span>{{item.creator.name}}</span></div>
     <p class="card-description">{{local(item.description)}}</p>
     <LookEngagement :item-id="item.id" :item-name="item.name" :language="language" />
     <div class="card-bottom"><button class="card-detail" @click="openDetail(item)">{{t.view}} <span aria-hidden="true">↗</span></button><a :href="`${assetBase}${item.download}`" :download="item.download.split('/').pop()" :aria-label="`${item.name} · ${t.download}`" @click.prevent="downloadPack(item)" :aria-busy="downloading===item.id">{{t.downloadShort}} <span aria-hidden="true">↓</span></a></div>
    </div>
   </article>
  </div>
  <section class="community-maintenance"><span aria-hidden="true">↳</span><div><h2>{{t.maintenance}}</h2><p>{{t.maintenanceDesc}}</p></div><button class="text-link" @click="openSubmit">{{t.submit}} ↗</button></section>
 </main>
 <dialog ref="detailDialog" class="community-dialog look-detail-dialog" aria-labelledby="look-detail-title" @close="afterClose" @cancel.prevent="closeDialog(detailDialog)" @click="($event.target===detailDialog)&&closeDialog(detailDialog)">
  <template v-if="selected">
   <div class="community-dialog-heading"><div><span class="eyebrow">XERFILM / SHARED LOOK</span><h2 id="look-detail-title">{{selected.name}}</h2></div><button class="community-close" :aria-label="t.close" @click="closeDialog(detailDialog)">×</button></div>
   <div class="shared-look-grid">
    <PhotoCompare :item="selected" :language="language" :asset-base="assetBase" />
    <aside class="look-details" :aria-label="selected.name">
     <div class="community-creator"><img :src="`${assetBase}${selected.creator.avatar}`" :alt="selected.creator.name" width="48" height="48"><div><small>{{t.by}}</small><strong>{{selected.creator.name}}</strong><span>{{local(selected.creator.note)}}</span></div></div>
     <p class="look-description">{{local(selected.description)}}</p><div class="look-tags"><span v-for="tag in selected.tags" :key="tag">{{tag}}</span></div>
     <dl class="look-metadata"><div><dt>{{t.package}}</dt><dd>{{selected.familyName}}</dd></div><div><dt>{{t.version}}</dt><dd>{{selected.revision}}</dd></div><div><dt>{{t.file}}</dt><dd>{{selected.size}}</dd></div></dl>
     <LookEngagement :item-id="selected.id" :item-name="selected.name" :language="language" />
     <a class="primary community-download" @click.prevent="downloadPack(selected)" :aria-busy="downloading===selected.id" :href="`${assetBase}${selected.download}`" :download="selected.download.split('/').pop()"><span>{{t.download}}</span><span aria-hidden="true">↓</span></a><p class="slot-destination">{{t.destination}}</p>
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
