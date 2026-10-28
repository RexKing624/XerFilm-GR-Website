// Shared by the authenticated service and the offline publisher.
export const releaseModels = {
 gr4:{label:'GR IV / HDF',files:['release.json','enhanced-release.json'],filename:'fwdc248b.bin'},
 gr3:{label:'GR III / HDF',files:['gr3-release.json','gr3-enhanced-release.json'],filename:'fwdc239b.bin'},
 gr3x:{label:'GR IIIx / HDF',files:['gr3x-release.json','gr3x-enhanced-release.json'],filename:'fwdc243b.bin'},
};
export const defaultReleaseNotes={
 zh:['改善胶片色彩表现。','加快高光模拟处理与照片回放。','修复补充胶片在回放 INFO 中的图标显示。'],
 en:['Improve film colour rendering.','Speed up highlight simulation processing and photo playback.','Fix add-on film icons in playback INFO.'],
 ja:['フィルムの色表現を改善。','ハイライト処理と写真の再生を高速化。','追加フィルムの再生 INFO アイコンを修正。'],
};
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function validNotes(notes){return notes&&Object.keys(notes).sort().join(',')==='en,ja,zh'&&Object.values(notes).every(lines=>Array.isArray(lines)&&lines.length>=1&&lines.length<=8&&lines.every(s=>typeof s==='string'&&s.trim()===s&&s.length>=1&&s.length<=160&&!/[\x00-\x1f<>]/.test(s)));}
export function validVersion(v){return typeof v==='string'&&/^V[1-9]\d?\.\d{1,2}(?:\.\d{1,2})?$/.test(v);}
export function compareVersions(a,b){const x=a.replace(/^V/,'').split('.').map(Number),y=b.replace(/^V/,'').split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d;}return 0;}
export async function digest(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function validateCandidate(model,set,stable){
 const p=releaseModels[model];if(!p||!set||!Array.isArray(set.firmware)||set.firmware.length!==2||!Array.isArray(stable)||stable.length!==2)throw Error('invalid-candidate');
 for(let i=0;i<2;i++){const r=set.firmware[i];if(r.filename!==p.filename||r.internalVersion!==set.revision+(i?'-H':'')||r.testRelease!==true||r.hardwareTested!==false||r.downloadVariant!==(i?'enhanced':'standard')||!/^[a-f0-9]{64}$/.test(r.sha256)||!Number.isSafeInteger(r.size)||r.size<1000000||r.size>100000000||r.encryption?.algorithm!=='AES-GCM'||r.encryption?.kdf!=='PBKDF2'||r.encryption?.iterations<210000||r.encryption.iterations>1000000||!r.parts?.length||r.parts.some(p=>!/^test-[a-zA-Z0-9._-]+$/.test(p.file)||!Number.isSafeInteger(p.size)||p.size<1||p.size>20000000||!/^[a-f0-9]{64}$/.test(p.sha256)))throw Error('invalid-candidate');
 if(stable[i].filename!==p.filename||stable[i].sha256===r.sha256)throw Error('already-released');}
}
export async function candidateSnapshot(model,set,stable){validateCandidate(model,set,stable);return digest({model,set,stable});}
