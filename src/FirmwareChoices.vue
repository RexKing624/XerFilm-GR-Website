<script setup>
import {computed,onMounted,onBeforeUnmount,ref} from 'vue';
import {parseFirmwareTotal,choiceDate} from './firmware-total';
import config from './public-summary-config.json';
const props=defineProps({language:{type:String,required:true}});
const snapshot=ref(null);
const labels=computed(()=>({
 zh:{before:'XerFilm GR，已被选择 ',unit:' 次',after:'。',date:'截至 ',source:' · 数据依据：固件总下载量'},
 en:{before:'XerFilm GR, chosen ',unit:' times',after:'.',date:'As of ',source:' · Based on total firmware downloads'},
 ja:{before:'XerFilm GR は、',unit:' 回',after:'選ばれました。',date:'',source:' 時点 · ファームウェア総ダウンロード数に基づく'}
}[props.language]));
const total=computed(()=>snapshot.value?.total.toLocaleString(props.language==='zh'?'zh-CN':props.language==='ja'?'ja-JP':'en-US'));
let timer,controller,stopped=false;
async function refresh(){
 clearTimeout(timer);if(stopped||document.hidden||controller)return;
 controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),6000);
 try{const response=await fetch(import.meta.env.DEV?'/api/firmware-total':config.endpoint,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});if(response.ok){const data=await response.json();const value=parseFirmwareTotal({...data,generatedAt:data.generatedAt||response.headers.get('Date')||undefined});if(value&&!stopped)snapshot.value=value;}}
 catch{}finally{clearTimeout(timeout);controller=null;if(!stopped&&!document.hidden)timer=setTimeout(refresh,60000);}
}
onMounted(()=>{void refresh();document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);window.addEventListener('xerfilm-download-recorded',refresh);});
onBeforeUnmount(()=>{stopped=true;clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh);window.removeEventListener('xerfilm-download-recorded',refresh);});
</script>
<template>
 <div class="firmware-choices"><template v-if="snapshot"><p>{{labels.before}}<strong>{{total}}</strong>{{labels.unit}}{{labels.after}}</p><small>{{labels.date}}{{choiceDate(snapshot.asOf,language,snapshot.generatedAt)}}{{labels.source}}</small></template></div>
</template>
