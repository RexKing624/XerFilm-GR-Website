import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadFirmware,unlockFirmware} from '../src/download.js';
import {copy} from '../src/i18n.js';
import {firmwareBaseCopy} from '../src/firmware-base-copy.js';
const root=new URL('../',import.meta.url),json=async name=>JSON.parse(await readFile(new URL('src/'+name,root)));
const latest=await json('latest-base-releases.json'),pins=await json('approved-latest-base-releases.json');
const password=process.env.LATEST_TEST_PASSWORD;
const expected={gr4:['1.11','1.21','1.22','fwdc248b.bin','ea1a52dd43f75328dac4701f61d16e78e3eeade5023391ba8a1b5e802713598a','51a39920ea8be55e488ed561e74b6244d2d6377cbef8722abbb52961b3d88096'],gr3:['2.10','2.20','2.21','fwdc239b.bin','9e2d19b5c980e3a4e3abc812748a3e2950f7fb4775b044dba1a08f2a49746885','59faa70e72cb4ea1720f41110adda1ece6d512ae45a5e4898a2c7c08ec6bc5cf'],gr3x:['1.60','1.70','1.71','fwdc243b.bin','0d072e30f6f7ced8230e76a2c77e1bbf53f9be58d7a2ce8c9dccc64a081a257b','15e09fa9b7896050d054fec721e0ee31b17fe648ad41f1501c944756e8bc9105']};
const realFetch=globalThis.fetch;let calls=0;
globalThis.fetch=async(url,{signal}={})=>{calls++;signal?.throwIfAborted();return new Response(await readFile(new URL(String(url).replace(/^\.\//,'public/'),root)));};
try{
 for(const [model,[old,base,enhanced,filename,standardHash,enhancedHash]]of Object.entries(expected)){
  const oldRelease=await json(model==='gr4'?'release.json':`${model}-release.json`);assert.equal(oldRelease.baseVersion,old);
  for(const variant of ['standard','enhanced']){
   const r=latest[model][variant],p=pins[`${model}:${variant}`],testing=p.testRelease===true;assert.equal(r.sha256,variant==='standard'?standardHash:enhancedHash);assert.equal(r.baseVersion,base);assert.equal(r.installationVersion,variant==='standard'?base:enhanced);assert.equal(r.filename,filename);assert.equal(r.downloadVariant,variant);assert.equal(r.hardwareTested,p.hardwareTested);assert.equal(!!r.encryption,testing);assert.equal(!!r.testRelease,testing);assert.equal(p.testRelease,testing);assert.equal(r.downloadSuspended,undefined);assert.equal(r.releaseApproved,true);assert.equal(r.version,'V3.12');assert.equal(r.statisticsVersion,testing?'V3.12-test':'V3.12');assert.deepEqual(p.identity,[r.internalVersion,r.installationVersion,r.filename,r.sha256]);
   let decryptionKey;
   if(testing){
    await assert.rejects(loadFirmware(r),/Password required/);
    for(const wrong of ['incorrect-test-password','2222','3333'])await assert.rejects(unlockFirmware(r,wrong));
    const chunks=await Promise.all(r.parts.map(part=>readFile(new URL('public/downloads/'+part.file,root))));
    const ciphertext=Buffer.concat(chunks);assert.equal(ciphertext.length,r.size+16);assert.equal(createHash('sha256').update(ciphertext).digest('hex'),p.transportSha256);assert.notEqual(p.transportSha256,r.sha256);
    if(password)decryptionKey=await unlockFirmware(r,password);
   }
   if(!testing||decryptionKey){
    const b=new Uint8Array(await(await loadFirmware(r,{decryptionKey})).arrayBuffer());assert.equal(b.length,r.size);assert.equal(createHash('sha256').update(b).digest('hex'),r.sha256);
    const corrupt=structuredClone(r);corrupt.parts[0].sha256='0'.repeat(64);await assert.rejects(loadFirmware(corrupt,{decryptionKey}),/Part checksum mismatch/);
    const stop=new AbortController();stop.abort();await assert.rejects(loadFirmware(r,{decryptionKey,signal:stop.signal}),{name:'AbortError'});
   }
   console.log(model,base,variant,testing&&!decryptionKey?'encrypted assets / required password / wrong password passed':'exact tested BIN / filename / hash / corruption / abort passed');
  }
  for(const lang of ['zh','en','ja']){assert.ok(copy[lang].modelReleases[model].compatible.includes(base));assert.ok(copy[lang].modelReleases[model].compatible.includes(old));assert.ok(copy[lang].officialUpdateNotice.includes(base));const l=firmwareBaseCopy[lang];for(const key of Object.keys(firmwareBaseCopy.zh))assert.equal(typeof l[key],'string',lang+' '+key);assert.ok(l.earlier.includes('{version}')&&l.identify.includes('{standard}')&&l.identify.includes('{enhanced}'));}
 }
 assert.equal(Object.keys(pins).length,6);
 assert.equal(latest.gr4.standard.selectionMinimumVersion,'1.20');
 assert.equal(latest.gr4.enhanced.selectionMinimumVersion,'1.20');
 for(const lang of ['zh','en','ja'])assert.ok(firmwareBaseCopy[lang].currentFrom.includes('{version}'));
 for(const r of Object.values(latest.gr4)){assert.equal(r.testRelease,undefined);assert.equal(r.encryption,undefined);assert.equal(r.statisticsVersion,'V3.12');}
 console.log('Legacy pairs remain stable. All latest-base pairs are approved password-free releases, including GR IV official 1.21 R2. All three languages match. Fetch calls:',calls);
}finally{globalThis.fetch=realFetch;}
