import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {handleReleases} from '../src/releases.js';
import {handleAdminAccess} from '../src/admin-access.js';
import {releaseModels,defaultReleaseNotes} from '../../scripts/release-promotion-shared.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/release-catalog.json',import.meta.url)));
const origin='https://filmgr.xergnik.com',base='https://backend.example/api/releases',root=new URL('../../',import.meta.url);
function setup(){
 const db=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const state={head:'a'.repeat(40),dispatches:[],retries:0,runs:[{id:123,status:'queued'}],receipt:null,dispatchStatus:200,apiCalls:0};
 const env={ADMIN_TOKEN:'test-management-credential-at-least-32',RELEASE_GITHUB_TOKEN:'test-deployment-credential',DB:{prepare(sql){let args=[];return{bind(...v){args=v;return this;},async all(){return{results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}}}},RELEASE_FETCH:async(url,options={})=>{
  state.apiCalls++;const u=new URL(url);assert.equal(options.redirect,'manual');
  if(u.hostname==='filmgr.xergnik.com')return state.receipt?Response.json(state.receipt):new Response('pending',{status:404});
  assert.equal(u.hostname,'api.github.com');assert.ok(u.pathname.startsWith('/repos/RexKing624/XerFilm-GR-Website/'));
  if(u.pathname.endsWith('/commits/main'))return Response.json({sha:state.head});
  if(u.pathname.includes('/contents/src/'))return Response.json(structuredClone(fixture[u.pathname.split('/').at(-1)]));
  if(u.pathname.endsWith('/dispatches')){state.dispatches.push(JSON.parse(options.body));if(state.lostResponse)throw TypeError('lost');return state.dispatchStatus===204?new Response(null,{status:204}):Response.json({workflow_run_id:123},{status:state.dispatchStatus});}
  if(u.pathname.endsWith('/rerun-failed-jobs')){state.retries++;return new Response(null,{status:201});}
  if(u.pathname.endsWith('/actions/runs/123'))return Response.json(state.runs[0]);
  if(u.pathname.endsWith('/runs'))return Response.json({workflow_runs:state.runs});
  throw Error('Unexpected URL '+u.pathname);
 }};
 const request=(path='',body,headers={})=>new Request(base+path,{method:body?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+env.ADMIN_TOKEN,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 const call=(path='',body,headers)=>handleReleases(request(path,body,headers),env);
 const plan=async model=>{const c=await (await call()).json(),m=c.models.find(m=>m.id===model);return{id:randomUUID(),model,version:m.candidate.version,head:c.head,snapshot:m.candidate.snapshot,notes:structuredClone(defaultReleaseNotes),confirmed:true};};
 return {env,db,state,request,call,plan};
}
test('private catalog and publication require authentication; blocked origins never call GitHub',async()=>{
 const s=setup();for(const [headers,status] of [[{Authorization:''},401],[{Authorization:'Bearer invalid'},401],[{Origin:'https://evil.example'},403]])assert.equal((await s.call('',undefined,headers)).status,status);
 assert.equal(s.state.apiCalls,0);assert.equal((await s.call()).status,200);
 const body=await (await s.call()).json();assert.equal(body.models.length,3);assert.equal(body.models[0].candidate.revision,'v62');assert.ok(!JSON.stringify(body).includes('test-deployment-credential'));assert.ok(!JSON.stringify(body).includes('ciphertext'));
});
test('dispatch records model and both variants, is idempotent and blocks a second active release',async()=>{
 const s=setup(),p=await s.plan('gr4');const first=await s.call('/publish',p);assert.equal(first.status,202);assert.equal((await first.json()).status,'queued');assert.equal(s.state.dispatches.length,1);
 const sent=s.state.dispatches[0];assert.equal(sent.ref,'main');assert.equal(sent.inputs.dry_run,false);assert.equal(JSON.parse(sent.inputs.request).revision,'v62');
 s.state.runs=[{id:123,status:'queued'}];assert.equal((await s.call('/publish',p)).status,202);assert.equal(s.state.dispatches.length,1);
 assert.equal((await s.call('/publish',{...p,version:'V3.99'})).status,409);
 assert.equal((await s.call('/publish',await s.plan('gr3'))).status,409);assert.equal(s.state.dispatches.length,1);
 assert.equal(s.db.prepare('SELECT COUNT(*) n FROM downloads').get().n,0);
});
test('stale content, downgraded versions, missing test consent and injected input never dispatch',async()=>{
 const s=setup(),p=await s.plan('gr4');for(const bad of [{...p,head:'b'.repeat(40)},{...p,snapshot:'0'.repeat(64)},{...p,version:'V1.0'},{...p,confirmed:false},{...p,version:'V3.11; echo unsafe'},{...p,notes:{...p.notes,zh:['<script>']}},{...p,model:'gr4/../../bad'},{...p,extra:'unknown'}])assert.ok((await s.call('/publish',bad)).status>=400);
 assert.equal(s.state.dispatches.length,0);
});
test('concurrent clicks create one job and dispatch once',async()=>{
 const s=setup(),p=await s.plan('gr4');const responses=await Promise.all([s.call('/publish',p),s.call('/publish',p)]);assert.ok(responses.every(r=>r.status===202));assert.equal(s.state.dispatches.length,1);assert.equal(s.db.prepare('SELECT COUNT(*) n FROM release_jobs').get().n,1);
});
test('deployment is not called live until an exact public receipt is visible',async()=>{
 const s=setup(),p=await s.plan('gr3');await s.call('/publish',p);s.state.runs=[{id:123,status:'completed',conclusion:'success'}];
 assert.equal((await(await s.call('/jobs/'+p.id)).json()).status,'in_progress');
 s.state.receipt={id:p.id,model:'gr4',version:p.version,revision:'R41'};assert.equal((await(await s.call('/jobs/'+p.id)).json()).status,'in_progress');
 s.state.receipt={id:p.id,model:'gr3',version:p.version,revision:'R41'};assert.equal((await(await s.call('/jobs/'+p.id)).json()).status,'success');
 const later=await s.plan('gr3x');assert.equal((await s.call('/publish',later)).status,202);
});
test('failed runs show failure; a retry reuses the exact run rather than another candidate',async()=>{
 const s=setup(),p=await s.plan('gr4');await s.call('/publish',p);s.state.runs=[{id:123,status:'completed',conclusion:'failure'}];assert.equal((await(await s.call('/jobs/'+p.id)).json()).status,'failed');
 const response=await handleReleases(new Request(base+'/jobs/'+p.id+'/retry',{method:'POST',headers:{Authorization:'Bearer '+s.env.ADMIN_TOKEN}}),s.env);assert.equal(response.status,202);assert.equal(s.state.dispatches.length,1);
});
test('lost GitHub response retains one pending job and discovers it by request ID',async()=>{
 const s=setup(),p=await s.plan('gr4');s.state.lostResponse=true;assert.equal((await s.call('/publish',p)).status,202);
 assert.equal(s.db.prepare('SELECT status FROM release_jobs').get().status,'attention');
 s.state.runs=[{id:123,status:'in_progress',display_title:`Release gr4 ${p.id}`}];assert.equal((await(await s.call('/jobs/'+p.id)).json()).status,'in_progress');
 assert.equal(s.state.dispatches.length,1);
});
test('CORS allows authenticated publication only from the official admin',async()=>{
 for(const [o,status] of [[origin,204],['https://evil.example',403]]){
  const r=await handleAdminAccess(new Request(base+'/publish',{method:'OPTIONS',headers:{Origin:o,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization, content-type'}}),()=>{throw Error('Unexpected next');});assert.equal(r.status,status);
 }
});

test('without deployment credentials the owner can review public candidates but cannot dispatch',async()=>{
 const s=setup(),p=await s.plan('gr4');delete s.env.RELEASE_GITHUB_TOKEN;const response=await s.call();assert.equal(response.status,200);assert.equal((await response.json()).configured,false);assert.equal((await s.call('/publish',p)).status,503);assert.equal(s.state.dispatches.length,0);
});

test('concurrent retry clicks claim the failed run once',async()=>{
 const s=setup(),p=await s.plan('gr4');await s.call('/publish',p);s.state.runs=[{id:123,status:'completed',conclusion:'failure'}];await s.call('/jobs/'+p.id);
 const retry=()=>handleReleases(new Request(base+'/jobs/'+p.id+'/retry',{method:'POST',headers:{Authorization:'Bearer '+s.env.ADMIN_TOKEN}}),s.env);
 const responses=await Promise.all([retry(),retry()]);assert.deepEqual(responses.map(r=>r.status).sort(),[202,409]);assert.equal(s.state.retries,1);
});
