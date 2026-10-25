import {findPhotoFilter,findPhotoLook} from './photo-looks.js';
const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase().trim();
const words=value=>typeof value==='object'&&value?Object.values(value).flatMap(words):[String(value??'')];
export function filterPhotographs(photos,{lookId='',query='',camera=''}={}){
 const filter=findPhotoFilter(lookId),terms=normalize(query).split(/\s+/).filter(Boolean);
 return photos.filter(photo=>{
  if(lookId&&(!filter||(filter.kind==='family'?!filter.lookIds.includes(photo.lookId):photo.lookId!==lookId)))return false;
  const model=(photo.camera||'').replace(/\s*\/\s*HDF$/i,'').trim();
  if(camera&&model!==camera)return false;
  const look=findPhotoLook(photo.lookId);
  const text=normalize([...words(photo.title),...words(photo.description),photo.creator?.name,photo.film,look?.name,look?.familyName,look?.brand,photo.camera,photo.hdf?'HDF':''].join(' '));
  return terms.every(term=>text.includes(term));
 });
}
