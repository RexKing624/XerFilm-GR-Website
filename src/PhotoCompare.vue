<script setup>
import { computed, ref, watch } from 'vue';
import { communityCopy } from './community-copy';
const props=defineProps({item:Object,language:String,assetBase:String,compact:Boolean});
const t=computed(()=>communityCopy[props.language]);
const position=ref(50), scene=ref(0);
const photo=computed(()=>props.item.photos[scene.value]);
const local=value=>typeof value==='string'?value:value[props.language];
watch(()=>props.item.id,()=>{scene.value=0;position.value=50;});
function choose(index){scene.value=index;position.value=50;}
</script>
<template>
 <div class="look-preview" :class="{'compact-preview':compact}">
  <div class="look-comparison" :style="{'--split':position+'%'}">
   <img class="compare-base" :src="`${assetBase}${photo.effect}`" :alt="`${local(photo.label)} · ${t.effect}`" draggable="false">
   <img class="compare-original" :src="`${assetBase}${photo.original}`" :alt="`${local(photo.label)} · ${t.original}`" draggable="false" :style="{clipPath:`inset(0 ${100-position}% 0 0)`}">
   <span class="comparison-label original-label">{{t.original}}</span><span class="comparison-label effect-label">{{t.effect}}</span>
   <div class="comparison-divider" aria-hidden="true"><span>↔</span></div>
   <input v-model.number="position" class="comparison-range" type="range" min="0" max="100" step="1" :aria-label="`${item.name} · ${t.compare}`" :aria-valuetext="`${t.original} ${position}% · ${t.effect} ${100-position}%`">
  </div>
  <template v-if="!compact">
   <div class="compare-caption"><p>{{t.hint}}</p><span>{{String(scene+1).padStart(2,'0')}} / {{String(item.photos.length).padStart(2,'0')}}</span></div>
   <div v-if="item.photos.length>1" class="scene-options" :aria-label="t.scene"><button v-for="(sample,i) in item.photos" :key="sample.original" :aria-pressed="scene===i" @click="choose(i)"><img :src="`${assetBase}${sample.effect}`" :alt="local(sample.label)" loading="lazy"></button></div>
   <p v-if="item.demo" class="community-preview-note">{{t.previewNote}}</p>
  </template>
 </div>
</template>
