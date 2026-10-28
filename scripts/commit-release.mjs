import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const request=JSON.parse(process.env.RELEASE_REQUEST),files=JSON.parse(await readFile('.release-changes.json','utf8'));
if(files.length===0){console.log('Existing verified release commit reused; retrying deployment.');process.exit(0);}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
if(git('rev-parse','HEAD')!==request.head)throw Error('Checkout changed');
if(git('ls-remote','origin','refs/heads/main').split(/\s/)[0]!==request.head)throw Error('Website changed during validation; refresh and try again');
if(!files.length||files.some(f=>!/^src\/(?:.*release.*\.json|i18n\.js|site-version\.js)$|^public\/(?:downloads\/[A-Za-z0-9._-]+|release-status\/[a-f0-9-]+\.json)$/.test(f)))throw Error('Unexpected publication file');
git('config','user.name','XerFilm Release');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
git('add','--',...files);git('commit','-m',`Publish ${request.model} ${request.version} (${request.revision})`);
// Ordinary fast-forward push is the final compare-and-swap. Never force or retry a stale release.
git('push','origin','HEAD:main');console.log('Verified release committed; deploying the matching build.');
