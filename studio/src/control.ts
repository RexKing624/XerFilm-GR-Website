/** Portable author control files contain colour parameters and artwork, never signing keys. */
export const CONTROL_FORMAT='xerfilm-griv-author-control-1';
export type Adjustments={exposure:number;contrast:number;warmth:number};
export const neutralAdjustments=():Adjustments=>({exposure:0,contrast:0,warmth:0});
export function validModel(m:any){
 for(const [key,n,min,max] of [['matrix',9,-32768,32767],['gamma',768,0,16384],['multi',540,-65536,65536]] as const){
  if(!Array.isArray(m?.[key])||m[key].length!==n||m[key].some((v:any)=>!Number.isInteger(v)||v<min||v>max))throw Error(`Invalid ${key} colour data.`);
 }
 for(let c=0;c<3;c++)for(let i=1;i<256;i++)if(m.gamma[c*256+i]<m.gamma[c*256+i-1])throw Error('Tone curves must be monotonic.');return m;
}
export function effectiveModel(f:any){
 const m=validModel(f.model),a=f.adjustments||neutralAdjustments();
 for(const [k,min,max] of [['exposure',-1,1],['contrast',-30,30],['warmth',-30,30]] as const)if(!Number.isFinite(a[k])||a[k]<min||a[k]>max)throw Error(`Invalid ${k} adjustment.`);
 if(!a.exposure&&!a.contrast&&!a.warmth)return m;
 const gamma=m.gamma.map((v:number,i:number)=>{const c=Math.floor(i/256),gain=2**a.exposure*(c===0?2**(a.warmth/120):c===2?2**(-a.warmth/120):1);const x=v/16384;return Math.round(Math.max(0,Math.min(1,Math.pow(x,1+a.contrast/100)*gain))*16384);});return {...m,gamma};
}
export function modelIdentity(m:any){return JSON.stringify([m.matrix,m.gamma,m.multi]);}
export function changedBuiltin(entry:any,baseline:any){return modelIdentity(effectiveModel(entry.children[0]))!==modelIdentity(baseline.children[0].model);}
export function readControl(input:any,baseline:any){
 if(input?.format!==CONTROL_FORMAT||input.model!=='GR IV'||!Array.isArray(input.builtins)||input.builtins.length!==27||!Array.isArray(input.authors)||input.authors.length<1)throw Error('Use a GR IV author control file (27 built-in looks, expandable author families).');
 for(let i=0;i<27;i++){
  const x=input.builtins[i],ref=baseline.builtins[i];
  if(x.empty!==false||x.slot!==i||x.id!==ref.id||x.name!==ref.name||x.family!==ref.family||x.children?.length!==1||x.children[0].name!==ref.children[0].name||JSON.stringify(x.icon)!==JSON.stringify(ref.icon))throw Error('Built-in identities, names, icons and order are fixed.');
  validModel(x.children[0].model);effectiveModel(x.children[0]);if(!Number.isInteger(x.revision)||x.revision<1||x.revision>0xffffffff)throw Error('Invalid revision.');
 }
 for(let i=0;i<input.authors.length;i++){const x=input.authors[i];if(x.slot!==i||!Array.isArray(x.children)||x.children.length<1||typeof x.name!=='string')throw Error('Author identities must remain in their saved order.');for(const c of x.children)if(c.model){validModel(c.model);effectiveModel(c);}}
 return input;
}
export function masterControl(baseline:any,builtins:any[],authors:any[]){return {...baseline,builtins,authors,updatedAt:new Date().toISOString()};}
