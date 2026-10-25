import families from './films.json' with {type:'json'};
import community from './community-data.json' with {type:'json'};

// Share the firmware site's catalog, including each actual child film.
export const builtinPhotoLooks=families.flatMap(family=>(family.variants.length?family.variants:[family]).map(film=>({
 id:`builtin-${film.icon}`,kind:'builtin',name:film===family?family.name:`${family.name} ${film.name}`,
 familyName:family.name,brand:family.brand,icon:film.icon,
})));
export const communityPhotoLooks=community.map(look=>({...look,kind:'community'}));
export const photoLooks=[...builtinPhotoLooks,...communityPhotoLooks];
export const findPhotoLook=id=>photoLooks.find(look=>look.id===id);
export function photoLookMetadata(id,freeName=''){
 const look=findPhotoLook(id);
 return {lookId:look?.id||null,lookType:look?.kind||null,builtinIcon:look?.kind==='builtin'?look.icon:null,film:look?.name||freeName.trim()};
}

// Family links include every child; individual-film links remain exact.
export const builtinPhotoFamilies=families.filter(family=>family.variants.length).map(family=>({
 id:`family-${family.icon}`,kind:'family',name:family.name,icon:family.icon,
 lookIds:family.variants.map(film=>`builtin-${film.icon}`),
}));
export const builtinPhotoFilters=families.flatMap(family=>{
 const group=builtinPhotoFamilies.find(item=>item.icon===family.icon);
 return group?[group,...family.variants.map(film=>findPhotoLook(`builtin-${film.icon}`))]:[findPhotoLook(`builtin-${family.icon}`)];
});
export const findPhotoFilter=id=>builtinPhotoFamilies.find(item=>item.id===id)||findPhotoLook(id);
export const filmPhotoFilterId=film=>`${film.variants?.length?'family':'builtin'}-${film.icon}`;
export const photoGalleryURL=id=>`/community/?tab=photos${id?'&fromLook='+encodeURIComponent(id):''}`;
