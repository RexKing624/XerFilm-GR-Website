import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {releaseModels,candidateSnapshot,validVersion,compareVersions,validNotes,uuidPattern} from './release-promotion-shared.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async(p,data)=>writeFile(p,JSON.stringify(data,null,2)+'\n');
export async function promote(root,request,password,{skipGit=false}={}){
 if(!request||Object.keys(request).sort().join(',')!=='confirmed,head,id,model,notes,revision,snapshot,version'||request.confirmed!==true||!uuidPattern.test(request.id)||!Object.hasOwn(releaseModels,request.model)||!validVersion(request.version)||!validNotes(request.notes)||!/^[a-f0-9]{40}$/.test(request.head)||!/^[a-f0-9]{64}$/.test(request.snapshot))throw Error('Invalid publication request');
 // A deployment can fail after its commit. A retry resumes the same verified
 // request instead of trying to promote the withdrawn test pair a second time.
 let recorded;try{recorded=await json(join(root,`public/release-status/${request.id}.json`));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(recorded){
  if(recorded.id!==request.id||recorded.model!==request.model||recorded.revision!==request.revision||recorded.version!==request.version||recorded.sourceCommit!==request.head||recorded.sourceSnapshot!==request.snapshot||JSON.stringify(recorded.changes)!==JSON.stringify(request.notes))throw Error('Publication receipt mismatch');
  const pair=await Promise.all(releaseModels[request.model].files.map(n=>json(join(root,'src',n))));
  if(pair.some((r,i)=>r.publicationRequest!==request.id||r.version!==request.version||r.sha256!==recorded.firmware[i].sha256||r.internalVersion!==recorded.firmware[i].revision))throw Error('Published firmware changed; cannot resume');
  return {changed:[],receipt:recorded,resumed:true};
 }
 if(!skipGit&&execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==request.head)throw Error('Website changed; refresh the admin page before publishing');
 const policy=releaseModels[request.model],src=join(root,'src'),downloads=join(root,'public/downloads');
 const sets=await json(join(src,'test-releases.json')),set=sets[request.model];
 const stable=await Promise.all(policy.files.map(n=>json(join(src,n))));
 if(!set||set.revision!==request.revision||await candidateSnapshot(request.model,set,stable)!==request.snapshot)throw Error('Test firmware changed; publication stopped');
 if(compareVersions(request.version,stable[0].version)<0)throw Error('Version downgrade is not allowed');
 if(typeof password!=='string'||!password)throw Error('Test download password is not configured');
 const firmware=[];
 // Verify every ciphertext chunk, password proof and both complete BINs before writing anything.
 for(const r of set.firmware){
  const chunks=[];for(const p of r.parts){const b=await readFile(join(downloads,p.file));if(b.length!==p.size||hash(b)!==p.sha256)throw Error('Damaged test chunk');chunks.push(b);}
  const encrypted=Buffer.concat(chunks);if(encrypted.length!==r.downloadSize||hash(encrypted)!==r.transportSha256)throw Error('Damaged test download');
  const e=r.encryption,material=await crypto.subtle.importKey('raw',Buffer.from(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:e.iterations,salt:Buffer.from(e.salt,'base64')},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const proof=await crypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.check.iv,'base64')},key,Buffer.from(e.check.ciphertext,'base64'));
  if(Buffer.from(proof).toString()!==`XerFilm GR / ${r.camera} / ${r.version}`)throw Error('Wrong test password');
  const bin=Buffer.from(await crypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,encrypted));
  if(bin.length!==r.size||hash(bin)!==r.sha256)throw Error('Firmware identity mismatch');firmware.push(bin);
 }
 const pins=await json(join(src,'approved-releases.json')),date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const changed=[],newReleases=[];
 for(let i=0;i<2;i++){
  const r=structuredClone(set.firmware[i]);for(const k of ['encryption','downloadSize','transportSha256','testRelease'])delete r[k];
  Object.assign(r,{version:request.version,statisticsVersion:request.version,hardwareTested:true,releaseApproved:true,releaseDate:date,publicationRequest:request.id});r.parts=[];
  const bin=firmware[i],stem=`firmware-${request.model}-${request.version.toLowerCase()}-${r.internalVersion.toLowerCase()}-${request.id.slice(0,8)}`;
  for(let at=0,n=1;at<bin.length;at+=16777216,n++){
   const b=bin.subarray(at,at+16777216),file=`${stem}.part${n}`;await writeFile(join(downloads,file),b);r.parts.push({file,size:b.length,sha256:hash(b)});changed.push('public/downloads/'+file);
  }
  await save(join(src,policy.files[i]),r);changed.push('src/'+policy.files[i]);newReleases.push(r);
  pins[policy.files[i]]={identity:[r.internalVersion,r.installationVersion,r.filename,r.sha256],version:r.version,hardwareTested:true};
 }
 await save(join(src,'approved-releases.json'),pins);changed.push('src/approved-releases.json');
 delete sets[request.model];await save(join(src,'test-releases.json'),sets);changed.push('src/test-releases.json');
 // Remove only assets no longer referenced by any current stable or test release.
 const used=new Set();for(const p of Object.values(releaseModels))for(const f of p.files)for(const part of (await json(join(src,f))).parts)used.add(part.file);
 for(const s of Object.values(sets))for(const r of s.firmware)for(const p of r.parts)used.add(p.file);
 for(const r of [...stable,...set.firmware])for(const p of r.parts)if(!used.has(p.file)){await unlink(join(downloads,p.file));changed.push('public/downloads/'+p.file);}
 const copy=(await import(pathToFileURL(join(src,'i18n.js')).href+'?publication='+request.id)).copy;
 for(const lang of ['zh','en','ja']){
  const c=copy[lang],info=c.modelReleases[request.model],oldVersion=stable[0].version;
  info.note=request.version+'：'+request.notes[lang].join(' ');info.changesTitle=request.version+(lang==='en'?' UPDATE':lang==='ja'?' 更新内容':' 更新');info.changes=request.notes[lang];
  if(request.model==='gr4')c.enhancedTestNote=c.enhancedTestNote.replaceAll(oldVersion,request.version);
  else c.enhancedModels[request.model].enhancedTestNote=c.enhancedModels[request.model].enhancedTestNote.replaceAll(oldVersion,request.version);
 }
 await writeFile(join(src,'i18n.js'),'export const copy = '+JSON.stringify(copy,null,2)+';\n');changed.push('src/i18n.js');
 const site=join(src,'site-version.js'),siteText=await readFile(site,'utf8'),oldSite=siteText.match(/V\d+\.\d+(?:\.\d+)?/)?.[0];
 if(oldSite&&compareVersions(request.version,oldSite)>0){await writeFile(site,siteText.replace(oldSite,request.version));changed.push('src/site-version.js');}
 const receipt={id:request.id,model:request.model,revision:request.revision,version:request.version,sourceCommit:request.head,sourceSnapshot:request.snapshot,publishedAt:new Date().toISOString(),firmware:newReleases.map(r=>({variant:r.downloadVariant,revision:r.internalVersion,sha256:r.sha256})),changes:request.notes,hardwareTestAttestation:'Owner confirmed both variants before requesting publication.'};
 await mkdir(join(root,'public/release-status'),{recursive:true});await save(join(root,`public/release-status/${request.id}.json`),receipt);changed.push(`public/release-status/${request.id}.json`);
 return {changed:[...new Set(changed)],receipt};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=await promote(process.cwd(),JSON.parse(process.env.RELEASE_REQUEST||'null'),process.env.FIRMWARE_TEST_PASSWORD);
 await save('.release-changes.json',result.changed);console.log(`Prepared ${result.receipt.model} ${result.receipt.version}; both BINs exactly match the selected test firmware. Nothing has been pushed yet.`);
}
