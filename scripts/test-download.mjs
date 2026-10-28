import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadFirmware} from '../src/download.js';
import {copy} from '../src/i18n.js';
import {releaseModels} from './release-promotion-shared.mjs';
const root=new URL('../',import.meta.url),json=async n=>JSON.parse(await readFile(new URL('src/'+n,root)));
const pins=await json('approved-releases.json'),originals=await json('original-releases.json');
assert.deepEqual(await json('download-availability.json'),{gr4:true,gr3:true,gr3x:true});
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,{signal}={})=>{signal?.throwIfAborted();return new Response(await readFile(new URL(String(url).replace(/^\.\//,'public/'),root)));};
try{
 for(const [model,policy] of Object.entries(releaseModels)){
  const variants=await Promise.all(policy.files.map(json));
  for(let i=0;i<2;i++){
   const r=variants[i],p=pins[policy.files[i]];
   assert.equal(r.encryption,undefined);assert.equal(r.downloadSize,undefined);assert.equal(r.testRelease,undefined);
   assert.ok(r.releaseApproved||r.hardwareTested);assert.equal(r.hardwareTested,p.hardwareTested);assert.equal(r.version,p.version);
   assert.deepEqual([r.internalVersion,r.installationVersion,r.filename,r.sha256],p.identity);
   const bytes=new Uint8Array(await (await loadFirmware(r)).arrayBuffer());assert.equal(bytes.length,r.size);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.identity[3]);
   const corrupted=structuredClone(r);corrupted.parts[0].sha256='0'.repeat(64);await assert.rejects(loadFirmware(corrupted),/Part checksum mismatch/);
   const cancelled=new AbortController();cancelled.abort();await assert.rejects(loadFirmware(r,{signal:cancelled.signal}),{name:'AbortError'});
  }
  for(const lang of ['zh','en','ja']){
   const c=copy[lang],info=c.modelReleases[model];assert.ok(info.compatible&&info.note&&info.changes.length&&info.changesTitle.startsWith(variants[0].version));
   assert.ok(info.frameDesc.includes('1:1')&&!info.frameDesc.includes('4433'));
   const enhanced=model==='gr4'?c:c.enhancedModels[model];assert.ok(enhanced.enhancedTestNote.includes(variants[1].version));
   assert.equal(c.checks.length,4);assert.ok(c.originalRestoreTitle&&c.officialUpdateNotice&&c.resetWarning);assert.equal(c.originalFirmwareURL,undefined);
   assert.equal(c.modelReleases.gr4.sourceURL,'https://github.com/lemonadesaltbagel/GR4-GF2Unlock');
  }
 }
 assert.deepEqual(originals.map(r=>[r.id,r.version,r.filename]),[['gr3','2.10','fwdc239b.bin'],['gr3x','1.60','fwdc243b.bin'],['gr4','1.11','fwdc248b.bin']]);
 for(const r of originals){const bytes=new Uint8Array(await (await loadFirmware(r)).arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);}
 const app=await readFile(new URL('src/App.vue',root),'utf8');assert.ok(app.includes("openDrawer('original')")&&app.includes('testReleases[selectedModel]'));
 console.log('All three stable pairs: approved BINs, password-free save, cancellation, corruption and language/version consistency passed.');
}finally{globalThis.fetch=realFetch;}
await import('./test-test-downloads.mjs');
