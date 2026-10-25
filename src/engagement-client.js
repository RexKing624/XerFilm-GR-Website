const TOKEN='xerfilm-community-like-token-v1';
const CHANGE='xerfilm-community-like-change';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function createEngagementClient({base,send,storage,uuid,onChange=()=>{}}){
 let token,state={ready:false,looks:{},liked:[],busy:{},errors:{}},epoch=0;
 try{const saved=storage?.getItem(TOKEN);if(UUID.test(saved||''))token=saved;}catch{}
 const publish=()=>onChange({...state,looks:{...state.looks},liked:[...state.liked],busy:{...state.busy},errors:{...state.errors}});
 async function refresh(){
  const generation=epoch;
  try{const r=await send(base+'/api/public-stats',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});if(!r.ok)return;const data=await r.json();
   if(generation!==epoch||Object.values(state.busy).some(Boolean))return;
   state={...state,ready:true,looks:data.looks};publish();
  }catch{}
 }
 async function refreshLiked(){
  try{const current=storage?.getItem(TOKEN);if(UUID.test(current||''))token=current;}catch{}
  if(!token)return;const generation=epoch;
  try{const r=await send(base+'/api/likes/state',{headers:{'X-Like-Token':token},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return;const data=await r.json();if(generation!==epoch||Object.values(state.busy).some(Boolean))return;state.liked=data.liked;publish();}catch{}
 }
 async function toggle(id){
  if(!state.ready||state.busy[id]||!state.looks[id])return;
  let failed=false;
  const previous=state.liked.includes(id),before={...state.looks[id]};const desired=!previous;
  epoch++;state.busy[id]=true;delete state.errors[id];state.liked=state.liked.filter(x=>x!==id);if(desired)state.liked.push(id);state.looks[id]={...before,likes:Math.max(0,before.likes+(desired?1:-1))};publish();
  try{
   if(!token){token=uuid();try{storage?.setItem(TOKEN,token);}catch{}}
   const r=await send(base+'/api/likes',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:AbortSignal.timeout(8000),body:JSON.stringify({lookId:id,token,liked:desired})});if(!r.ok)throw Error('Like unavailable');const data=await r.json();
   state.looks[id]={...state.looks[id],likes:data.likes};state.liked=state.liked.filter(x=>x!==id);if(data.liked)state.liked.push(id);
   try{storage?.setItem(CHANGE,uuid());}catch{}
  }catch{failed=true;state.looks[id]=before;state.liked=state.liked.filter(x=>x!==id);if(previous)state.liked.push(id);state.errors[id]=true;}
  finally{epoch++;state.busy[id]=false;publish();if(failed){await Promise.all([refresh(),refreshLiked()]);if(state.liked.includes(id)===desired){delete state.errors[id];publish();}}}
 }
 return {refresh,refreshLiked,toggle,snapshot:()=>state};
}
