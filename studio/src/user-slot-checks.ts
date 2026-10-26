import {filmMonochrome} from './film-kind';
import {validUserName,USER_FAMILY_NAME_MAX,USER_FILM_NAME_MAX} from './user-names';
import {validModel} from './control';
import {writeName} from './pack';
export function validSlotIcon(icon:any):boolean{return Array.isArray(icon)&&icon.length===6400&&icon.every((v:any)=>Number.isInteger(v)&&v>=0&&v<=255)&&icon.some((v:number,i:number)=>i%4===3&&v>0);}
export function userSlotFingerprint(f:any):string{return JSON.stringify({empty:f.empty,name:f.name,icon:f.icon,children:f.children?.map((c:any)=>({monochrome:c.monochrome??false,name:c.name,icon:c.icon,model:c.model,file:c.file,xmp:c.xmp,acceptApprox:c.acceptApprox,adjustments:c.adjustments}))});}
export function inspectUserSlot(f:any):{field:string;child?:number}|null{
 if(f.empty)return{field:'empty'};
 if(!validUserName(f.name,USER_FAMILY_NAME_MAX))return{field:'familyName'};
 try{writeName(new Uint8Array(64),0,f.name.trim());}catch{return{field:'familyName'};}
 if(!validSlotIcon(f.icon))return{field:'icon'};
 if(!Array.isArray(f.children)||f.children.length<1||f.children.length>3)return{field:'children'};
 for(let i=0;i<f.children.length;i++){const c=f.children[i];if(!validUserName(c.name,USER_FILM_NAME_MAX))return{field:'childName',child:i};try{writeName(new Uint8Array(64),0,c.name.trim());}catch{return{field:'childName',child:i};}if(!c.file?.trim()||!c.model)return{field:'xmp',child:i};try{filmMonochrome(c);validModel(c.model);}catch{return{field:'xmp',child:i};}if(c.model.unsupported?.length&&!c.acceptApprox)return{field:'approx',child:i};if(!validSlotIcon(c.icon||f.icon))return{field:'icon',child:i};}
 return null;
}
export function approvedUserSlots(families:any[],approved:Record<string,string>):any[]{return families.map(f=>!f.empty&&approved[f.id]===userSlotFingerprint(f)&&!inspectUserSlot(f)?JSON.parse(JSON.stringify(f)):{empty:true});}
