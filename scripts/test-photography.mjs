import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unzipSync,strFromU8} from 'fflate';
import {inspectPhotoSubmission,createPhotoSubmission} from '../src/photo-submission.js';
import {photographyCopy} from '../src/photography-copy.js';
import {filterPhotographs} from '../src/photo-filters.js';
import {builtinPhotoLooks,photoLooks,findPhotoLook,photoLookMetadata,findPhotoFilter,filmPhotoFilterId,photoGalleryURL} from '../src/photo-looks.js';
assert.equal(builtinPhotoLooks.length,27);
assert.equal(new Set(builtinPhotoLooks.map(x=>x.id)).size,27);
assert.equal(photoLooks[0].name,'PROVIA');
for(const name of ['T-MAX 100','T-MAX 400','T-MAX 3200','PORTRA 160 NC','PORTRA 400 VC','PORTRA 800','VISION3 50D','VISION3 250D','VISION3 500T'])assert.ok(builtinPhotoLooks.some(x=>x.name===name),name);
assert.equal(findPhotoLook('coast-study').kind,'community');
assert.deepEqual(photoLookMetadata('builtin-745','stale free text'),{lookId:'builtin-745',lookType:'builtin',builtinIcon:745,film:'PORTRA 400'});
const infoBytes=await readFile(new URL('../public/community/avatars/xer-gnik-pixel.png',import.meta.url));
const info=new File([infoBytes],'camera-info.png',{type:'image/png'});
const form={name:'Sample photographer',title:'A shore',description:'A quiet afternoon',camera:'GR IV',hdf:true,film:'Warm',lookId:'coast-study',frame:'3:2',grain:'weak',highlight:'off',consent:true};
const bytes=await readFile(new URL('../public/community/photos/coast-effect.jpg',import.meta.url));
const photo=new File([bytes],'original-photo.jpg',{type:'image/jpeg'});
assert.equal(inspectPhotoSubmission(form,photo,null,info),'');
assert.equal(inspectPhotoSubmission(form,{type:'image/jpeg',size:50*1024*1024+1},null,info),'needPhoto');
assert.equal(inspectPhotoSubmission(form,photo,{type:'image/png',size:5*1024*1024+1},info),'needAvatar');
for(const [change,image,issue] of [[{name:''},photo,'needFields'],[{title:''},photo,'needFields'],[{consent:false},photo,'needConsent'],[{},null,'needPhoto'],[{},new File(['bad'],'bad.txt',{type:'text/plain'}),'needPhoto']]){
 assert.equal(inspectPhotoSubmission({...form,...change},image,null,info),issue);
 await assert.rejects(createPhotoSubmission({...form,...change},image,null,info),new RegExp(issue));
}
assert.equal(inspectPhotoSubmission(form,{type:'image/jpeg',size:49*1024*1024},null,info),'','Images below 50 MB must be accepted');
const examples=[
 {id:'400',lookId:'builtin-745',title:{zh:'海边的人',en:'Coast at dusk'},creator:{name:'Alice'},camera:'GR IV',hdf:true},
 {id:'160',lookId:'builtin-742',title:'Street',creator:{name:'Bob'},camera:'GR III / HDF'},
 {id:'provia',lookId:'builtin-721',title:'Mountain',creator:{name:'Alice'},camera:'GR IIIx'},
 {id:'community',lookId:'coast-study',title:'Warm coast',creator:{name:'Carol'},camera:'GR IV'},
];
assert.equal(filmPhotoFilterId({icon:736,variants:[{}]}),'family-736');
assert.equal(filmPhotoFilterId({icon:721,variants:[]}),'builtin-721');
assert.deepEqual(findPhotoFilter('family-736').lookIds,['builtin-742','builtin-743','builtin-744','builtin-745','builtin-746','builtin-747','builtin-748']);
assert.equal(photoGalleryURL('family-736'),'/community/?tab=photos&fromLook=family-736');
assert.deepEqual(filterPhotographs(examples,{lookId:'family-736'}).map(x=>x.id),['400','160']);
assert.deepEqual(filterPhotographs(examples,{lookId:'builtin-745'}).map(x=>x.id),['400']);
assert.deepEqual(filterPhotographs(examples,{query:'ＰＯＲＴＲＡ 400 Alice'}).map(x=>x.id),['400']);
assert.deepEqual(filterPhotographs(examples,{camera:'GR III'}).map(x=>x.id),['160']);
assert.deepEqual(filterPhotographs(examples,{lookId:'family-736',query:'Street',camera:'GR III'}).map(x=>x.id),['160']);
assert.deepEqual(filterPhotographs(examples,{lookId:'builtin-999'}),[]);
assert.deepEqual(filterPhotographs(examples,{query:'unknown scene'}),[]);
const avatar=new File([await readFile(new URL('../public/community/avatars/xer-gnik-pixel.png',import.meta.url))],'portrait.png',{type:'image/png'});
const blob=await createPhotoSubmission(form,photo,avatar,info),files=unzipSync(new Uint8Array(await blob.arrayBuffer()));
assert.deepEqual(Object.keys(files).sort(),['XerFilm-photo/README.txt','XerFilm-photo/avatar.png','XerFilm-photo/camera-info.png','XerFilm-photo/photo.jpg','XerFilm-photo/submission.json']);
assert.deepEqual(Buffer.from(files['XerFilm-photo/photo.jpg']),bytes,'Original JPG bytes must be preserved');
for(const id of ['builtin-721','builtin-745','builtin-751']){
 const packed=unzipSync(new Uint8Array(await(await createPhotoSubmission({...form,lookId:id,film:'stale'},photo,null,info)).arrayBuffer()));
 const saved=JSON.parse(strFromU8(packed['XerFilm-photo/submission.json']));
 assert.equal(saved.lookId,id);assert.equal(saved.lookType,'builtin');assert.equal(saved.film,findPhotoLook(id).name);assert.equal(saved.builtinIcon,findPhotoLook(id).icon);
}
assert.equal(inspectPhotoSubmission({...form,lookId:'builtin-999'},photo,null,info),'needLook');
for(const look of builtinPhotoLooks)await readFile(new URL('../public/films/'+look.icon+'.png',import.meta.url));
const metadata=JSON.parse(strFromU8(files['XerFilm-photo/submission.json']));
assert.equal(metadata.camera,'GR IV');assert.equal(metadata.hdf,true);assert.equal(metadata.infoScreenshot,'camera-info.png');
assert.deepEqual(Buffer.from(files['XerFilm-photo/camera-info.png']),infoBytes,'INFO screenshot must be included unchanged');
assert.equal(inspectPhotoSubmission(form,photo,null),'needInfo');
assert.equal(inspectPhotoSubmission(form,photo,null,{type:'image/png',size:10*1024*1024+1}),'needInfo');
for(const change of [{frame:['645','67']},{grain:'weak,strong'},{highlight:'unknown'},{hdf:'true'},{camera:'GR IV / HDF'}])assert.equal(inspectPhotoSubmission({...form,...change},photo,null,info),'needSettings');
assert.equal(inspectPhotoSubmission({...form,camera:'',hdf:false,frame:'',grain:'',highlight:''},photo,null,info),'');
const jpgInfo=unzipSync(new Uint8Array(await(await createPhotoSubmission(form,photo,null,photo)).arrayBuffer()));assert.ok(jpgInfo['XerFilm-photo/camera-info.jpg']);
assert.equal(metadata.title,form.title);assert.equal(metadata.lookId,'coast-study');assert.equal(metadata.permissionToPublish,true);
assert.equal(Object.keys(files).some(x=>/raw|xmp|xfc/i.test(x)),false,'Photography submissions require no RAW/XMP/effect pack');
const photos=JSON.parse(await readFile(new URL('../src/photography-data.json',import.meta.url))),looks=JSON.parse(await readFile(new URL('../src/community-data.json',import.meta.url)));
for(const p of photos){assert.ok(p.demo);await readFile(new URL('../public/'+p.image,import.meta.url));if(p.lookId)assert.ok(looks.some(x=>x.id===p.lookId));}
for(const locale of ['zh','en','ja'])for(const key of Object.keys(photographyCopy.zh))assert.ok(photographyCopy[locale][key],locale+' missing '+key);
console.log('Photo submission validation, required INFO screenshot, independent HDF, single-choice settings, original image ZIP and three languages passed.');
