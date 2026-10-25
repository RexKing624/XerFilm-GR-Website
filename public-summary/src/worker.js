// Public aggregate only. All queries are read-only; no event or admin data is returned.
export async function handleSummary(request,env,now=new Date()){
 const incomingOrigin=request.headers.get('Origin');
 const origin=/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(incomingOrigin||'')?incomingOrigin:env.ALLOWED_ORIGIN||'https://filmgr.xergnik.com';
 const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Cache-Control':status===200?'public, max-age=60':'no-store'}});
 if(new URL(request.url).pathname!=='/api/firmware-total')return respond({error:'not-found'},404);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='GET')return respond({error:'method'},405);
 try{
  const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const {results}=await env.DB.prepare("SELECT COALESCE(SUM(count),0) total FROM download_totals WHERE kind='firmware' AND day<=?").bind(asOf).all();
  const total=Number(results[0]?.total);
  if(!Number.isSafeInteger(total)||total<0)throw Error('invalid-total');
  return respond({total,asOf});
 }catch{return respond({error:'temporarily-unavailable'},503);}
}
export default {fetch:(request,env)=>handleSummary(request,env)};
