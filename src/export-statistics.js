import configuration from './download-statistics-config.json';
import {createDownloadStatistics} from './download-statistics-client';
let client;
export function initializeExportStatistics(){
 try {
  let storage;try{storage=globalThis.localStorage;}catch{}
  client??=createDownloadStatistics({endpoint:configuration.endpoint.replace(/\/api\/downloads$/, '/api/exports'),queueKey:'xerfilm-pending-exports-v1',location:globalThis.location,storage,send:(...args)=>fetch(...args),uuid:()=>crypto.randomUUID()});
  void client.flush();
  globalThis.addEventListener?.('online',()=>{void client.flush();});
 }catch{}
}
export function trackStudioExport(metadata){
 try {
  const {version,files,films}=metadata??{};
  if(typeof version!=='string'||!/^V[0-9]+\.[0-9]+$/.test(version)||!Number.isInteger(files)||files<1||files>4||!Number.isInteger(films)||films<files||films>files*3)return;
  client?.record({version,files,films});
 }catch{}
}
