import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {handleRequest,dateInTokyo,validAsset} from '../src/core.js';
import {createDownloadStatistics} from '../../src/download-statistics-client.js';
import {handleEngagement} from '../src/engagement.js';
import {createEngagementClient} from '../../src/engagement-client.js';
const origin='https://filmgr.xergnik.com',base='https://stats.example';
const asset={kind:'firmware',model:'gr3x',variant:'standard',version:'V3.0',revision:'R31',sha256:'a'.repeat(64)};
export function environment(){
 const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 return {START_DATE:'2026-10-25',ALLOWED_ORIGIN:origin,ADMIN_TOKEN:'unit-test-admin-token-with-32-characters',DB:{prepare(sql){let values=[];return{bind(...v){values=v;return this},async run(){return db.prepare(sql).run(...values)},async all(){return {results:db.prepare(sql).all(...values)}}}},async batch(queries){return Promise.all(queries.map(q=>q.all()))}},db};
}
const request=(event,headers={Origin:origin})=>new Request(base+'/api/downloads',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(event)});
const stats=(env,query='')=>handleRequest(new Request(base+'/api/stats'+query,{headers:{Authorization:'Bearer '+env.ADMIN_TOKEN}}),env);
test('concurrent repeated events count once; versions and variants remain separate',async()=>{
 const env=environment(),event={eventId:randomUUID(),asset};
 const results=await Promise.all(Array.from({length:5},()=>handleRequest(request(event),env)));
 assert.ok(results.every(r=>r.ok));assert.equal(env.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,1);
 await handleRequest(request({eventId:randomUUID(),asset:{...asset,variant:'enhanced',revision:'R31-H'}}),env);
 const d=await (await stats(env)).json();assert.equal(d.summary.total,2);assert.equal(d.downloads.length,2);assert.equal(d.timeZone,'Asia/Tokyo');
});
test('owner data is inaccessible without the secret, even with a valid public Origin',async()=>{
 const env=environment();assert.equal((await handleRequest(new Request(base+'/api/stats',{headers:{Origin:origin}}),env)).status,401);
 env.ADMIN_TOKEN='';assert.equal((await stats(env)).status,401);
});
test('other origins, malformed metadata and oversized posts do not increment',async()=>{
 const env=environment();assert.equal((await handleRequest(request({eventId:randomUUID(),asset},{Origin:'https://other.example'}),env)).status,403);
 for(const a of [{...asset,model:'invalid'},{...asset,version:undefined},{...asset,variant:'original'},{...asset,sha256:'bad'},{...asset,revision:'<script>'}])assert.equal((await handleRequest(request({eventId:randomUUID(),asset:a}),env)).status,400);
 assert.equal((await handleRequest(request({large:'x'.repeat(3000)}),env)).status,400);assert.equal(env.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,0);
});
test('date boundaries use Japan time; range filters and community do not inflate firmware totals',async()=>{
 assert.equal(dateInTokyo(new Date('2026-10-24T15:00:00Z')),'2026-10-25');assert.equal(dateInTokyo(new Date('2026-10-24T14:59:59Z')),'2026-10-24');
 const env=environment();await handleRequest(request({eventId:randomUUID(),asset:{...asset,kind:'community',model:'community',variant:'community',version:'1',revision:'coast-study'}}),env);
 assert.equal((await (await stats(env)).json()).summary.total,0);assert.equal((await stats(env,'?from=2026-02-30&to=2026-10-25')).status,400);
});
test('service failures are a retriable response, never a false success',async()=>{
 const env=environment();env.DB.prepare=()=>{throw Error('unavailable')};assert.equal((await handleRequest(request({eventId:randomUUID(),asset}),env)).status,503);
});
test('frontend retries retain the event ID; duplicate retry cannot increase the database count',async()=>{
 const env=environment(),memory=new Map();let first=true,calls=0;
 const client=createDownloadStatistics({endpoint:base+'/api/downloads',location:{origin,search:''},storage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},uuid:randomUUID,schedule:()=>1,send:async(url,options)=>{calls++;const response=await handleRequest(new Request(url,{...options,headers:{...options.headers,Origin:origin}}),env);if(first){first=false;throw Error('response lost after commit')}return response}});
 client.record(asset);await new Promise(r=>setTimeout(r,10));await client.flush();assert.equal(calls,2);assert.equal(env.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,1);assert.deepEqual(JSON.parse(memory.get('xerfilm-pending-downloads-v1')),[]);
});
test('owner exclusion and localhost suppress stats; blocked storage and network never throw into download flow',async()=>{
 let calls=0;const baseOptions={endpoint:base,location:{origin,search:''},storage:{getItem:()=>null,setItem(){}},send:async()=>{calls++;return new Response()},uuid:randomUUID,schedule:()=>1};
 createDownloadStatistics({...baseOptions,location:{origin:'http://127.0.0.1:5178',search:''}}).record(asset);
 createDownloadStatistics({...baseOptions,storage:{getItem:()=> '1',setItem(){}}}).record(asset);assert.equal(calls,0);
 createDownloadStatistics({...baseOptions,location:{origin,search:'?download-statistics=off'},storage:undefined}).record(asset);assert.equal(calls,0);
 const client=createDownloadStatistics({...baseOptions,storage:{getItem(){throw Error()},setItem(){throw Error()}},send:async()=>{throw Error('offline')}});assert.doesNotThrow(()=>client.record(asset));await new Promise(r=>setTimeout(r,10));
});

test('historical 850 is a labeled baseline, added once only to estimated cumulative total',async()=>{
 const env=environment();env.HISTORICAL_ESTIMATE='850';
 let d=await (await stats(env)).json();assert.equal(d.summary.total,0);assert.equal(d.summary.historicalEstimate,850);assert.equal(d.summary.estimatedTotal,850);assert.equal(d.downloads.length,0);assert.equal(d.daily.length,0);
 await handleRequest(request({eventId:randomUUID(),asset}),env);
 d=await (await stats(env)).json();assert.equal(d.summary.total,1);assert.equal(d.summary.estimatedTotal,851);assert.equal(d.summary.today,1);assert.equal(d.summary.month,1);assert.equal(d.daily[0].count,1);assert.equal(d.downloads[0].count,1);assert.equal(env.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,1);
 d=await (await stats(env)).json();assert.equal(d.summary.estimatedTotal,851,'Refreshing does not add 850 again');
});

const lookId='coast-study';
const likeRequest=(token,liked,look=lookId,source=origin)=>new Request(base+'/api/likes',{method:'POST',headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify({token,lookId:look,liked})});
const publicStats=async env=>(await handleEngagement(new Request(base+'/api/public-stats'),env)).json();
test('anonymous likes are idempotent, independently owned and cancellable; public output contains only aggregates',async()=>{
 const env=environment(),a=randomUUID(),b=randomUUID();env.HISTORICAL_ESTIMATE='850';
 for(const [token,liked,expected]of [[a,true,1],[a,true,1],[b,true,2],[a,false,1],[a,false,1]]){
  const r=await handleEngagement(likeRequest(token,liked),env);assert.equal(r.status,200);assert.equal((await r.json()).likes,expected);
 }
 const state=async token=>(await handleEngagement(new Request(base+'/api/likes/state',{headers:{Origin:origin,'X-Like-Token':token}}),env)).json();
 assert.deepEqual((await state(a)).liked,[]);assert.deepEqual((await state(b)).liked,[lookId]);
 const d=await publicStats(env);assert.equal(d.looks[lookId].likes,1);assert.deepEqual(Object.keys(d).sort(),['looks','startDate']);assert.equal(d.firmware,undefined);assert.ok(!JSON.stringify(d).includes(b));
 const rows=env.db.prepare('SELECT * FROM community_likes').all();assert.equal(rows.length,1);assert.notEqual(rows[0].browser_hash,b);assert.equal(rows[0].browser_hash.length,64);
 assert.equal((await handleEngagement(likeRequest(a,true,'unknown-look'),env)).status,400);assert.equal((await handleEngagement(likeRequest(a,true,lookId,'https://other.example'),env)).status,403);
});
test('community counters remain public while firmware totals stay private, including after backfill',async()=>{
 const env=environment();env.HISTORICAL_ESTIMATE='850';const e={eventId:randomUUID(),asset};
 await handleRequest(request(e),env);await handleRequest(request(e),env);
 await handleRequest(request({eventId:randomUUID(),asset:{...asset,kind:'community',model:'community',variant:'community',revision:lookId,version:'1'}}),env);
 const before=await publicStats(env);assert.equal(before.firmware,undefined);assert.equal(before.looks[lookId].downloads,1);assert.equal((await (await stats(env)).json()).summary.estimatedTotal,851);
 env.db.exec('DELETE FROM public_counters');const sql=readFileSync(new URL('../backfill-public-counters.sql',import.meta.url),'utf8');env.db.exec(sql);env.db.exec(sql);assert.deepEqual(await publicStats(env),before);
 await handleRequest(request({eventId:randomUUID(),asset}),env);assert.equal((await publicStats(env)).firmware,undefined);assert.equal((await (await stats(env)).json()).summary.total,2);
});
function engagementClient(env,{send:customSend,onChange=()=>{}}={}){
 const values=new Map(),send=customSend||((url,options={})=>handleEngagement(new Request(url,{...options,headers:{...options.headers,Origin:origin}}),env));
 const options={base,storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},uuid:randomUUID,onChange,send};return{client:createEngagementClient(options),options,values};
}
test('two clients synchronize, browser state survives reload, and a repeated click while busy cannot add twice',async()=>{
 const env=environment(),snapshots=[],a=engagementClient(env,{onChange:s=>snapshots.push(s)}),b=engagementClient(env);
 await Promise.all([a.client.refresh(),b.client.refresh()]);assert.equal(a.values.size,0,'Viewing creates no anonymous token');
 const action=a.client.toggle(lookId);assert.equal(a.client.snapshot().liked.includes(lookId),true,'Own heart updates immediately');assert.equal(a.client.snapshot().looks[lookId].likes,1);await a.client.toggle(lookId);await action;
 await b.client.refresh();assert.equal(b.client.snapshot().looks[lookId].likes,1);assert.deepEqual(b.client.snapshot().liked,[]);
 const reloaded=createEngagementClient(a.options);await reloaded.refreshLiked();assert.deepEqual(reloaded.snapshot().liked,[lookId]);await a.client.toggle(lookId);await b.client.refresh();assert.equal(b.client.snapshot().looks[lookId].likes,0);
});
test('a lost like response recovers the saved state; stale polls cannot overwrite a newer like',async()=>{
 const env=environment();let lose=true;
 const a=engagementClient(env,{send:async(url,options={})=>{const r=await handleEngagement(new Request(url,{...options,headers:{...options.headers,Origin:origin}}),env);if(url.endsWith('/api/likes')&&lose){lose=false;throw Error('response lost')}return r;}});
 await a.client.refresh();await a.client.toggle(lookId);assert.deepEqual(a.client.snapshot().liked,[lookId]);assert.equal(a.client.snapshot().looks[lookId].likes,1);assert.equal(a.client.snapshot().errors[lookId],undefined);
 let resolve;const old=await publicStats(env);const b=engagementClient(env);await b.client.refresh();b.options.send=undefined;
 let defer=false;const c=engagementClient(env,{send:async(url,options={})=>{if(defer&&url.endsWith('/api/public-stats')){defer=false;return new Promise(r=>{resolve=r})}return handleEngagement(new Request(url,{...options,headers:{...options.headers,Origin:origin}}),env);}});await c.client.refresh();defer=true;const pending=c.client.refresh();await c.client.toggle(lookId);resolve(new Response(JSON.stringify(old),{headers:{'Content-Type':'application/json'}}));await pending;assert.equal(c.client.snapshot().looks[lookId].likes,2);
});

test('GR III R32 stable downloads separate variants and preserve prior test records',async()=>{
 const env=environment();
 for(const manifest of ['gr3-release.json','gr3-enhanced-release.json']){
  const release=JSON.parse(readFileSync(new URL(`../../src/${manifest}`,import.meta.url),'utf8'));
  assert.equal(release.statisticsVersion,'V3.0');
  const a={kind:'firmware',model:'gr3',variant:release.downloadVariant,version:release.statisticsVersion,revision:release.internalVersion,sha256:release.sha256};
  assert.ok(validAsset(a));
  for(const version of ['V3.0-test',a.version]){
   const event={eventId:randomUUID(),asset:{...a,version}};
   assert.equal((await handleRequest(request(event),env)).status,200);
   assert.equal((await handleRequest(request(event),env)).status,200);
  }
 }
 const data=await(await stats(env)).json();
 assert.equal(data.summary.total,4);
 assert.deepEqual(data.downloads.map(x=>[x.model,x.variant,x.version,x.revision,x.count]).sort(),[
  ['gr3','enhanced','V3.0','R32-H',1],['gr3','enhanced','V3.0-test','R32-H',1],
  ['gr3','standard','V3.0','R32',1],['gr3','standard','V3.0-test','R32',1]
 ]);
 assert.equal((await handleRequest(new Request(base+'/api/stats'),env)).status,401);
});
