<script setup>
import {computed} from 'vue';
const props=defineProps({date:{type:String,default:''},year:Boolean,time:Boolean});
// Upright geometric seven-segment proportions used by the GR IV date imprint.
const masks=[0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f];
function bar(x0,y0,x1,y1,t){
 return y0===y1 ? `${x0},${y0} ${x0+t},${y0-t} ${x1-t},${y1-t} ${x1},${y1} ${x1-t},${y1+t} ${x0+t},${y0+t}`
 : `${x0},${y0} ${x0+t},${y0+t} ${x1+t},${y1-t} ${x1},${y1} ${x1-t},${y1-t} ${x0-t},${y0+t}`;
}
const shapes=[bar(7.75,4.5,28.25,4.5,4.5),bar(31.5,7.75,31.5,28.75,4.5),bar(31.5,35.25,31.5,56.25,4.5),bar(7.75,59.5,28.25,59.5,4.5),bar(4.5,35.25,4.5,56.25,4.5),bar(4.5,7.75,4.5,28.75,4.5),bar(7.75,32,28.25,32,4.5)];
const layout=computed(()=>{
 const cells=[];let x=0;
 if(props.year){cells.push({type:'apostrophe',x,scale:1});x+=19;}
 const run=(text,scale)=>{for(const c of text){if(c===' '){x+=42*scale;continue;}cells.push({type:c===':'?'colon':'digit',digit:Number(c),x,scale});x+=(c===':'?18:46)*scale;}};
 run(props.date,1);if(props.time){if(props.date)x+=16;run('14:36',.78);}
 return {cells,width:Math.max(1,x-10)};
});
</script>
<template>
 <svg class="stamp-digits" :viewBox="`0 0 ${layout.width} 64`" :style="{'--stamp-width':`${layout.width / 64}em`}" aria-hidden="true" focusable="false">
  <g v-for="(cell,i) in layout.cells" :key="i" :transform="`translate(${cell.x},${64*(1-cell.scale)}) scale(${cell.scale})`" fill="currentColor">
   <polygon v-if="cell.type==='apostrophe'" points="1,6 9,6 9,16 4,21 1,21"/>
   <template v-else-if="cell.type==='colon'"><rect x="3" y="18" width="7" height="8"/><rect x="3" y="39" width="7" height="8"/></template>
   <template v-else><template v-for="(shape,j) in shapes" :key="j"><polygon v-if="masks[cell.digit] & (1<<j)" :points="shape"/></template></template>
  </g>
 </svg>
</template>
