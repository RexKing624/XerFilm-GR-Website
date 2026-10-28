// The public login page is also served by the official GitHub Pages site.
// Authentication and all private queries remain in the existing Worker.
const adminOrigin = 'https://filmgr.xergnik.com';
export async function handleAdminAccess(request, next) {
  const origin = request.headers.get('Origin');
  const publishing=new URL(request.url).pathname.startsWith('/api/releases');
  if ((!publishing && new URL(request.url).pathname !== '/api/stats') || !origin) return next();
  if (origin !== adminOrigin) return new Response(null, { status:403, headers:{ 'Cache-Control':'no-store' } });
  const cors = {
    'Access-Control-Allow-Origin':adminOrigin,
    'Access-Control-Allow-Methods':publishing?'GET, POST, OPTIONS':'GET, OPTIONS',
    'Access-Control-Allow-Headers':publishing?'Authorization, Content-Type':'Authorization',
    'Cache-Control':'no-store',
    'Vary':'Origin',
  };
  if (request.method === 'OPTIONS') {
    const method = request.headers.get('Access-Control-Request-Method');
    const headers = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!(publishing?['GET','POST']:['GET']).includes(method) || headers.some(header => !['authorization',...(publishing?['content-type']:[])].includes(header))) return new Response(null, {status:403,headers:cors});
    return new Response(null, {status:204,headers:cors});
  }
  const response = await next();
  const headers = new Headers(response.headers);
  for (const [name,value] of Object.entries(cors)) headers.set(name,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
