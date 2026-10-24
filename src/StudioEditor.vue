<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
const props=defineProps({language:String,theme:String});
const frame=ref(null),height=ref(1000),ready=ref(false);
// Keep the editor mounted when language/theme changes, preserving in-progress work.
const source=`/community/studio/editor.html?embed=1&lang=${encodeURIComponent(props.language)}&theme=${encodeURIComponent(props.theme)}`;
const label=computed(()=>({zh:'胶片工作室',en:'Film Studio',ja:'フィルムスタジオ'}[props.language]));
const loading=computed(()=>({zh:'正在打开制作工具…',en:'Opening Studio…',ja:'スタジオを開いています…'}[props.language]));
function syncPreferences(){frame.value?.contentWindow?.postMessage({type:'xerfilm-studio-preferences',language:props.language,theme:props.theme},location.origin);}
function receive(event){
 if(event.origin!==location.origin||event.source!==frame.value?.contentWindow||event.data?.type!=='xerfilm-studio-size')return;
 const measured=Number(event.data.height);
 if(Number.isFinite(measured)&&measured>=300&&measured<=24000){height.value=measured;ready.value=true;}
}
window.addEventListener('message',receive);
watch(()=>[props.language,props.theme],syncPreferences);
onBeforeUnmount(()=>window.removeEventListener('message',receive));
</script>
<template>
 <main class="studio-page" :aria-label="label" :aria-busy="!ready">
  <p v-if="!ready" class="studio-loading" role="status">{{loading}}</p>
  <iframe ref="frame" class="studio-editor-frame" :class="{ready}" :src="source" :title="label" :style="{height:height+'px'}" scrolling="no" @load="syncPreferences" />
 </main>
</template>
