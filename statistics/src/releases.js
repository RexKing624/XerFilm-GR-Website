import {isAdmin,bodyJSON,json} from './core.js';
import {releaseModels,defaultReleaseNotes,candidateSnapshot,validNotes,validVersion,compareVersions,uuidPattern} from '../../scripts/release-promotion-shared.mjs';
import preview0 from '../../src/test-releases.json' with {type:'json'};
import preview1 from '../../src/release.json' with {type:'json'};
import preview2 from '../../src/enhanced-release.json' with {type:'json'};
import preview3 from '../../src/gr3-release.json' with {type:'json'};
import preview4 from '../../src/gr3-enhanced-release.json' with {type:'json'};
import preview5 from '../../src/gr3x-release.json' with {type:'json'};
import preview6 from '../../src/gr3x-enhanced-release.json' with {type:'json'};
const previewFiles={'test-releases.json':preview0,'release.json':preview1,'enhanced-release.json':preview2,'gr3-release.json':preview3,'gr3-enhanced-release.json':preview4,'gr3x-release.json':preview5,'gr3x-enhanced-release.json':preview6};
const repository='RexKing624/XerFilm-GR-Website',workflow='promote-release.yml',active=['dispatching','queued','in_progress','attention'];
async function github(env,path,options={}){
 const r=await (env.RELEASE_FETCH||fetch)(`https://api.github.com/repos/${repository}/${path}`,{...options,signal:AbortSignal.timeout(15000),redirect:'error',headers:{Accept:'application/vnd.github+json',...(env.RELEASE_GITHUB_TOKEN?{Authorization:'Bearer '+env.RELEASE_GITHUB_TOKEN}:{}),'X-GitHub-Api-Version':'2026-03-10','User-Agent':'XerFilm-release-admin','Content-Type':'application/json',...options.headers}});
 if(!r.ok){const e=Error('github-unavailable');e.definitive=r.status>=400&&r.status<500;throw e;}if(r.status===204)return null;const text=await r.text();return text?JSON.parse(text):null;
}
const file=(env,name,head)=>!env.RELEASE_GITHUB_TOKEN?structuredClone(previewFiles[name]):github(env,`contents/src/${name}?ref=${head}`,{headers:{Accept:'application/vnd.github.raw+json'}});
async function catalog(env){
 const head=env.RELEASE_GITHUB_TOKEN?(await github(env,'commits/main')).sha:null;if(env.RELEASE_GITHUB_TOKEN&&!/^[a-f0-9]{40}$/.test(head))throw Error('invalid-head');
 const sets=await file(env,'test-releases.json',head);
 const models=await Promise.all(Object.entries(releaseModels).map(async([id,p])=>{const stable=await Promise.all(p.files.map(n=>file(env,n,head))),test=sets[id];return {id,label:p.label,stable:stable.map(r=>({version:r.version,revision:r.internalVersion,sha256:r.sha256})),candidate:test?{revision:test.revision,title:test.firmware[0].version,snapshot:await candidateSnapshot(id,test,stable),version:test.firmware[0].statisticsVersion.replace(/-test$/,''),firmware:test.firmware.map(r=>({revision:r.internalVersion,sha256:r.sha256,size:r.size,variant:r.downloadVariant}))}:null};}));
 return {head,models,notes:defaultReleaseNotes};
}
const rows=async(env,sql,...params)=>(await env.DB.prepare(sql).bind(...params).all()).results;
function publicJob(r){return r&&{id:r.id,model:r.model,revision:r.revision,version:r.version,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,runURL:r.run_id?`https://github.com/${repository}/actions/runs/${r.run_id}`:null};}
async function reconcile(env,row){
 if(!row||!active.includes(row.status))return row;let run;
 if(row.run_id)run=await github(env,`actions/runs/${row.run_id}`);
 else{const runs=await github(env,`actions/workflows/${workflow}/runs?event=workflow_dispatch&branch=main&per_page=100`);run=runs.workflow_runs.find(r=>r.display_title===`Release ${row.model} ${row.id}`);}
 let state=row.status;
 if(run){state=run.status==='completed'?(run.conclusion==='success'?'success':'failed'):(run.status==='in_progress'?'in_progress':'queued');
 if(state==='success'){const r=await (env.RELEASE_FETCH||fetch)(`https://filmgr.xergnik.com/release-status/${row.id}.json?t=${Date.now()}`,{signal:AbortSignal.timeout(10000),redirect:'error',cache:'no-store'});if(!r.ok)state='in_progress';else{const receipt=await r.json();if(receipt.id!==row.id||receipt.model!==row.model||receipt.revision!==row.revision||receipt.version!==row.version)state='in_progress';}}
 }else if(Date.now()-Date.parse(row.created_at)>10*60000)state='attention';
 const updated=new Date().toISOString();await env.DB.prepare('UPDATE release_jobs SET status=?,run_id=?,updated_at=? WHERE id=? AND status IN (?,?,?,?)').bind(state,run?.id||row.run_id||null,updated,row.id,...active).run();return (await rows(env,'SELECT * FROM release_jobs WHERE id=?',row.id))[0];
}
export async function handleReleases(request,env){
 try{
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(origin&&origin!=='https://filmgr.xergnik.com'&&origin!==url.origin)return json({error:'origin'},403);
 if(!await isAdmin(request,env))return json({error:'unauthorized'},401);
 if(env.EVENT_LIMITER&&!(await env.EVENT_LIMITER.limit({key:'release-admin'})).success)return json({error:'rate-limit'},429);
 if(!env.RELEASE_GITHUB_TOKEN&&request.method!=='GET')return json({error:'publisher-not-configured'},503);
 if(url.pathname==='/api/releases'&&request.method==='GET'){const jobs=await rows(env,'SELECT * FROM release_jobs ORDER BY created_at DESC LIMIT 10'),refreshed=await Promise.all(jobs.map(j=>reconcile(env,j)));return json({...await catalog(env),configured:!!env.RELEASE_GITHUB_TOKEN,jobs:refreshed.map(publicJob)});}
 const retry=url.pathname.match(/^\/api\/releases\/jobs\/([a-f0-9-]{36})\/retry$/);
 if(retry&&request.method==='POST'){
  const job=(await rows(env,'SELECT * FROM release_jobs WHERE id=?',retry[1]))[0];
  if(!job||job.status!=='failed'||!job.run_id)return json({error:'invalid-retry'},409);
  try{const claimed=await env.DB.prepare('UPDATE release_jobs SET status=? WHERE id=? AND status=?').bind('queued',job.id,'failed').run();if((claimed.meta?.changes??claimed.changes)!==1)return json({error:'release-in-progress'},409);}catch{return json({error:'release-in-progress'},409);}
  try{await github(env,`actions/runs/${job.run_id}/rerun-failed-jobs`,{method:'POST'});}catch(e){await env.DB.prepare('UPDATE release_jobs SET status=? WHERE id=?').bind(e.definitive?'failed':'attention',job.id).run();return json({error:'dispatch-uncertain',id:job.id},503);}
  return json(publicJob({...job,status:'queued'}),202);
 }
 const match=url.pathname.match(/^\/api\/releases\/jobs\/([a-f0-9-]{36})$/);
 if(match&&request.method==='GET'){const job=(await rows(env,'SELECT * FROM release_jobs WHERE id=?',match[1]))[0];return job?json(publicJob(await reconcile(env,job))):json({error:'not-found'},404);}
 if(url.pathname!=='/api/releases/publish'||request.method!=='POST')return json({error:'method'},405);
 let b;try{b=await bodyJSON(request,8192);}catch{return json({error:'invalid-body'},400);}
 if(!b||Object.keys(b).sort().join(',')!=='confirmed,head,id,model,notes,snapshot,version'||b.confirmed!==true||!uuidPattern.test(b.id)||!Object.hasOwn(releaseModels,b.model)||!validVersion(b.version)||!validNotes(b.notes)||!/^[a-f0-9]{40}$/.test(b.head)||!/^[a-f0-9]{64}$/.test(b.snapshot))return json({error:'invalid-release'},400);
 const existing=(await rows(env,'SELECT * FROM release_jobs WHERE id=?',b.id))[0];
 if(existing){if(existing.model!==b.model||existing.head!==b.head||existing.snapshot!==b.snapshot||existing.version!==b.version||existing.notes!==JSON.stringify(b.notes))return json({error:'request-conflict'},409);return json(publicJob(await reconcile(env,existing)),202);}
 const current=await catalog(env),model=current.models.find(x=>x.id===b.model);
 if(current.head!==b.head||!model.candidate||model.candidate.snapshot!==b.snapshot)return json({error:'stale-release'},409);
 if(compareVersions(b.version,model.stable[0].version)<0)return json({error:'version-downgrade'},400);
 for(const job of await rows(env,"SELECT * FROM release_jobs WHERE status IN ('dispatching','queued','in_progress','attention')"))await reconcile(env,job);
 const now=new Date().toISOString();
 try{await env.DB.prepare('INSERT INTO release_jobs(id,model,revision,version,head,snapshot,notes,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(b.id,b.model,model.candidate.revision,b.version,b.head,b.snapshot,JSON.stringify(b.notes),'dispatching',now,now).run();}catch{const repeated=(await rows(env,'SELECT * FROM release_jobs WHERE id=?',b.id))[0];if(repeated&&repeated.model===b.model&&repeated.snapshot===b.snapshot&&repeated.version===b.version&&repeated.notes===JSON.stringify(b.notes))return json(publicJob(repeated),202);return json({error:'release-in-progress'},409);}
 let result;
 try{result=await github(env,`actions/workflows/${workflow}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{request:JSON.stringify({...b,revision:model.candidate.revision}),dry_run:false}})});}
 catch(e){await env.DB.prepare('UPDATE release_jobs SET status=? WHERE id=?').bind(e.definitive?'failed':'attention',b.id).run();return json({error:e.definitive?'dispatch-failed':'dispatch-uncertain',id:b.id},e.definitive?503:202);}
 const runID=Number.isSafeInteger(result?.workflow_run_id)?result.workflow_run_id:null;
 await env.DB.prepare('UPDATE release_jobs SET status=?,run_id=? WHERE id=?').bind('queued',runID,b.id).run();return json(publicJob((await rows(env,'SELECT * FROM release_jobs WHERE id=?',b.id))[0]),202);
 }catch{return json({error:'release-service-unavailable'},503);}
}
