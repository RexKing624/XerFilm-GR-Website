export const TIME_ZONE = 'Asia/Tokyo';
export const dateInTokyo = (date = new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const shift = (day,n) => new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const security = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
export function json(value,status=200,headers={}) {return new Response(JSON.stringify(value),{status,headers:{...security,'Content-Type':'application/json; charset=utf-8',...headers}});}
async function isAdmin(request,env){
 if(typeof env.ADMIN_TOKEN!=='string'||env.ADMIN_TOKEN.length<24)return false;
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
 if(token.length>256)return false;
 const hash=value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 const [a,b]=await Promise.all([hash(token),hash(env.ADMIN_TOKEN)]);let diff=0;const x=new Uint8Array(a),y=new Uint8Array(b);for(let i=0;i<32;i++)diff|=x[i]^y[i];return diff===0;
}
export function validAsset(a){
 if(!a||typeof a!=='object'||typeof a.version!=='string'||typeof a.revision!=='string'||typeof a.sha256!=='string'||!/^[a-f0-9]{64}$/.test(a.sha256))return false;
 if(!/^[A-Za-z0-9][A-Za-z0-9._ -]{0,39}$/.test(a.version)||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(a.revision))return false;
 if(a.kind==='community')return a.model==='community'&&a.variant==='community';
 if(!['gr3','gr3x','gr4'].includes(a.model))return false;
 return (a.kind==='firmware'&&['standard','enhanced'].includes(a.variant))||(a.kind==='original'&&a.variant==='original');
}
export async function bodyJSON(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw Error('content-type');
 const reader=request.body?.getReader();if(!reader)throw Error('empty');let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048)throw Error('large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let at=0;for(const value of chunks){bytes.set(value,at);at+=value.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
function dayValid(day){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day;}
export async function handleRequest(request,env,adminHTML=''){
 const url=new URL(request.url), origin=request.headers.get('Origin'), allowed=env.ALLOWED_ORIGIN||'https://filmgr.xergnik.com';
 const cors=origin===allowed?{'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{};
 try{
  if(url.pathname==='/health')return json({ok:true,startDate:env.START_DATE,timeZone:TIME_ZONE});
  if(url.pathname==='/api/downloads'){
   if(origin!==allowed)return json({error:'origin'},403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...security,...cors,'Access-Control-Max-Age':'3600'}});
   if(request.method!=='POST')return json({error:'method'},405,cors);
   if(env.EVENT_LIMITER&&!(await env.EVENT_LIMITER.limit({key:'downloads'})).success)return json({error:'rate-limit'},429,cors);
   let event;try{event=await bodyJSON(request);}catch{return json({error:'invalid-body'},400,cors);}
   if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(event?.eventId)||!validAsset(event?.asset))return json({error:'invalid-event'},400,cors);
   const now=new Date(),day=dateInTokyo(now),a=event.asset;
   if(day<env.START_DATE)return json({error:'not-started'},409,cors);
   await env.DB.prepare('INSERT OR IGNORE INTO downloads(event_id,day,received_at,kind,model,variant,version,revision,sha256) VALUES(?,?,?,?,?,?,?,?,?)').bind(event.eventId,day,now.toISOString(),a.kind,a.model,a.variant,a.version,a.revision,a.sha256).run();
   return json({ok:true},200,cors);
  }
  if(url.pathname==='/api/stats'){
   if(request.method!=='GET')return json({error:'method'},405);
   if(env.EVENT_LIMITER&&!(await env.EVENT_LIMITER.limit({key:'admin:'+ (request.headers.get('CF-Connecting-IP')||'unknown')})).success)return json({error:'rate-limit'},429);
   if(!await isAdmin(request,env))return json({error:'unauthorized'},401);
   const today=dateInTokyo(),start=env.START_DATE||'2026-10-25';
   let from=url.searchParams.get('from')||shift(today,-29),to=url.searchParams.get('to')||today;
   if(!dayValid(from)||!dayValid(to)||from>to)return json({error:'date-range'},400);
   if(from<start)from=start;if(to>today)to=today;
   const where='day>=? AND day<=?';
   const queries=[
    env.DB.prepare("SELECT COUNT(*) total, COALESCE(SUM(day=?),0) today, COALESCE(SUM(day>=?),0) month FROM downloads WHERE kind='firmware' AND day>=? AND day<=?").bind(today,today.slice(0,7)+'-01',start,today),
    env.DB.prepare(`SELECT kind,COUNT(*) count FROM downloads WHERE ${where} GROUP BY kind`).bind(from,to),
    env.DB.prepare(`SELECT day,kind,COUNT(*) count FROM downloads WHERE ${where} GROUP BY day,kind ORDER BY day`).bind(from,to),
    env.DB.prepare(`SELECT kind,model,variant,version,revision,sha256,COUNT(*) count FROM downloads WHERE ${where} GROUP BY kind,model,variant,version,revision,sha256 ORDER BY count DESC,model,version LIMIT 500`).bind(from,to),
   ];
   const results=await env.DB.batch(queries);
   const measured=results[0].results[0], baseline=Number(env.HISTORICAL_ESTIMATE||0);
   const historicalEstimate=Number.isSafeInteger(baseline)&&baseline>=0?baseline:0;
   // This owner-supplied estimate is a separate baseline, never synthetic events.
   const summary={...measured,historicalEstimate,estimatedTotal:Number(measured.total)+historicalEstimate};
   return json({startDate:start,timeZone:TIME_ZONE,from,to,today,summary,kinds:results[1].results,daily:results[2].results,downloads:results[3].results,generatedAt:new Date().toISOString(),definition:'Verified file ready; browser save triggered. Not confirmed disk writes or camera installs.'});
  }
  if(request.method==='GET'&&(url.pathname==='/'||url.pathname==='/admin/'||url.pathname==='/admin')){
   const nonce=crypto.randomUUID();return new Response(adminHTML.replaceAll('__NONCE__',nonce),{headers:{...security,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`}});
  }
  return json({error:'not-found'},404);
 }catch{return json({error:'temporarily-unavailable'},503,cors);}
}
