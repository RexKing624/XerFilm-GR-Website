import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const directory=new URL('../public/admin/',import.meta.url);
const endpoint='https://xerfilm-download-statistics.xerfilm-download-statistics.workers.dev/api/stats';
let html=readFileSync(new URL('../statistics/src/admin.html',import.meta.url),'utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
let js=html.match(/<script nonce="__NONCE__">([\s\S]*?)<\/script>/)?.[1];
if(!css || !js || !js.includes("fetch('/api/stats?'+range()")) throw Error('Unexpected admin template');
js=js.replace("fetch('/api/stats?'+range()",`fetch('${endpoint}?'+range()`);
const fingerprint=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
const stylesheet=`admin-${fingerprint(css)}.css`,script=`admin-${fingerprint(js)}.js`;
const policy="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src https://xerfilm-download-statistics.xerfilm-download-statistics.workers.dev; img-src 'self' data:; form-action 'self'; base-uri 'none'; object-src 'none'";
html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer">`)
 .replace(/<style>[\s\S]*?<\/style>/,`<link rel="stylesheet" href="/admin/${stylesheet}">`)
 .replace(/<script nonce="__NONCE__">[\s\S]*?<\/script>/,`<script src="/admin/${script}" defer></script>`);
mkdirSync(directory,{recursive:true});
writeFileSync(new URL(stylesheet,directory),css);
writeFileSync(new URL(script,directory),js);
writeFileSync(new URL('index.html',directory),html);
console.log('Exported /admin login page; no credential or private data included.');
