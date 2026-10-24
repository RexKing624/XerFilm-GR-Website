import {validateUserNames} from './user-names';
// SPDX-License-Identifier: GPL-2.0-only
// Identity is authenticated inside each record; filenames have no authority.
import nacl from 'tweetnacl';
import {strToU8} from 'fflate';
import {validModel} from './control';
import {writeName} from './pack';
export const USER_KEY=Uint8Array.from([46,117,64,223,72,151,5,126,11,184,221,82,231,101,48,153,24,186,69,214,34,145,167,53,209,91,36,132,248,16,75,203]);
export const CHILD_BYTES=10180,FAMILY_BYTES=6464;
export type BundleKind=0|1;
export async function record(f:any,slot:number,kind:0|1|2=0){
 if(!Number.isInteger(slot)||slot<0||slot>0xffffffff||!Number.isInteger(f.revision||1)||(f.revision||1)<1||(f.revision||1)>0xffffffff)throw Error('Invalid identity or revision.');
 const n=f.empty?0:f.children.length;
 if(kind===0&&!f.empty)validateUserNames(f);
 if(kind===0&&(slot>3||n<1||n>3))throw Error('User records require one fixed slot and 1–3 films.');
 if(kind===2&&(slot>26||n!==1))throw Error('Built-in updates require exactly one film.');
 if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid film count.');
 const size=FAMILY_BYTES+n*CHILD_BYTES;if(size>0x7fffffff)throw Error('Package is too large.');
 const b=new Uint8Array(128+size+64),v=new DataView(b.buffer);b.set(strToU8('XFRCD002'));v.setUint32(8,kind,true);v.setUint32(12,slot,true);v.setUint32(16,f.revision||1,true);v.setUint32(20,n,true);v.setUint32(24,size,true);v.setUint32(28,b.length,true);
 const icon=(a:any)=>{if(!Array.isArray(a)||a.length!==6400||a.some((x:any)=>!Number.isInteger(x)||x<0||x>255))throw Error('Invalid 40 × 40 RGBA icon.');return a;};
 if(n){if(!f.name?.trim()||!f.icon)throw Error('Family name and cover required.');writeName(b,128,f.name.trim());b.set(icon(f.icon),192);}
 for(let j=0;j<n;j++){
  const c=f.children[j];if(!c.name?.trim()||!c.model)throw Error('Every film needs a name and converted colour data.');
  if(c.model.unsupported?.length&&!c.acceptApprox)throw Error('Review unsupported XMP settings first.');
  writeName(b,128+FAMILY_BYTES+j*CHILD_BYTES,c.name.trim());const at=128+FAMILY_BYTES+j*CHILD_BYTES+64;
  b.set(icon(c.icon||f.icon),at);validModel(c.model);c.model.matrix.forEach((x:number,k:number)=>v.setInt16(at+6400+2*k,x,true));c.model.gamma.forEach((x:number,k:number)=>v.setUint16(at+6420+2*k,x,true));c.model.multi.forEach((x:number,k:number)=>v.setInt32(at+7956+4*k,x,true));
 }
 b.set(new Uint8Array(await crypto.subtle.digest('SHA-512',b.subarray(128,128+size))).subarray(0,32),64);
 if(kind===0){const nonce=crypto.getRandomValues(new Uint8Array(24));b.set(nonce,32);const out=new Uint8Array(size);(nacl as any).lowlevel.crypto_stream_xor(out,0,b.subarray(128,128+size),0,size,nonce,USER_KEY);b.set(out,128);}
 return b;
}
export async function bundle(records:Uint8Array[],kind:BundleKind){
 const total=128+records.reduce((n,b)=>n+b.length,0);if(total>0x7fffffff)throw Error('Package is too large.');
 const b=new Uint8Array(total),v=new DataView(b.buffer);b.set(strToU8('XFBDL002'));v.setUint16(8,2,true);v.setUint16(10,4,true);v.setUint32(12,kind,true);v.setUint32(16,records.length,true);v.setUint32(20,total,true);let at=128;
 for(const r of records){const d=new DataView(r.buffer,r.byteOffset,r.byteLength);if((kind===0&&d.getUint32(8,true)!==0)||(kind===1&&![1,2].includes(d.getUint32(8,true))))throw Error('Mixed package namespaces are forbidden.');b.set(r,at);at+=r.length;}
 b.set(new Uint8Array(await crypto.subtle.digest('SHA-512',b.subarray(128))).subarray(0,32),32);return b;
}
export async function userBundle(families:any[]){if(families.length!==4)throw Error('Four fixed user slots required.');const records=[];for(let i=0;i<4;i++)if(!families[i].empty)records.push(await record(families[i],i));return bundle(records,0);}
