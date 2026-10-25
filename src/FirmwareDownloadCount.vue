<script setup>
import {computed} from 'vue';
import {publicEngagement} from './public-engagement';
import {engagementCopy} from './engagement-copy';
const props=defineProps({language:{type:String,required:true}});
const t=computed(()=>engagementCopy[props.language]);
const stats=computed(()=>publicEngagement.value.firmware);
const count=n=>new Intl.NumberFormat(props.language==='zh'?'zh-CN':props.language).format(n||0);
</script>
<template><div class="public-download-total"><div><span>{{t.total}}</span> <strong>{{stats?count(stats.total):'—'}}</strong></div><small v-if="stats"><span>{{t.estimate}} {{count(stats.historicalEstimate)}}</span><span aria-hidden="true">＋</span><span>{{t.measured}} {{count(stats.measured)}}</span></small></div></template>
