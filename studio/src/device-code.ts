// The UI owns separators; authorization always receives four canonical hex groups.
export function deviceTail(groups: string[]): string {
 if(groups.length!==4||groups.some(group=>! /^[0-9A-F]{6}$/i.test(group)))return '';
 const compact=groups.join('').toUpperCase();
 return /^0+$/.test(compact)?'':groups.map(group=>group.toUpperCase()).join('-');
}

export function pastedDeviceDigits(value: string): string|null {
 const compact=value.trim().replace(/[\s\-\u2010-\u2015\u2212\ufe63\uff0d]/g,'').toUpperCase();
 return /^[0-9A-F]{1,24}$/.test(compact)?compact:null;
}
