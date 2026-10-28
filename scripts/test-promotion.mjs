import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,link,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {promote} from './promote-release.mjs';
import {candidateSnapshot,releaseModels,defaultReleaseNotes} from './release-promotion-shared.mjs';
const source=resolve('.'),read=async(root,n)=>JSON.parse(await readFile(join(root,'src',n))),hash=b=>createHash('sha256').update(b).digest('hex');
async function fixture(){const root=await mkdtemp(join(tmpdir(),'xerfilm-promote-'));await mkdir(join(root,'src'));await mkdir(join(root,'public/downloads'),{recursive:true});for(const n of ['test-releases.json','approved-releases.json','i18n.js','site-version.js',...Object.values(releaseModels).flatMap(m=>m.files)])await writeFile(join(root,'src',n),await readFile(join(source,'src',n)));for(const n of await readdir(join(source,'public/downloads')))if(n.includes('.part'))await link(join(source,'public/downloads',n),join(root,'public/downloads',n));return root;}
for(const model of Object.keys(releaseModels))test(`promote ${model}: exact BINs, one model, notes, consent and test withdrawal`,async()=>{
 const root=await fixture();try{
 const sets=await read(root,'test-releases.json'),stable=await Promise.all(releaseModels[model].files.map(n=>read(root,n))),before={};for(const [id,m] of Object.entries(releaseModels))before[id]=await Promise.all(m.files.map(n=>read(root,n)));
 const request={id:randomUUID(),model,version:'V3.12',head:'a'.repeat(40),revision:sets[model].revision,snapshot:await candidateSnapshot(model,sets[model],stable),notes:defaultReleaseNotes,confirmed:true};
 await assert.rejects(promote(root,{...request,confirmed:false},'4455',{skipGit:true}));
 await assert.rejects(promote(root,request,'wrong',{skipGit:true}));assert.deepEqual(await read(root,'test-releases.json'),sets,'Failed preparation cannot change releases');
 const {changed,receipt}=await promote(root,request,'4455',{skipGit:true});assert.equal(receipt.model,model);assert.equal(changed.filter(f=>f.startsWith('public/release-status/')).length,1);
 const afterSets=await read(root,'test-releases.json');assert.equal(afterSets[model],undefined);for(const other of Object.keys(sets).filter(m=>m!==model))assert.deepEqual(afterSets[other],sets[other]);
 for(const [id,m] of Object.entries(releaseModels))for(const [i,n] of m.files.entries()){
 const r=await read(root,n);if(id!==model){assert.deepEqual(r,before[id][i]);continue;}
 assert.equal(r.encryption,undefined);assert.equal(r.testRelease,undefined);assert.equal(r.version,'V3.12');assert.equal(r.hardwareTested,true);assert.equal(r.publicationRequest,request.id);
 const bytes=Buffer.concat(await Promise.all(r.parts.map(p=>readFile(join(root,'public/downloads',p.file)))));assert.equal(hash(bytes),sets[model].firmware[i].sha256);assert.equal(bytes.length,sets[model].firmware[i].size);
 }
 assert.equal((await readFile(join(root,'src/site-version.js'),'utf8')).includes('V3.12'),true);
 assert.equal((await promote(root,request,'4455',{skipGit:true})).resumed,true,'Retry after a committed release reuses that exact release');
 await assert.rejects(promote(root,{...request,version:'V3.99'},'4455',{skipGit:true}),/receipt mismatch/);
 }finally{await rm(root,{recursive:true,force:true});}
});
