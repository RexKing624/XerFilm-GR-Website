import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {handleRequest,dateInTokyo,validAsset} from '../src/core.js';
import {createDownloadStatistics} from '../../src/download-statistics-client.js';
const origin='https://filmgr.xergnik.com',base='https://stats.example';
const asset={kind:'firmware',model:'gr3x',variant:'standard',version:'V3.0',revision:'R31',sha256:'a'.repeat(64)};
function environment(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_downloads.sql',import.meta.url),'utf8'));
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
