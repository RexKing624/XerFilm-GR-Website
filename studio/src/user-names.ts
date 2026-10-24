// User-facing name limits; author packages keep their existing limits.
export const USER_FAMILY_NAME_MAX=15, USER_FILM_NAME_MAX=5;
export function validUserName(value:unknown, maximum:number):boolean {
 return typeof value==='string' && value.trim().length>0 && value.trim().length<=maximum && !/[\u0000-\u001f\ud800-\udfff]/.test(value);
}
export function validateUserNames(f:any){
 if(!validUserName(f.name,USER_FAMILY_NAME_MAX))throw Error('Family name: 1–15 characters.');
 for(const c of f.children||[])if(!validUserName(c.name,USER_FILM_NAME_MAX))throw Error('Film name: 1–5 characters.');
}
