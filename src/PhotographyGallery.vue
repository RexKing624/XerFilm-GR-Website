<script setup>
import {computed,nextTick,onBeforeUnmount,ref,watch} from 'vue';
import initialPhotos from './photography-data.json';
import {builtinPhotoLooks,builtinPhotoFilters,communityPhotoLooks,findPhotoLook,findPhotoFilter,photoLookMetadata} from './photo-looks';
import {photographyCopy} from './photography-copy';
import {filterPhotographs} from './photo-filters';
import {inspectPhotoSubmission,createPhotoSubmission,PHOTO_MAX_BYTES} from './photo-submission';
const props=defineProps({language:String,assetBase:String,photoId:String,lookFilter:String,searchQuery:String,cameraFilter:String});
const emit=defineEmits(['open-photo','close-photo','open-look','clear-filter','change-filters']);
const t=computed(()=>photographyCopy[props.language]);
const local=value=>typeof value==='string'?value:value?.[props.language]||'';
const photos=ref([...initialPhotos]),photoDialog=ref(null),submitDialog=ref(null),liked=ref([]);
try{const saved=JSON.parse(localStorage.getItem('xerfilm-photo-preview-likes')||'[]');if(Array.isArray(saved))liked.value=saved.filter(x=>typeof x==='string');}catch{}
const selected=computed(()=>photos.value.find(x=>x.id===props.photoId));
const linkedLook=computed(()=>findPhotoLook(selected.value?.lookId));
const filterLook=computed(()=>findPhotoFilter(props.lookFilter));
const visiblePhotos=computed(()=>filterPhotographs(photos.value,{lookId:props.lookFilter,query:props.searchQuery,camera:props.cameraFilter}));
const hasFilters=computed(()=>!!(props.lookFilter||props.searchQuery||props.cameraFilter));
const source=path=>path?.startsWith('blob:')?path:props.assetBase+path;
let lastFocus,formFocus;
watch(()=>props.photoId,async()=>{if(selected.value){lastFocus=document.activeElement;await nextTick();if(!photoDialog.value.open)photoDialog.value.showModal();document.body.style.overflow='hidden';}else photoDialog.value?.close();},{immediate:true});
function photoClosed(){if(props.photoId)emit('close-photo');document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';lastFocus?.focus?.();}
function toggleLike(id){liked.value=liked.value.includes(id)?liked.value.filter(x=>x!==id):[...liked.value,id];try{localStorage.setItem('xerfilm-photo-preview-likes',JSON.stringify(liked.value));}catch{}}
function openSubmit(){const selectedFilter=findPhotoFilter(props.lookFilter);if(selectedFilter)form.value.lookId=selectedFilter.kind==='family'?selectedFilter.lookIds[0]:selectedFilter.id;formFocus=document.activeElement;submitDialog.value.showModal();document.body.style.overflow='hidden';}
function submitClosed(){document.body.style.overflow=photoDialog.value?.open?'hidden':'';formFocus?.focus?.();}
const form=ref({name:'',title:'',description:'',camera:'',hdf:false,lookId:builtinPhotoLooks[0].id,film:'',frame:'',grain:'',highlight:'',consent:false});
const imageFile=ref(null),avatarFile=ref(null),infoFile=ref(null),imageURL=ref(''),avatarURL=ref(''),error=ref(''),message=ref(''),busy=ref(false),packReady=ref(false);
const urls=new Set();const previewId=crypto.randomUUID();
watch(form,()=>{packReady.value=false;error.value='';message.value='';},{deep:true});
async function chooseFile(event,kind='photo'){
 const file=event.target.files?.[0];if(!file)return;
 const target=kind==='info'?infoFile:kind==='avatar'?avatarFile:imageFile;
 const preview=kind==='info'?null:kind==='avatar'?avatarURL:imageURL;
 const issue=kind==='info'?'needInfo':kind==='avatar'?'needAvatar':'needPhoto';
 target.value=null;if(preview)preview.value='';error.value='';message.value='';packReady.value=false;
 const limit=kind==='photo'?PHOTO_MAX_BYTES:(kind==='info'?10:5)*1024*1024;
 const types=kind==='photo'?['image/jpeg']:['image/jpeg','image/png'];
 if(!types.includes(file.type)||file.size>limit||!file.size){error.value=t.value[issue];event.target.value='';return;}
 const url=URL.createObjectURL(file);urls.add(url);
 try{await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url;});target.value=file;if(preview)preview.value=url;else{URL.revokeObjectURL(url);urls.delete(url);}}
 catch{URL.revokeObjectURL(url);urls.delete(url);error.value=t.value.readError;event.target.value='';}
}
function checked(){const issue=inspectPhotoSubmission(form.value,imageFile.value,avatarFile.value,infoFile.value);error.value=issue?t.value[issue]:'';return !issue;}
function preview(){if(!checked())return;const data={...form.value,id:previewId,title:form.value.title.trim(),description:form.value.description.trim(),...photoLookMetadata(form.value.lookId,form.value.film),creator:{name:form.value.name.trim(),avatar:avatarURL.value||'community/avatars/default-photographer.svg'},image:imageURL.value,demo:false,preview:true};photos.value=photos.value.filter(x=>x.id!==previewId);photos.value.unshift(data);submitDialog.value.close();emit('clear-filter');emit('open-photo',previewId);}
async function download(){if(!checked()||busy.value)return;busy.value=true;error.value='';try{const blob=await createPhotoSubmission(form.value,imageFile.value,avatarFile.value,infoFile.value);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='XerFilm-photo-submission.zip';submitDialog.value.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);packReady.value=true;message.value=t.value.ready;}catch{error.value=t.value.readError;}finally{busy.value=false;}}
const mailHref=computed(()=>{const data={...form.value,camera:cameraName(form.value),film:photoLookMetadata(form.value.lookId,form.value.film).film};return 'mailto:hello@xergnik.com?subject='+encodeURIComponent(t.value.mailSubject)+'&body='+encodeURIComponent(t.value.mailBody.replace(/\{(\w+)\}/g,(_,key)=>data[key]||'—'));});
function cameraName(photo){return photo.hdf?(photo.camera?photo.camera+' · HDF':'HDF'):photo.camera||t.value.notProvided;}
function setting(value){return t.value[value]||value||t.value.notProvided;}
onBeforeUnmount(()=>{photoDialog.value?.close();submitDialog.value?.close();urls.forEach(url=>URL.revokeObjectURL(url));document.body.style.overflow='';});
defineExpose({openSubmit});
</script>
<template>
 <div class="photography-gallery">
 <section class="photography-section" :aria-label="t.photos">
  <div class="community-section-label"><h2>{{filterLook?t.filter+' · '+filterLook.name:t.collection}} <span class="photo-count">{{visiblePhotos.length}}</span></h2><button v-if="hasFilters" class="text-link" @click="emit('clear-filter')">{{t.clearFilters}} ↗</button><span v-else class="eyebrow">XERFILM / PHOTOGRAPHY</span></div>
  <div class="photo-filter-toolbar"><label class="photo-search"><span>{{t.search}}</span><input type="search" :value="searchQuery||''" :placeholder="t.searchHint" @input="emit('change-filters',{q:$event.target.value})"></label><label><span>{{t.filmFilter}}</span><select :value="lookFilter||''" @change="emit('change-filters',{fromLook:$event.target.value})"><option value="">{{t.allFilms}}</option><optgroup :label="t.builtin"><option v-for="look in builtinPhotoFilters" :key="look.id" :value="look.id">{{look.name}}{{look.kind==='family'?' · '+t.familyAll:''}}</option></optgroup><optgroup :label="t.community"><option v-for="look in communityPhotoLooks" :key="look.id" :value="look.id">{{look.name}}</option></optgroup></select></label><label><span>{{t.camera}}</span><select :value="cameraFilter||''" @change="emit('change-filters',{camera:$event.target.value})"><option value="">{{t.allCameras}}</option><option>GR IV</option><option>GR III</option><option>GR IIIx</option></select></label></div>
  <div v-if="visiblePhotos.length" class="photography-grid">
   <article v-for="photo in visiblePhotos" :key="photo.id" class="photograph-card">
    <button class="photograph-image" :aria-label="t.view+' · '+local(photo.title)" @click="emit('open-photo',photo.id)"><img :src="source(photo.image)" :alt="local(photo.title)" loading="lazy"><span v-if="photo.demo||photo.preview" class="photo-image-label">{{photo.preview?t.local:t.demo}}</span></button>
    <div class="photograph-caption"><h3><button @click="emit('open-photo',photo.id)">{{local(photo.title)}}</button></h3><div class="photo-credit"><img v-if="photo.creator.avatar" :src="source(photo.creator.avatar)" alt="" width="24" height="24"><span>{{photo.creator.name}}</span><button class="photo-like" :class="{liked:liked.includes(photo.id)}" :aria-label="(liked.includes(photo.id)?t.unlike:t.like)+' · '+local(photo.title)" :aria-pressed="liked.includes(photo.id)" :title="t.likeNote" @click="toggleLike(photo.id)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>{{liked.includes(photo.id)?1:0}}</button></div><div class="photo-card-meta"><span>{{cameraName(photo)}}</span><button v-if="photo.lookId" @click="emit('open-look',photo.lookId)">{{findPhotoLook(photo.lookId)?.name}} ↗</button><span v-else>{{setting(photo.highlight)}}</span></div></div>
   </article>
  </div>
  <div v-else class="photo-empty"><h3>{{t.empty}}</h3><p>{{t.emptyTip}}</p><button class="text-link" @click="openSubmit">{{t.submit}} ↗</button></div>
  <p class="photo-preview-note">{{t.demoNote}} {{t.likeNote}}</p>
 </section>
 <dialog ref="photoDialog" class="community-dialog photograph-dialog" aria-labelledby="photograph-title" @close="photoClosed" @cancel.prevent="photoDialog.close()" @click="($event.target===photoDialog)&&photoDialog.close()">
  <template v-if="selected"><div class="community-dialog-heading"><div><span class="eyebrow">XERFILM / PHOTOGRAPHY</span><h2 id="photograph-title">{{local(selected.title)}}</h2></div><button class="community-close" :aria-label="t.close" @click="photoDialog.close()">×</button></div><div class="photograph-detail"><figure><img :src="source(selected.image)" :alt="local(selected.title)"><figcaption>{{selected.preview?t.local:t.demo}}</figcaption></figure><aside><div class="community-creator"><img :src="source(selected.creator.avatar)" alt="" width="48" height="48"><div class="creator-identity"><small>{{t.by}}</small><strong>{{selected.creator.name}}</strong></div><button class="photo-like" :class="{liked:liked.includes(selected.id)}" :aria-pressed="liked.includes(selected.id)" :aria-label="(liked.includes(selected.id)?t.unlike:t.like)+' · '+local(selected.title)" :title="t.likeNote" @click="toggleLike(selected.id)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>{{liked.includes(selected.id)?1:0}}</button></div><p class="look-description">{{local(selected.description)}}</p><dl class="look-metadata"><div v-for="key in ['camera','film','frame','grain','highlight']" :key="key"><dt>{{t[key]}}</dt><dd>{{key==='camera'?cameraName(selected):setting(selected[key])}}</dd></div></dl><a v-if="linkedLook" class="photo-related-link" :href="`?tab=looks&look=${linkedLook.id}`" @click.prevent="emit('open-look',linkedLook.id)"><small>{{t.film}}</small><strong>{{linkedLook.name}} <span>↗</span></strong><span>{{t.viewLook}}</span></a><p class="photo-preview-note">{{selected.preview?t.previewReady:t.demoNote}}</p></aside></div></template>
 </dialog>
 <dialog ref="submitDialog" class="community-dialog photo-submission-dialog" aria-labelledby="photo-submit-title" @close="submitClosed" @cancel.prevent="submitDialog.close()" @click="($event.target===submitDialog)&&submitDialog.close()">
  <div class="community-dialog-heading"><div><span class="eyebrow">COMMUNITY / PHOTOGRAPHY</span><h2 id="photo-submit-title">{{t.submitTitle}}</h2></div><button class="community-close" :aria-label="t.close" @click="submitDialog.close()">×</button></div><p class="submission-lead">{{t.submitIntro}}</p>
  <form class="photo-submission-form" @submit.prevent="preview">
   <div class="photo-upload-grid"><div><label class="photo-file-label">{{t.image}}<input type="file" accept="image/jpeg,.jpg,.jpeg" @change="chooseFile($event)"></label><p class="hint">{{t.fileTip}}</p></div><div><label class="photo-file-label">{{t.info}}<input type="file" accept="image/jpeg,image/png" @change="chooseFile($event,'info')"></label><p class="hint">{{t.infoTip}}</p></div><div class="photo-avatar-upload"><img class="photo-avatar-preview" :src="avatarURL||`${assetBase}community/avatars/default-photographer.svg`" :alt="t.avatarPreview"><label class="photo-avatar-control"><span>{{t.avatar}}</span><small>{{t.avatarTip}}</small><input type="file" accept="image/jpeg,image/png" @change="chooseFile($event,'avatar')"></label></div></div>
   <div class="photo-form-fields"><label>{{t.name}}<input v-model="form.name" maxlength="40" required autocomplete="nickname"></label><label>{{t.workTitle}}<input v-model="form.title" maxlength="80" required></label><div class="photo-camera-field"><label>{{t.camera}}<select v-model="form.camera"><option value="">{{t.optional}}</option><option>GR IV</option><option>GR III</option><option>GR IIIx</option></select></label><label class="photo-hdf-option"><input v-model="form.hdf" type="checkbox"><span>{{t.hdfOption}}</span></label></div><label>{{t.look}}<select v-model="form.lookId"><optgroup :label="t.builtin"><option v-for="look in builtinPhotoLooks" :key="look.id" :value="look.id">{{look.name}}</option></optgroup><optgroup v-if="communityPhotoLooks.length" :label="t.community"><option v-for="look in communityPhotoLooks" :key="look.id" :value="look.id">{{look.name}}</option></optgroup><option value="">{{t.none}}</option></select><small v-if="findPhotoLook(form.lookId)?.kind==='builtin'" class="photo-builtin-hint">{{t.builtinIncluded}}</small></label><label v-if="!form.lookId">{{t.film}} · {{t.optional}}<input v-model="form.film" maxlength="50" placeholder="Std …"></label><fieldset class="photo-radio-field"><legend>{{t.frame}} · {{t.optional}}</legend><div class="photo-radio-options"><label v-for="value in ['', '3:2','645','67','XPan','1:1']" :key="value"><input v-model="form.frame" type="radio" name="photo-frame" :value="value"><span>{{value||t.notProvided}}</span></label></div></fieldset><fieldset class="photo-radio-field"><legend>{{t.grain}} · {{t.optional}}</legend><div class="photo-radio-options"><label v-for="value in ['','off','weak','medium','strong']" :key="value"><input v-model="form.grain" type="radio" name="photo-grain" :value="value"><span>{{value?t[value]:t.notProvided}}</span></label></div></fieldset><fieldset class="photo-radio-field"><legend>{{t.highlight}} · {{t.optional}}</legend><div class="photo-radio-options"><label v-for="value in ['','off','white','red']" :key="value"><input v-model="form.highlight" type="radio" name="photo-highlight" :value="value"><span>{{value?t[value]:t.notProvided}}</span></label></div></fieldset><label class="photo-story">{{t.story}}<textarea v-model="form.description" maxlength="600" rows="3"></textarea></label></div>
   <label class="photo-consent"><input v-model="form.consent" type="checkbox" required><span>{{t.consent}}</span></label><p v-if="error" class="photo-form-error" role="alert">{{error}}</p><p v-if="message" class="photo-form-success" role="status">{{message}}</p><div class="photo-submit-actions"><button class="outlined" type="submit" :disabled="busy">{{t.preview}} ↗</button><button class="primary" type="button" :disabled="busy" @click="download">{{busy?'…':t.create}} ↓</button></div><a v-if="packReady" class="text-link photo-email-link" :href="mailHref">{{t.mail}} ↗</a><p class="photo-preview-note">{{t.formNote}}</p>
  </form>
 </dialog>
 </div>
</template>
