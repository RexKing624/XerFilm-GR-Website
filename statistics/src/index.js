import adminHTML from './admin.html';
import {handleRequest} from './core.js';
export default {fetch(request,env){return handleRequest(request,env,adminHTML);}};
