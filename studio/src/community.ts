// Community ABI3. Filename selects a user destination, never author authority.
import {record} from './bundle';
import {strToU8} from 'fflate';
import {USER_README} from './user-readme';
import {approvedUserSlots} from './user-slot-checks';
export async function identityBytes(id:string){
 // Stable even for legacy human-readable builtin identifiers; 128-bit UUID.
 if(!id?.trim())throw Error('A permanent identity is required.');
 return new Uint8Array(await crypto.subtle.digest('SHA-256',strToU8('XerFilmGR/id/'+id))).slice(0,16);
}
export async function communityRecord(f:any,slot:number,kind:0|1|2=0){
 const b=await record(f,slot,kind),v=new DataView(b.buffer);
 b.set(strToU8('XFRCD003'));v.setUint32(56,kind===2?2:kind===1?1:0,true);
 b.set(await identityBytes(kind===2?'builtin/'+slot:f.id),96);return b;
}
export async function communityBundle(records:Uint8Array[],operation:0|1|2){
 if(!records.length||(operation===0&&records.length!==1))throw Error('One family per user file; author files cannot be empty.');
 const total=128+records.reduce((n,b)=>n+b.length,0);if(total>16*1024*1024)throw Error('Camera package capacity exceeded.');
 const b=new Uint8Array(total),v=new DataView(b.buffer);b.set(strToU8('XFBDL003'));v.setUint16(8,3,true);v.setUint16(10,4,true);v.setUint32(12,operation,true);v.setUint32(16,records.length,true);v.setUint32(20,total,true);
 let at=128;for(const r of records){const d=new DataView(r.buffer,r.byteOffset,r.byteLength);if(String.fromCharCode(...r.slice(0,8))!=='XFRCD003'||d.getUint32(56,true)!==operation||(operation===0?d.getUint32(8,true)!==0:![1,2].includes(d.getUint32(8,true))))throw Error('Package namespace/operation mismatch.');b.set(r,at);at+=r.length;}
 b.set(new Uint8Array(await crypto.subtle.digest('SHA-512',b.subarray(128))).subarray(0,32),32);return b;
}
export function exportSelection(families:any[],approved:Record<string,string>,selected:boolean[]){
 const checked=approvedUserSlots(families,approved),included:number[]=[],skipped:number[]=[];
 const slots=checked.map((f,i)=>{if(!selected[i])return {empty:true};if(f.empty){skipped.push(i+1);return f;}included.push(i+1);return f;});
 return {slots,included,skipped};
}
export async function communityUserArchive(families:any[]){
 if(families.length!==4)throw Error('Four fixed user slots required.');const files:Record<string,Uint8Array>={};
 for(let i=0;i<4;i++)if(!families[i].empty)files[`XERFILM/${i+1}-USER-XerFilmGR.XFL`]=await communityBundle([await communityRecord(families[i],i)],0);
 if(!Object.keys(files).length)throw Error('No checked slots selected.');
 files['READ-ME.txt']=strToU8(USER_README);return files;
}

/** ABI4 author family upsert or builtin update, including signed authorization. */
export async function licensedAuthorBundle(records:Uint8Array[],operation:1|2){
 if(!records.length)throw Error('No author records selected.');
 const total=128+records.reduce((n,b)=>n+b.length,0);if(total>16*1024*1024)throw Error('Camera package capacity exceeded.');
 const b=new Uint8Array(total),v=new DataView(b.buffer);b.set(strToU8('XFBDL004'));v.setUint16(8,4,true);v.setUint16(10,4,true);v.setUint32(12,operation,true);v.setUint32(16,records.length,true);v.setUint32(20,total,true);let at=128;
 for(const r of records){const d=new DataView(r.buffer,r.byteOffset,r.byteLength);if(String.fromCharCode(...r.slice(0,8))!=='XFRCD004'||d.getUint32(56,true)!==(operation===1?3:2))throw Error('Invalid signed author operation.');b.set(r,at);at+=r.length;}
 b.set(new Uint8Array(await crypto.subtle.digest('SHA-512',b.subarray(128))).subarray(0,32),32);return b;
}
