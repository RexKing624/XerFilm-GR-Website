import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {handleRequest} from '../src/core.js';
function environment(){
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 return {
  db,START_DATE:'2026-10-25',ADMIN_TOKEN:'test-only-long-private-admin-token',HISTORICAL_ESTIMATE:'850',
  DB:{
   prepare(sql){
    let values=[];
    return {bind(...v){values=v;return this},async all(){return {results:db.prepare(sql).all(...values)}},async run(){return db.prepare(sql).run(...values)}};
   },
   async batch(queries){return Promise.all(queries.map(x=>x.all()))}
  }
 };
}
const stats=(env,query='')=>handleRequest(new Request('https://stats.test/api/stats'+query,{headers:{Authorization:'Bearer '+env.ADMIN_TOKEN}}),env);
test('dated manual totals replace the placeholder without fabricating automated events',async(t)=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-10-25T03:00:00Z')});
 const env=environment();
 const insert=env.db.prepare("INSERT INTO manual_downloads(day,model,variant,version,count) VALUES(?,?,?,?,?) ON CONFLICT(day,model,variant,version) DO UPDATE SET count=excluded.count");
 const rows=[['2026-10-18','gr4','standard','V1.0',11],['2026-10-20','gr4','enhanced','V1.1',13]];
 for(let pass=0;pass<2;pass++)for(const row of rows)insert.run(...row);
 let d=await(await stats(env,'?from=2026-10-18&to=2026-10-22')).json();
 assert.equal(d.startDate,'2026-10-18');assert.equal(d.collectionStartDate,'2026-10-25');
 assert.equal(d.summary.total,0);assert.equal(d.summary.manualTotal,24);assert.equal(d.summary.combinedTotal,24);
 assert.equal(d.summary.historicalEstimate,0);assert.equal(d.summary.estimatedTotal,24);
 assert.equal(d.summary.combinedToday,0);assert.equal(d.summary.combinedMonth,24);
 assert.deepEqual(d.daily.map(x=>[x.day,x.count]),[['2026-10-18',11],['2026-10-20',13]]);
 assert.ok(d.downloads.every(x=>x.source==='manual'&&x.sha256===null&&x.revision===null));
 assert.equal(env.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,0);
 assert.equal(env.db.prepare('SELECT COUNT(*) n FROM public_counters').get().n,0);
 d=await(await stats(env,'?from=2026-10-19&to=2026-10-20')).json();
 assert.equal(d.kinds[0].count,13);assert.equal(d.downloads.length,1);assert.equal(d.summary.combinedTotal,24);
 env.db.prepare('INSERT INTO downloads VALUES(?,?,?,?,?,?,?,?,?)').run(randomUUID(),'2026-10-25',new Date().toISOString(),'firmware','gr4','standard','V3.0','v49','a'.repeat(64));
 d=await(await stats(env)).json();assert.equal(d.summary.total,1);assert.equal(d.summary.combinedTotal,25);assert.equal(d.summary.estimatedTotal,25);assert.equal(d.summary.combinedToday,1);assert.equal(d.summary.combinedMonth,25);
});

test('dated Studio history combines independent totals without modifying automatic exports',async(t)=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-10-25T03:00:00Z')});
 const env=environment();
 const insert=env.db.prepare("INSERT INTO manual_studio_exports(day,exports,files,films) VALUES(?,?,?,?) ON CONFLICT(day) DO UPDATE SET exports=excluded.exports,files=excluded.files,films=excluded.films");
 for(let n=0;n<2;n++){
  insert.run('2026-10-24',3,2,4);
  insert.run('2026-10-25',5,1,3);
 }
 env.db.prepare('INSERT INTO studio_exports VALUES(?,?,?,?,?,?)').run(randomUUID(),'2026-10-25',new Date().toISOString(),'V3.0',4,12);
 const d=await(await stats(env)).json();
 assert.equal(d.startDate,'2026-10-24');
 assert.deepEqual(d.studio.summary,{total:9,today:6,month:9,files:7,films:19});
 assert.deepEqual(d.studio.daily.map(x=>[x.day,x.count,x.files,x.films]),[['2026-10-25',6,5,15],['2026-10-24',3,2,4]]);
 assert.equal(env.db.prepare('SELECT COUNT(*) n FROM studio_exports').get().n,1);
 assert.equal(d.summary.combinedTotal,0);
 const yesterday=await(await stats(env,'?from=2026-10-24&to=2026-10-24')).json();
 assert.deepEqual(yesterday.studio.period,{total:3,files:2,films:4});
});
