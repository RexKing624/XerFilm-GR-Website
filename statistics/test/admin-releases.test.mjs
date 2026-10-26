import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../src/admin.html',import.meta.url),'utf8');
const start=html.indexOf('function downloadVersion(');
const end=html.indexOf('function applyLanguage()',start);
const {downloadVersion,downloadRevision,groupedDownloads}=new Function(html.slice(start,end)+';return {downloadVersion,downloadRevision,groupedDownloads}')();
const row=(revision,count=1,extra={})=>({kind:'firmware',model:'gr4',variant:'standard',version:'V3.0',revision,count,...extra});

test('known missing release revisions join recorded builds without merging different builds or variants',()=>{
 const rows=[row(null,66,{source:'manual'}),row('v49',16,{source:'automatic'}),row('v48',3),row(null,9,{variant:'enhanced'}),row('v49-H',2,{variant:'enhanced'})];
 const result=groupedDownloads(rows);
 assert.deepEqual(result.map(x=>[x.revision,x.count]),[['v49',82],['v49-H',11],['v48',3]]);
 assert.equal(result.reduce((sum,x)=>sum+x.count,0),rows.reduce((sum,x)=>sum+x.count,0));
 assert.equal(rows[0].revision,null);
 assert.equal(rows[0].count,66);
});

test('V1 through V3 release mappings match model and variant; unknown and community records stay untouched',()=>{
 for(const [version,model,build] of [['V1','gr4','v22'],['V1.0','gr3','R12'],['V1.0','gr3x','R12'],['V1.1','gr4','v23'],['V2.0','gr4','v32'],['V2.0','gr3','R20'],['V2.0','gr3x','R20'],['V3.0','gr4','v49'],['V3.0','gr3','R32'],['V3.0','gr3x','R31']]){
  assert.equal(downloadRevision(row(null,1,{version,model})),build);
  assert.equal(downloadRevision(row(null,1,{version,model,variant:'enhanced'})),build+'-H');
 }
 assert.equal(downloadRevision(row('R29',1,{model:'gr3x'})),'R29');
 assert.equal(downloadRevision(row(null,1,{version:'V1.1',model:'gr3'})),'R13 / R14');
 assert.equal(downloadRevision(row(null,1,{version:'V1.1',model:'gr3x',variant:'enhanced'})),'R14-H');
 assert.equal(downloadRevision(row('R13',1,{version:'V1.1',model:'gr3'})),'R13');
 assert.equal(downloadVersion(row(null,1,{version:'V1'})),'V1.0');
 assert.equal(downloadVersion(row(null,1,{version:'V1',kind:'community'})),'V1');
 const merged=groupedDownloads([row(null,4,{version:'V1'}),row('v22',3,{version:'V1.0'})]);
 assert.equal(merged.length,1);assert.equal(merged[0].count,7);assert.equal(merged[0].version,'V1.0');
 assert.equal(downloadRevision(row(null,1,{version:'V4.0'})),'');
 assert.equal(downloadRevision(row(null,1,{kind:'original'})),'');
 assert.equal(downloadRevision(row('coast-study',1,{kind:'community',model:'community',variant:'community',version:'1'})),'coast-study');
});
