/** Per-film timestamp policy. This flag does not convert colour data to grayscale. */
export const MONO_TAG=0x5842,COLOUR_TAG=0x5843;
export function builtinMonochrome(id:unknown):boolean{return typeof id==='string'&&['U008','U011','U012','U013','U027'].includes(id);}
export function filmMonochrome(c:any,f?:any):boolean{if(c.monochrome!==undefined&&typeof c.monochrome!=='boolean')throw Error('Invalid black-and-white film flag.');return c.monochrome??builtinMonochrome(f?.id);}
export function filmTag(c:any,f?:any):number{return filmMonochrome(c,f)?MONO_TAG:COLOUR_TAG;}
