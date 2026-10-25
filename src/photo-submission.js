import {zipSync,strToU8} from 'fflate';
import {findPhotoLook,photoLookMetadata} from './photo-looks.js';
export const PHOTO_MAX_BYTES=50*1024*1024;
export function inspectPhotoSubmission(form,image,avatar,info){
 if(!form.name.trim()||!form.title.trim()||form.name.length>40||form.title.length>80)return 'needFields';
 if(!image||image.size>PHOTO_MAX_BYTES||image.size===0||!/^image\/jpeg$/.test(image.type))return 'needPhoto';
 if(avatar&&(avatar.size===0||avatar.size>5*1024*1024||!['image/jpeg','image/png'].includes(avatar.type)))return 'needAvatar';
 if(form.lookId&&!findPhotoLook(form.lookId))return 'needLook';
 if(!info||info.size===0||info.size>10*1024*1024||!['image/jpeg','image/png'].includes(info.type))return 'needInfo';
 if(!['','GR IV','GR III','GR IIIx'].includes(form.camera)||typeof form.hdf!=='boolean'||!['','3:2','645','67','XPan','1:1'].includes(form.frame)||!['','off','weak','medium','strong'].includes(form.grain)||!['','off','white','red'].includes(form.highlight))return 'needSettings';
 if(!form.consent)return 'needConsent';
 return '';
}
export async function createPhotoSubmission(form,image,avatar,info){
 const issue=inspectPhotoSubmission(form,image,avatar,info);if(issue)throw Error(issue);
 const metadata={format:'xerfilm-photography-submission-1',title:form.title.trim(),creator:form.name.trim(),description:form.description.trim(),camera:form.camera,hdf:form.hdf,...photoLookMetadata(form.lookId,form.film),frame:form.frame,grain:form.grain,highlight:form.highlight,permissionToPublish:true,infoScreenshot:'camera-info.'+(info.type==='image/png'?'png':'jpg')};
 const files={'XerFilm-photo/photo.jpg':new Uint8Array(await image.arrayBuffer()),'XerFilm-photo/submission.json':strToU8(JSON.stringify(metadata,null,2)),'XerFilm-photo/README.txt':strToU8('XerFilm photography submission\nEmail this ZIP to hello@xergnik.com for manual review.\nThe camera-info image is for private review of capture settings, not public display.\nThis ZIP is not a camera firmware or film pack. Nothing is published automatically.\nThe creator confirms ownership of the photograph and permits displaying the photograph, avatar and credit in the XerFilm community.\n')};
 files['XerFilm-photo/'+metadata.infoScreenshot]=new Uint8Array(await info.arrayBuffer());
 if(avatar)files['XerFilm-photo/avatar.'+(avatar.type==='image/png'?'png':'jpg')]=new Uint8Array(await avatar.arrayBuffer());
 return new Blob([zipSync(files,{level:0})],{type:'application/zip'});
}
