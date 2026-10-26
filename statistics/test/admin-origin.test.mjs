import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleAdminAccess} from '../src/admin-access.js';
import {handleRequest} from '../src/core.js';
const official='https://filmgr.xergnik.com';
const url='https://statistics.test/api/stats';
test('official admin can preflight authenticated reads only',async()=>{
 for(const [origin,method,headers,status] of [[official,'GET','authorization',204],[official,'POST','authorization',403],[official,'GET','x-extra',403],['https://untrusted.example','GET','authorization',403]]){
  let called=false;
  const response=await handleAdminAccess(new Request(url,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':method,'Access-Control-Request-Headers':headers}}),()=>{called=true;throw Error('Unexpected query')});
  assert.equal(response.status,status);assert.equal(called,false);
  if(status===204){assert.equal(response.headers.get('Access-Control-Allow-Origin'),official);assert.equal(response.headers.get('Access-Control-Allow-Headers'),'Authorization');}
 }
});
test('cross-origin admin retains the existing credential check and readable errors',async()=>{
 const env={ADMIN_TOKEN:'test-only-private-token-with-32-characters'};
 for(const token of ['', 'wrong']){
  const request=new Request(url,{headers:{Origin:official,Authorization:'Bearer '+token}});
  const response=await handleAdminAccess(request,()=>handleRequest(request,env));
  assert.equal(response.status,401);assert.equal(response.headers.get('Access-Control-Allow-Origin'),official);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
});
test('existing same-origin admin and event endpoints are untouched',async()=>{
 for(const request of [new Request(url),new Request('https://statistics.test/api/downloads',{method:'POST',headers:{Origin:official}})]){
  const original=new Response('unchanged',{status:202});
  assert.equal(await handleAdminAccess(request,()=>original),original);
 }
});
test('static admin contains only login assets and still requests authorized data',()=>{
 const base=new URL('../../public/admin/',import.meta.url);
 const html=readFileSync(new URL('index.html',base),'utf8');
 const file=html.match(/src="\/admin\/(admin-[a-f0-9]+\.js)"/)?.[1];
 assert.ok(file);const script=readFileSync(new URL(file,base),'utf8');
 assert.match(html,/id="dashboard" hidden/);assert.doesNotMatch(html,/<script(?! src=)/);
 assert.doesNotMatch(html,/__NONCE__/);assert.match(html,/noindex,nofollow/);
 assert.match(script,/https:\/\/xerfilm-download-statistics\.xerfilm-download-statistics\.workers\.dev\/api\/stats/);
 assert.match(script,/Authorization:'Bearer '\+token/);
 assert.doesNotMatch(script,/(?:localStorage|sessionStorage)\.setItem\([^\n]*(?:token|password)/i);
});
