import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {handleRequest,validAsset,dateInTokyo} from '../src/core.js';
import packs from '../../src/author-packs.json' with {type:'json'};

function environment(){
 const db=new DatabaseSync(':memory:');
 for(const n of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
 return {db,START_DATE:'2026-10-25',ALLOWED_ORIGIN:'https://filmgr.xergnik.com',ADMIN_TOKEN:'test-only-private-admin-token-with-32-chars',DB:{prepare(sql){let args=[];return{bind(...a){args=a;return this},async run(){return db.prepare(sql).run(...args)},async all(){return{results:db.prepare(sql).all(...args)}}}},async batch(q){return Promise.all(q.map(x=>x.all()))}}};
}
const request=e=>new Request('https://stats.test/api/downloads',{method:'POST',headers:{Origin:'https://filmgr.xergnik.com','Content-Type':'application/json'},body:JSON.stringify(e)});
const asset={kind:'author',model:'author',variant:'author',version:String(packs[0].version),revision:packs[0].id,sha256:packs[0].sha256};
const stats=env=>handleRequest(new Request('https://stats.test/api/stats?from=2026-10-25',{headers:{Authorization:'Bearer '+env.ADMIN_TOKEN}}),env);

test('verified author downloads are idempotent and isolated from firmware, community and Studio totals',async()=>{
 const env=environment(),event={eventId:randomUUID(),asset};
 assert.ok(validAsset(asset));
 for(let i=0;i<2;i++)assert.equal((await handleRequest(request(event),env)).status,200);
 const data=await(await stats(env)).json();
 assert.equal(data.author.period.total,1);assert.equal(data.author.summary.total,1);assert.equal(data.author.summary.today,1);
 assert.deepEqual(data.author.downloads,[{package_id:packs[0].id,version:String(packs[0].version),sha256:packs[0].sha256,count:1}]);
 assert.equal(data.summary.combinedTotal,0);assert.equal(data.studio.summary.total,0);assert.deepEqual(data.kinds,[]);
 for(const table of ['downloads','studio_exports','public_counters'])assert.equal(env.db.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
 assert.equal((await handleRequest(request({eventId:randomUUID(),asset}),env)).status,200);
 assert.equal((await(await stats(env)).json()).author.summary.total,2);
 env.db.close();
});

test('unknown packages, wrong digests and wrong namespaces do not create counts',async()=>{
 const env=environment();
 for(const change of [{revision:'unknown'},{sha256:'0'.repeat(64)},{version:'999'},{model:'gr4'},{variant:'community'}]){
  const invalid={...asset,...change};assert.equal(validAsset(invalid),false);
  assert.equal((await handleRequest(request({eventId:randomUUID(),asset:invalid}),env)).status,400);
 }
 assert.equal(env.db.prepare('SELECT COUNT(*) n FROM author_downloads').get().n,0);
 assert.equal((await handleRequest(new Request('https://stats.test/api/stats'),env)).status,401);
 env.db.close();
});

test('private author count follows selected dates without affecting historical data',async()=>{
 const env=environment(),today=dateInTokyo();
 env.db.prepare('INSERT INTO author_downloads VALUES(?,?,?,?,?,?)').run(randomUUID(),'2026-10-25',new Date().toISOString(),asset.revision,asset.version,asset.sha256);
 env.db.prepare('INSERT INTO author_downloads VALUES(?,?,?,?,?,?)').run(randomUUID(),today,new Date().toISOString(),asset.revision,asset.version,asset.sha256);
 const url='https://stats.test/api/stats?from=2026-10-25&to=2026-10-25';
 const data=await(await handleRequest(new Request(url,{headers:{Authorization:'Bearer '+env.ADMIN_TOKEN}}),env)).json();
 assert.equal(data.author.period.total,today==='2026-10-25'?2:1);assert.equal(data.author.summary.total,2);
 assert.equal(data.summary.manualTotal,0);env.db.close();
});
