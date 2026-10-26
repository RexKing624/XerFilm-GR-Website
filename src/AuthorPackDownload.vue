<script setup>
import {computed,onBeforeUnmount,ref,watch} from 'vue';
import {loadVerifiedCommunityPack,saveCommunityPack} from './community-download';
import {trackAuthorDownload} from './download-statistics';
const props=defineProps({pack:{type:Object,required:true},language:{type:String,default:'zh'},assetBase:{type:String,default:'/'}});
const labels={
 zh:{label:'补充包',hint:'色彩带走，README 也要看哦～',title:'先对一下版本，再把色彩带走。',warning:'请先确认你的 GR III／GR IV（含 HDF）已安装 XerFilm GR V3.11。不支持的版本误用此包，可能出现功能异常或死机，请勿尝试。',unsupported:'GR IIIx（含 HDF）暂不支持。',readme:'下载后请先阅读 README。安装文件在 XERFILM，删除补丁在 DELETE；删除时请按说明移动文件。',confirm:'已安装 V3.11，确认下载',cancel:'取消',close:'关闭',busy:'正在准备下载…',failed:'下载失败，请重试。',done:'已开始下载，记得先看 README 哦～'},
 en:{label:'Add-on pack',hint:'Take the colors—and read the README!',title:'Check your version before taking these colors.',warning:'Your GR III / GR IV (including HDF) must already run XerFilm GR V3.11. Using this pack with unsupported firmware may cause errors or freezing. Do not use it on an unsupported version.',unsupported:'GR IIIx (including HDF) is not supported yet.',readme:'Read the README first. XERFILM contains the installer; DELETE stores the removal patch. Follow the instructions before moving files.',confirm:'V3.11 is installed — download',cancel:'Cancel',close:'Close',busy:'Preparing download…',failed:'Download failed. Please try again.',done:'Download started. The README is part of the package too!'},
 ja:{label:'追加パック',hint:'色も説明書も、お忘れなく～',title:'色を持ち帰る前に、バージョンを確認。',warning:'GR III／GR IV（HDF を含む）に XerFilm GR V3.11 がインストールされていることを確認してください。非対応バージョンでは、不具合やフリーズが起こる可能性があります。使用しないでください。',unsupported:'GR IIIx（HDF を含む）は現在未対応です。',readme:'最初に README をお読みください。XERFILM はインストール用、DELETE は削除パッチの保管用です。ファイルの移動は説明に従ってください。',confirm:'V3.11 導入済み・ダウンロード',cancel:'キャンセル',close:'閉じる',busy:'ダウンロードを準備中…',failed:'ダウンロードに失敗しました。再度お試しください。',done:'ダウンロード開始。まずは README をどうぞ～'},
};
const t=computed(()=>labels[props.language]||labels.zh),dialog=ref(null),busy=ref(false),status=ref('');
let attempt=0,lastFocus,previousOverflow='';
function open(){lastFocus=document.activeElement;status.value='';previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.value.showModal();}
function close(){attempt++;busy.value=false;dialog.value?.close();document.body.style.overflow=previousOverflow;lastFocus?.focus?.();}
async function download(){
 if(busy.value||!dialog.value?.open)return;
 const current=++attempt;busy.value=true;status.value='';
 try{
  const blob=await loadVerifiedCommunityPack(props.pack,props.assetBase);
  if(current!==attempt||!dialog.value?.open)return;
  saveCommunityPack(blob,props.pack.filename);
  trackAuthorDownload(props.pack);
  status.value='done';
 }catch{if(current===attempt)status.value='failed';}
 finally{if(current===attempt)busy.value=false;}
}
watch(()=>props.language,()=>{if(dialog.value?.open)close();});
onBeforeUnmount(()=>{if(dialog.value?.open)close();});
</script>

<template>
 <div class="author-addon">
  <button class="author-addon-link" type="button" data-testid="author-pack-open" @click="open">
   <img :src="`${assetBase}${pack.icon}`" :alt="pack.name" width="48" height="48">
   <span><strong>{{ pack.name }} <span aria-hidden="true">↓</span></strong><small>{{ t.label }}</small></span>
  </button>
  <small class="author-addon-hint">{{ t.hint }}</small>
  <dialog ref="dialog" class="author-warning" aria-labelledby="author-warning-title" @cancel.prevent="close" @click="event=>event.target===dialog&&close()">
   <div class="author-warning-head"><span class="eyebrow">XERFILM / ADD-ON</span><button class="close-button" type="button" :aria-label="t.close" @click="close">✕</button></div>
   <h2 id="author-warning-title">{{ t.title }}</h2>
   <p class="author-warning-copy"><span aria-hidden="true">!</span>{{ t.warning }}</p>
   <p class="author-unsupported">{{ t.unsupported }}</p>
   <p class="author-readme-note">{{ t.readme }}</p>
   <div class="author-warning-actions"><button class="outlined" type="button" @click="close">{{ t.cancel }}</button><button class="primary" type="button" data-testid="author-pack-confirm" :disabled="busy" @click="download"><span>{{ busy?t.busy:t.confirm }}</span><span aria-hidden="true">↓</span></button></div>
   <p class="author-download-status" :class="{failed:status==='failed'}" role="status">{{ status?t[status]:'' }}</p>
  </dialog>
 </div>
</template>

<style scoped>
.author-addon{display:flex;align-items:center;justify-content:center;flex:1;gap:12px 18px;flex-wrap:wrap;min-width:0}.author-addon-link{display:flex;align-items:center;gap:12px;padding:0;text-align:left}.author-addon-link img{flex:none;image-rendering:pixelated}.author-addon-link strong{display:block;font-size:12px;font-weight:500;white-space:nowrap}.author-addon-link strong>span{margin-left:8px;color:var(--accent)}.author-addon-link small{display:block;font-size:10px;color:var(--muted);margin-top:3px}.author-addon-link:hover strong{color:var(--accent)}.author-addon-hint{font-size:10px;color:var(--muted);line-height:1.8}.author-warning{position:fixed;inset:0;margin:auto;width:min(500px,calc(100vw - 36px));max-height:calc(100dvh - 36px);padding:27px;border:1px solid var(--line);background:var(--panel);color:var(--ink);overflow:auto}.author-warning::backdrop{background:#0009;backdrop-filter:blur(4px)}.author-warning-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.author-warning h2{font-size:25px;font-weight:450;line-height:1.4;margin:17px 0 24px;letter-spacing:-.03em}.author-warning-copy{font-size:13px;line-height:1.95;padding-left:22px;position:relative}.author-warning-copy>span{position:absolute;left:0;top:3px;color:var(--warm);font-size:11px;border:1px solid;width:15px;height:15px;display:grid;place-items:center;border-radius:50%;line-height:1}.author-unsupported{font-size:13px;font-weight:600;color:var(--warm);margin-top:14px}.author-readme-note{font-size:11px;color:var(--muted);line-height:1.9;margin-top:17px}.author-warning-actions{display:flex;align-items:stretch;gap:12px;margin-top:27px}.author-warning-actions>.primary{flex:1}.author-download-status{font-size:11px;min-height:20px;color:var(--accent);margin-top:13px}.author-download-status.failed{color:var(--warm)}
@media(max-width:650px){.author-addon{justify-content:flex-start;flex:1 1 100%;order:3;border-top:1px solid var(--line);padding-top:18px}.author-warning{padding:22px}.author-warning h2{font-size:22px}.author-warning-actions{flex-wrap:wrap}.author-warning-actions>.primary{flex-basis:100%}}
</style>
