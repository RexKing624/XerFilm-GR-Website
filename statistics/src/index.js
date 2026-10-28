import adminHTML from './admin.html';
import {handleRequest} from './core.js';
import {handleEngagement} from './engagement.js';
import {handleReleases} from './releases.js';
import {handleAdminAccess} from './admin-access.js';
export default {fetch(request,env){
 const path=new URL(request.url).pathname;
 return handleAdminAccess(request,()=>path.startsWith('/api/releases') ? handleReleases(request,env) : ['/api/public-stats','/api/likes','/api/likes/state'].includes(path)?handleEngagement(request,env):handleRequest(request,env,adminHTML));
}};
