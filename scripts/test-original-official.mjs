import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {createOriginalRestoreGate,originalRestoreRequestId} from '../src/original-restore-gate.js';
import {copy} from '../src/i18n.js';

const root=new URL('../',import.meta.url);
const official=JSON.parse(await readFile(new URL('src/official-original-releases.json',root)));
const backups=JSON.parse(await readFile(new URL('src/original-releases.json',root)));

test('official redirects point to the exact verified versions, not moving support pages',()=>{
 const expected={gr4:['1.21','gr4_v121.zip','ace9fc65f6e4fa3b1096d590ba4bddad4f4814e075a4d85a973cb943f166da73'],gr3:['2.20','gr3_v220.zip','7b19f9c03f2448c2b674fb919f6a86d22d6d83801521a9c1226a0e20cf0b5a2f'],gr3x:['1.70','gr3x_v170.zip','6a028e90b4f23c9e9af968b03bca5032b71f460be85fd2c49f4078366a71dc6d']};
 assert.equal(official.length,3);
 for(const r of official){
  assert.deepEqual([r.version,r.filename,r.sha256],expected[r.id]);
  assert.equal(r.url,'https://www.ricoh-imaging.co.jp/resources/japan/support/download/digital/FIRMWARE/'+r.filename);
  assert.equal(r.officialFirmware,true);assert.equal(r.parts,undefined);
 }
});

test('each official redirect and backup download needs its own wait and acknowledgement',()=>{
 let time=0;const gate=createOriginalRestoreGate(()=>time),targets=[...official,...backups];
 const keys=targets.map(originalRestoreRequestId);assert.equal(new Set(keys).size,6);
 for(const target of targets){
  const key=originalRestoreRequestId(target);gate.start(key);
  assert.equal(gate.allows(key,true),false);time+=9999;assert.equal(gate.allows(key,true),false);
  time++;assert.equal(gate.allows(key,false),false);assert.equal(gate.allows(key,true),true);
  for(const other of targets)if(other!==target)assert.equal(gate.allows(originalRestoreRequestId(other),true),false);
  assert.equal(gate.allows(originalRestoreRequestId({...target,version:'9.99'}),true),false);
  gate.reset();assert.equal(gate.allows(key,true),false);
 }
 assert.throws(()=>originalRestoreRequestId({id:'unknown',version:'1.21'}));
 assert.throws(()=>originalRestoreRequestId({id:'gr4',version:'not-a-version'}));
});

test('all languages distinguish official ZIP redirects from archived BIN downloads',()=>{
 for(const locale of ['zh','en','ja']){
  const t=copy[locale];
  for(const key of ['originalSourcesTitle','originalSourcesIntro','originalOfficialTitle','originalOfficialIntro','originalOfficialDownload','originalOfficialConfirm','openedOfficial'])assert.equal(typeof t[key],'string',locale+' '+key);
  assert.ok(t.originalOfficialDownload.includes('.zip'));
  assert.notEqual(t.originalOfficialConfirm,t.originalRestoreConfirm);
 }
});
