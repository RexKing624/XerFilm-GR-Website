<script setup>
import {computed} from 'vue';
import {publicEngagement,toggleLike} from './public-engagement';
import {engagementCopy} from './engagement-copy';
const props=defineProps({itemId:{type:String,required:true},itemName:{type:String,required:true},language:{type:String,required:true}});
const t=computed(()=>engagementCopy[props.language]);
const liked=computed(()=>publicEngagement.value.liked.includes(props.itemId));
const row=computed(()=>publicEngagement.value.looks[props.itemId]);
const count=n=>publicEngagement.value.ready&&row.value?new Intl.NumberFormat(props.language==='zh'?'zh-CN':props.language).format(n||0):'—';
</script>
<template>
 <div class="look-engagement">
  <button type="button" class="look-like" :class="{liked}" :aria-pressed="liked" :aria-label="`${liked?t.unlike:t.like} ${itemName} · ${count(row?.likes)}`" :title="t.help" :disabled="!publicEngagement.ready||publicEngagement.busy[itemId]" @click="toggleLike(itemId)">
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>{{count(row?.likes)}}</span>
  </button>
  <span class="look-download-count" :aria-label="`${t.downloads} · ${count(row?.downloads)}`" :title="t.downloads"><span aria-hidden="true">↓</span> {{count(row?.downloads)}}</span>
  <span v-if="publicEngagement.errors[itemId]" class="like-error" role="status">{{t.failed}}</span>
 </div>
</template>
