import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker,{handleSummary} from '../src/worker.js';
import {parseFirmwareTotal,choiceDate} from '../../src/firmware-total.js';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE download_totals(day TEXT,kind TEXT,count INTEGER);
 INSERT INTO download_totals VALUES('2026-10-18','firmware',5),('2026-10-26','firmware',1),('2026-10-26','firmware',1),('2026-10-26','original',30),('2026-10-26','community',40),('2026-10-27','firmware',99);`);
 return {DB:{prepare(sql){assert.match(sql,/^SELECT /);return{bind(...args){return{async all(){return{results:db.prepare(sql).all(...args)}}}}}}},db};
}
const request=(method='GET',path='/api/firmware-total')=>new Request('https://summary.example'+path,{method});
test('public total combines history and measured firmware only, using Japan cutoff date',async()=>{
 const env=fixture();const response=await handleSummary(request(),env,new Date('2026-10-25T15:00:00Z'));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{total:7,asOf:'2026-10-26'});
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://filmgr.xergnik.com');
 assert.equal(response.headers.get('Cache-Control'),'public, max-age=60');
 const before=await handleSummary(request(),env,new Date('2026-10-25T14:59:59Z'));assert.deepEqual(await before.json(),{total:5,asOf:'2026-10-25'});
 env.db.close();
});
test('route is read-only, exposes no private breakdown, and never substitutes zero on database errors',async()=>{
 const env=fixture();assert.equal((await handleSummary(request('POST'),env)).status,405);assert.equal((await handleSummary(request('GET','/admin/'),env)).status,404);
 assert.equal((await handleSummary(request('OPTIONS'),env)).status,204);
 const broken={DB:{prepare(){throw Error('offline')}}};const response=await worker.fetch(request(),broken,{waitUntil(){}});
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'temporarily-unavailable'});assert.equal(response.headers.get('Cache-Control'),'no-store');
 env.db.close();
});
test('frontend accepts real zero and dated totals, rejects invalid or missing snapshots',()=>{
 assert.deepEqual(parseFirmwareTotal({total:1207,asOf:'2026-10-26',private:'discard'}),{total:1207,asOf:'2026-10-26'});
 assert.deepEqual(parseFirmwareTotal({total:0,asOf:'2026-10-26'}),{total:0,asOf:'2026-10-26'});
 for(const value of [null,{}, {total:-1,asOf:'2026-10-26'},{total:'1207',asOf:'2026-10-26'},{total:7,asOf:'2026-02-30'}])assert.equal(parseFirmwareTotal(value),null);
 assert.equal(choiceDate('2026-10-26','zh'),'2026 年 10 月 26 日');assert.equal(choiceDate('2026-10-26','ja'),'2026年10月26日');assert.equal(choiceDate('2026-10-26','en'),'October 26, 2026');
});
