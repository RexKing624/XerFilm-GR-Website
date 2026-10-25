import entries from '../../src/community-data.json' with {type:'json'};
import {json,bodyJSON} from './core.js';
const lookIds=[...new Set(entries.map(item=>item.id))];
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
async function browserHash(token){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('XerFilm community likes v1:'+token));return Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');}
export async function handleEngagement(request,env){
 const path=new URL(request.url).pathname,origin=request.headers.get('Origin'),allowed=env.ALLOWED_ORIGIN||'https://filmgr.xergnik.com';
 const cors=origin===allowed?{'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Like-Token','Vary':'Origin'}:{};
 try{
  if(request.method==='OPTIONS')return origin===allowed?new Response(null,{status:204,headers:{...cors,'Access-Control-Max-Age':'3600'}}):json({error:'origin'},403);
  if(path==='/api/public-stats'){
   if(request.method!=='GET')return json({error:'method'},405,cors);
   const {results}=await env.DB.prepare('SELECT key,count FROM public_counters').all();const counts=Object.fromEntries(results.map(row=>[row.key,Number(row.count)]));
   const measured=counts.firmware||0,baseline=Number(env.HISTORICAL_ESTIMATE||0),historicalEstimate=Number.isSafeInteger(baseline)&&baseline>=0?baseline:0;
   const looks=Object.fromEntries(lookIds.map(id=>[id,{likes:counts['like:'+id]||0,downloads:counts['download:'+id]||0}]));
   return json({firmware:{measured,historicalEstimate,total:measured+historicalEstimate},looks,startDate:env.START_DATE||'2026-10-25'},200,cors);
  }
  if(path==='/api/likes/state'){
   if(request.method!=='GET')return json({error:'method'},405,cors);
   if(origin!==allowed)return json({error:'origin'},403);
   const token=request.headers.get('X-Like-Token');if(!UUID.test(token||''))return json({error:'token'},400,cors);
   const {results}=await env.DB.prepare('SELECT look_id FROM community_likes WHERE browser_hash=?').bind(await browserHash(token)).all();
   return json({liked:results.map(row=>row.look_id).filter(id=>lookIds.includes(id))},200,cors);
  }
  if(path==='/api/likes'){
   if(request.method!=='POST')return json({error:'method'},405,cors);
   if(origin!==allowed)return json({error:'origin'},403);
   let body;try{body=await bodyJSON(request);}catch{return json({error:'body'},400,cors);}
   if(typeof body?.token!=='string'||!UUID.test(body.token)||!lookIds.includes(body?.lookId)||typeof body?.liked!=='boolean')return json({error:'invalid-like'},400,cors);
   const hash=await browserHash(body.token);
   if(env.EVENT_LIMITER&&!(await env.EVENT_LIMITER.limit({key:'likes:'+hash})).success)return json({error:'rate-limit'},429,cors);
   if(body.liked)await env.DB.prepare('INSERT OR IGNORE INTO community_likes(look_id,browser_hash,created_at) VALUES(?,?,?)').bind(body.lookId,hash,new Date().toISOString()).run();
   else await env.DB.prepare('DELETE FROM community_likes WHERE look_id=? AND browser_hash=?').bind(body.lookId,hash).run();
   const result=await env.DB.prepare('SELECT (SELECT COUNT(*) FROM community_likes WHERE look_id=? AND browser_hash=?) liked, COALESCE((SELECT count FROM public_counters WHERE key=?),0) likes').bind(body.lookId,hash,'like:'+body.lookId).all();
   return json({lookId:body.lookId,liked:!!result.results[0].liked,likes:Number(result.results[0].likes)},200,cors);
  }
  return json({error:'not-found'},404,cors);
 }catch{return json({error:'temporarily-unavailable'},503,cors);}
}
