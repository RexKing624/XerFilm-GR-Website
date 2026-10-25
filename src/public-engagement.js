import {ref} from 'vue';
import configuration from './download-statistics-config.json';
import {createEngagementClient} from './engagement-client';
export const publicEngagement=ref({ready:false,firmware:null,looks:{},liked:[],busy:{},errors:{}});
const base=import.meta.env.VITE_ENGAGEMENT_API||new URL(configuration.endpoint).origin;
let storage;try{storage=globalThis.localStorage;}catch{}
const client=createEngagementClient({base,storage,uuid:()=>crypto.randomUUID(),send:(...args)=>fetch(...args),onChange:value=>{publicEngagement.value=value;}});
export const toggleLike=id=>client.toggle(id);
export function startPublicEngagement(){
 let stopped=false,timer,generation=0;
 const active=()=>!document.hidden&&!/^\/community\/studio\//.test(location.pathname);
 const tick=async(g)=>{if(stopped||g!==generation)return;if(active())await client.refresh();if(!stopped&&g===generation)timer=setTimeout(()=>tick(g),/^\/community\/?$/.test(location.pathname)?5000:30000);};
 const resume=()=>{clearTimeout(timer);generation++;void tick(generation);if(active())void client.refreshLiked();};
 const changed=event=>{if(['xerfilm-community-like-change','xerfilm-community-like-token-v1'].includes(event.key))resume();};
 document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('storage',changed);window.addEventListener('xerfilm-download-recorded',resume);window.addEventListener('popstate',resume);window.addEventListener('xerfilm-page-changed',resume);
 void tick(generation);void client.refreshLiked();
 return()=>{stopped=true;clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('storage',changed);window.removeEventListener('xerfilm-download-recorded',resume);window.removeEventListener('popstate',resume);window.removeEventListener('xerfilm-page-changed',resume);};
}
