
const $=id=>document.getElementById(id);
const translations={
 "zh": {
  "pageTitle": "XerFilm · 使用统计",
  "home": "XerFilm GR 官网",
  "private": "仅供管理",
  "back": "返回官网 ↗",
  "language": "语言",
  "theme": "切换明暗",
  "heading": "每一次使用，",
  "headingAccent": "留个数。",
  "intro": "下载、创作与分享，在这里慢慢积累。",
  "loginTitle": "使用统计",
  "loginNote": "输入管理口令查看。口令仅在当前页面内存中保留。",
  "password": "管理口令",
  "loginButton": "查看统计 ↗",
  "refresh": "刷新 ↻",
  "logout": "退出",
  "total": "累计固件下载",
  "today": "今日固件下载",
  "month": "本月固件下载",
  "community": "所选期间 · 社群效果下载",
  "studioTotal": "累计工具成功导出",
  "studioFiles": "累计生成胶片包",
  "days7": "近 7 天",
  "days30": "近 30 天",
  "days90": "近 90 天",
  "all": "全部",
  "csv": "导出 CSV ↓",
  "chartTitle": "固件下载趋势",
  "period": "所选期间",
  "peak": "单日最高",
  "chartAria": "每天固件下载量，点选或聚焦柱形查看当天数字",
  "versionsTitle": "机型与版本",
  "typeModel": "类型 / 机型",
  "version": "版本",
  "variant": "普通 / 增强",
  "revision": "包编号",
  "downloads": "下载次数",
  "empty": "这段时间还没有记录。",
  "studioTitle": "工具导出",
  "studioCSV": "导出工具统计 CSV ↓",
  "dateTokyo": "日期（日本时间）",
  "exportCount": "成功导出次数",
  "packageCount": "胶片包数量",
  "filmCount": "子胶片数量",
  "studioEmpty": "这段时间还没有导出记录。",
  "studioNote": "一次成功生成并触发保存记为一次导出；一个用户槽位对应一个胶片包。重复导出会再次计数，不代表不同作品或人数。",
  "footer": "统计按日本时间划分日期，下载量按机型和版本汇总。工具统计分别累计导出次数、胶片包数量与子胶片数量。数据不代表不同人数或相机安装数；不记录名称、XMP、图片、设备码、IP 或访客身份。",
  "exclude": "排除这个浏览器的测试统计 ↗",
  "include": "恢复这个浏览器的统计 ↗",
  "started": "记录始于 {date} · {zone}",
  "updated": "更新于 {time}",
  "todayMonth": "今日 {today} 次 · 本月 {month} 次",
  "filmsIncluded": "包含 {count} 款子胶片",
  "studioPeriod": "所选期间：{exports} 次导出 · {files} 个胶片包 · {films} 款子胶片",
  "chartHint": "按日汇总 · 日本时间",
  "chartEmpty": "这段时间暂无下载记录",
  "downloadUnit": "次下载",
  "downloadAria": "{date} · {count} 次下载",
  "authError": "管理口令不正确。",
  "readError": "暂时无法读取，请稍后重试。",
  "communityModel": "社群效果",
  "standard": "普通版",
  "enhanced": "增强版",
  "original": "原厂备份",
  "communityVariant": "效果包",
  "originalPrefix": "原厂 · ",
  "kind": "类型",
  "model": "机型",
  "csvVariant": "变体",
  "source": "记录来源",
  "manual": "历史补录",
  "automatic": "自动记录",
  "firmwareKind": "固件",
  "originalKind": "原厂备份",
  "communityKind": "社群效果",
  "authorDownloads": "所选期间 · 作者色彩补充包下载"
 },
 "en": {
  "pageTitle": "XerFilm · Usage statistics",
  "home": "XerFilm GR website",
  "private": "PRIVATE ACCESS",
  "back": "Back to website ↗",
  "language": "Language",
  "theme": "Switch appearance",
  "heading": "Every use,",
  "headingAccent": "a little trace.",
  "intro": "Downloads, creations and shared colours, growing over time.",
  "loginTitle": "Usage statistics",
  "loginNote": "Enter your admin passphrase. It stays in this page’s memory only.",
  "password": "Admin passphrase",
  "loginButton": "View statistics ↗",
  "refresh": "Refresh ↻",
  "logout": "Sign out",
  "total": "All-time firmware downloads",
  "today": "Firmware downloads today",
  "month": "Firmware downloads this month",
  "community": "Selected period · Community downloads",
  "studioTotal": "All-time successful Studio exports",
  "studioFiles": "All-time film packs created",
  "days7": "7 days",
  "days30": "30 days",
  "days90": "90 days",
  "all": "All time",
  "csv": "Export CSV ↓",
  "chartTitle": "Firmware downloads over time",
  "period": "Selected period",
  "peak": "Daily peak",
  "chartAria": "Daily firmware downloads. Select or focus a bar to view its date and count.",
  "versionsTitle": "Cameras and versions",
  "typeModel": "Type / Camera",
  "version": "Version",
  "variant": "Standard / Enhanced",
  "revision": "Build",
  "downloads": "Downloads",
  "empty": "No records in this period.",
  "studioTitle": "Studio exports",
  "studioCSV": "Export Studio CSV ↓",
  "dateTokyo": "Date (Japan time)",
  "exportCount": "Successful exports",
  "packageCount": "Film packs",
  "filmCount": "Individual films",
  "studioEmpty": "No exports in this period.",
  "studioNote": "One generated ZIP with browser save triggered counts as one export. Each user slot is one film pack. Repeated exports count again; these are not unique works or people.",
  "footer": "Dates use Japan time. Downloads are grouped by camera and version. Studio statistics count exports, film packs and individual films separately. These are not unique people or camera installations. Names, XMP, images, device codes, IP addresses and visitor identities are not recorded.",
  "exclude": "Exclude test activity in this browser ↗",
  "include": "Enable statistics for this browser ↗",
  "started": "Records since {date} · {zone}",
  "updated": "Updated {time}",
  "todayMonth": "Today {today} · This month {month}",
  "filmsIncluded": "Containing {count} individual films",
  "studioPeriod": "Selected period: {exports} exports · {files} film packs · {films} individual films",
  "chartHint": "Daily totals · Japan time",
  "chartEmpty": "No downloads in this period",
  "downloadUnit": "downloads",
  "downloadAria": "{date} · {count} downloads",
  "authError": "The admin passphrase is incorrect.",
  "readError": "Unable to load statistics. Please try again.",
  "communityModel": "Community look",
  "standard": "Standard",
  "enhanced": "Enhanced",
  "original": "Original backup",
  "communityVariant": "Look pack",
  "originalPrefix": "Original · ",
  "kind": "Type",
  "model": "Camera",
  "csvVariant": "Variant",
  "source": "Record source",
  "manual": "Historical entry",
  "automatic": "Automatic record",
  "firmwareKind": "Firmware",
  "originalKind": "Original backup",
  "communityKind": "Community look",
  "authorDownloads": "Selected period · Author add-on downloads"
 },
 "ja": {
  "pageTitle": "XerFilm · 利用統計",
  "home": "XerFilm GR 公式サイト",
  "private": "管理者専用",
  "back": "サイトへ戻る ↗",
  "language": "言語",
  "theme": "明暗を切り替え",
  "heading": "ひとつひとつの利用を、",
  "headingAccent": "記録に。",
  "intro": "ダウンロード、創作、色の共有を少しずつ積み重ねる。",
  "loginTitle": "利用統計",
  "loginNote": "管理用パスフレーズを入力してください。このページのメモリ内のみに保持されます。",
  "password": "管理用パスフレーズ",
  "loginButton": "統計を見る ↗",
  "refresh": "更新 ↻",
  "logout": "ログアウト",
  "total": "累計ファームウェアダウンロード",
  "today": "本日のファームウェアダウンロード",
  "month": "今月のファームウェアダウンロード",
  "community": "選択期間 · コミュニティダウンロード",
  "studioTotal": "Studio 書き出し成功累計",
  "studioFiles": "作成したフィルムパック累計",
  "days7": "過去7日",
  "days30": "過去30日",
  "days90": "過去90日",
  "all": "全期間",
  "csv": "CSVを書き出す ↓",
  "chartTitle": "ファームウェアダウンロードの推移",
  "period": "選択期間",
  "peak": "1日の最多",
  "chartAria": "日別ファームウェアダウンロード数。棒を選択・フォーカスすると日付と件数を確認できます。",
  "versionsTitle": "機種とバージョン",
  "typeModel": "種類 / 機種",
  "version": "バージョン",
  "variant": "通常 / 拡張",
  "revision": "ビルド",
  "downloads": "ダウンロード数",
  "empty": "この期間の記録はありません。",
  "studioTitle": "Studio 書き出し",
  "studioCSV": "StudioのCSVを書き出す ↓",
  "dateTokyo": "日付（日本時間）",
  "exportCount": "書き出し成功数",
  "packageCount": "フィルムパック数",
  "filmCount": "個別フィルム数",
  "studioEmpty": "この期間の書き出し記録はありません。",
  "studioNote": "ZIPを生成してブラウザの保存を開始すると1回の書き出しと数えます。ユーザー1枠につき1パックです。再書き出しも加算され、作品や人数の重複排除は行いません。",
  "footer": "日付は日本時間で集計し、ダウンロード数は機種・バージョン別に表示します。Studioでは書き出し回数・パック数・個別フィルム数を別々に集計します。人数やカメラへの導入数ではありません。名前・XMP・画像・機器コード・IP・訪問者の識別情報は記録しません。",
  "exclude": "このブラウザのテスト集計を除外 ↗",
  "include": "このブラウザの集計を再開 ↗",
  "started": "記録開始 {date} · {zone}",
  "updated": "更新日時 {time}",
  "todayMonth": "本日 {today} 回 · 今月 {month} 回",
  "filmsIncluded": "個別フィルム {count} 種類を含む",
  "studioPeriod": "選択期間：{exports} 回の書き出し · {files} パック · {films} フィルム",
  "chartHint": "日別集計 · 日本時間",
  "chartEmpty": "この期間のダウンロードはありません",
  "downloadUnit": "ダウンロード",
  "downloadAria": "{date} · {count} ダウンロード",
  "authError": "管理用パスフレーズが正しくありません。",
  "readError": "統計を読み込めません。もう一度お試しください。",
  "communityModel": "コミュニティルック",
  "standard": "通常版",
  "enhanced": "拡張版",
  "original": "純正バックアップ",
  "communityVariant": "ルックパック",
  "originalPrefix": "純正 · ",
  "kind": "種類",
  "model": "機種",
  "csvVariant": "区分",
  "source": "記録元",
  "manual": "履歴の補記",
  "automatic": "自動記録",
  "firmwareKind": "ファームウェア",
  "originalKind": "純正バックアップ",
  "communityKind": "コミュニティルック",
  "authorDownloads": "選択期間 · 作者追加パックのダウンロード"
 }
};
const locales={zh:'zh-CN',en:'en-US',ja:'ja-JP'};
let language='zh';try{const requested=new URLSearchParams(location.search).get('lang'),saved=localStorage.getItem('site-language');language=translations[requested]?requested:translations[saved]?saved:navigator.language.startsWith('ja')?'ja':navigator.language.startsWith('zh')?'zh':'en';}catch{}
let token='',current,days='30',loginError='',dataError='';
const models={gr3:'GR III / HDF',gr3x:'GR IIIx / HDF',gr4:'GR IV / HDF'};
const tr=(key,values={})=>(translations[language][key]||translations[language].readError).replace(/\{(\w+)\}/g,(_,name)=>values[name]??'');
const number=value=>new Intl.NumberFormat(locales[language]).format(value);
const modelName=id=>id==='community'?tr('communityModel'):models[id]||id;
const variantName=id=>tr(id==='community'?'communityVariant':id);
// Normalize public version labels without changing stored records.
function downloadVersion(row){
 if(row.kind!=='firmware')return row.version;
 const match=/^v(1|2|3)(?:\.(0|1))?$/i.exec(row.version);
 return match?'V'+match[1]+'.'+(match[2]||'0'):row.version;
}
// Fill missing archive references only; V1.1 III/IIIx history spans two released builds.
function downloadRevision(row){
 const releases={'V1.0':{gr4:'v22',gr3:'R12',gr3x:'R12'},'V1.1':{gr4:'v23',gr3:'R13 / R14',gr3x:'R13 / R14'},'V2.0':{gr4:'v32',gr3:'R20',gr3x:'R20'},'V3.0':{gr4:'v49',gr3:'R32',gr3x:'R31'}};
 if(row.revision)return row.revision;
 if(row.kind==='firmware'&&downloadVersion(row)==='V1.1'&&['gr3','gr3x'].includes(row.model)&&row.variant==='enhanced')return 'R14-H';
 const build=row.kind==='firmware'&&releases[downloadVersion(row)]?.[row.model];
 return build&&['standard','enhanced'].includes(row.variant)?(row.variant==='enhanced'?build.split(' / ').map(x=>x+'-H').join(' / '):build):'';
}
function groupedDownloads(rows){
 const groups=new Map();
 for(const row of rows){
  const version=downloadVersion(row),revision=downloadRevision(row),key=JSON.stringify([row.kind,row.model,row.variant,version,revision]);
  if(groups.has(key))groups.get(key).count+=Number(row.count);
  else groups.set(key,{...row,version,revision,count:Number(row.count)});
 }
 return [...groups.values()].sort((a,b)=>b.count-a.count||a.model.localeCompare(b.model)||a.version.localeCompare(b.version)||a.revision.localeCompare(b.revision));
}

function applyLanguage(){
 document.documentElement.lang=locales[language];document.title=tr('pageTitle');
 for(const node of document.querySelectorAll('[data-i18n]'))node.textContent=tr(node.dataset.i18n);
 for(const node of document.querySelectorAll('[data-i18n-aria]'))node.setAttribute('aria-label',tr(node.dataset.i18nAria));
 for(const node of document.querySelectorAll('[data-i18n-title]'))node.title=tr(node.dataset.i18nTitle);
 for(const button of document.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===language));
 $('login-error').textContent=loginError?tr(loginError):'';$('data-error').textContent=dataError?tr(dataError):'';
 if(current)render();
 if(typeof drawPublisher==='function')drawPublisher();
}
for(const button of document.querySelectorAll('[data-language]'))button.onclick=()=>{language=button.dataset.language;try{localStorage.setItem('site-language',language);}catch{}applyLanguage();};
function day(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function range(){const to=day(new Date()),from=days==='all'?'2026-10-18':day(new Date(Date.now()-(Number(days)-1)*86400000));return new URLSearchParams({from,to})}
async function load(){const r=await fetch('https://xerfilm-download-statistics.xerfilm-download-statistics.workers.dev/api/stats?'+range(),{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error(r.status===401?'authError':'readError');current=await r.json();render();void loadPublisher();}
function render(){
 const d=current;$('total').textContent=number(d.summary.combinedTotal);$('today').textContent=number(d.summary.combinedToday);$('month').textContent=number(d.summary.combinedMonth);$('community').textContent=number(d.kinds.find(x=>x.kind==='community')?.count||0);
 $('author-downloads').textContent=number(d.author?.period?.total??0);
 $('period').textContent=tr('started',{date:d.startDate,zone:d.timeZone});$('updated').textContent=tr('updated',{time:new Date(d.generatedAt).toLocaleString(locales[language],{timeZone:d.timeZone})});$('from').textContent=d.from;$('to').textContent=d.to;
 const studio=d.studio;$('studio-total').textContent=number(studio.summary.total);$('studio-recent').textContent=tr('todayMonth',{today:number(studio.summary.today),month:number(studio.summary.month)});$('studio-files').textContent=number(studio.summary.files);$('studio-films').textContent=tr('filmsIncluded',{count:number(studio.summary.films)});$('studio-period').textContent=tr('studioPeriod',{exports:number(studio.period.total),files:number(studio.period.files),films:number(studio.period.films)});
 $('studio-rows').replaceChildren(...studio.daily.map(x=>{const row=document.createElement('tr');for(const value of [x.day,number(x.count),number(x.files),number(x.films)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell)}return row}));$('studio-empty').hidden=studio.daily.length>0;
 renderChart(d);$('rows').replaceChildren(...groupedDownloads(d.downloads).map(x=>{const row=document.createElement('tr');for(const value of [(x.kind==='original'?tr('originalPrefix'):'')+modelName(x.model),x.version,variantName(x.variant),x.revision||'—',number(x.count)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell)}return row}));$('empty').hidden=d.downloads.length>0;$('login').hidden=true;$('dashboard').hidden=false;for(const button of document.querySelectorAll('[data-days]'))button.setAttribute('aria-pressed',String(button.dataset.days===days));
}
function chartModel(data){
 const totals=new Map();for(const row of data.daily)if(row.kind==='firmware')totals.set(row.day,(totals.get(row.day)||0)+Number(row.count));
 const bars=[];for(let time=Date.parse(data.from);time<=Date.parse(data.to)&&bars.length<3660;time+=86400000){const date=new Date(time).toISOString().slice(0,10);bars.push([date,totals.get(date)||0]);}
 const peak=Math.max(0,...bars.map(x=>x[1])),raw=Math.max(1,peak/4),magnitude=10**Math.floor(Math.log10(raw));
 const step=Math.ceil([1,1.5,2,2.5,3,4,5,6,8,10].map(x=>x*magnitude).find(x=>x>=raw)),ceiling=step*4;
 return {bars,peak,ceiling,total:bars.reduce((n,x)=>n+x[1],0)};
}

function renderChart(data){
 const {bars,peak,ceiling,total}=chartModel(data),format=n=>number(n);
 $('chart-total').textContent=format(total);$('chart-peak').textContent=format(peak);
 $('chart-axis').replaceChildren();$('chart-lines').replaceChildren();
 for(let i=0;i<=4;i++){const label=document.createElement('span');label.style.top=(i*25)+'%';label.textContent=format(ceiling*(1-i/4));$('chart-axis').append(label);const line=document.createElement('i');line.style.top=(i*25)+'%';$('chart-lines').append(line);}
 $('chart').replaceChildren(...bars.map(([date,count],i)=>{
  const column=document.createElement('button');column.type='button';column.className='chart-column'+(i===bars.length-1?' is-latest':'');column.style.setProperty('--ratio',count/ceiling);column.setAttribute('aria-label',tr('downloadAria',{date,count:format(count)}));
  const fill=document.createElement('span');fill.className='bar-fill';fill.setAttribute('aria-hidden','true');
  const tip=document.createElement('span');tip.className='bar-tip';tip.setAttribute('aria-hidden','true');const day=document.createElement('small');day.textContent=date;const number=document.createElement('strong');number.textContent=format(count);const unit=document.createElement('em');unit.textContent=tr('downloadUnit');number.append(unit);tip.append(day,number);column.append(fill,tip);return column;
 }));
 const ticks=new Set([0,bars.length-1]);const segments=Math.min(4,bars.length-1);for(let i=1;i<segments;i++)ticks.add(Math.round(i*(bars.length-1)/segments));
 $('chart-dates').replaceChildren(...[...ticks].filter(i=>i>=0&&bars[i]).sort((a,b)=>a-b).map(i=>{const label=document.createElement('span');label.textContent=bars[i][0].slice(5).replace('-','.');label.style.left=((i+.5)/bars.length*100)+'%';return label;}));
 $('chart-hint').textContent=tr(total?'chartHint':'chartEmpty');
}

let theme='dark';try{if(localStorage.getItem('site-theme')==='light')theme='light';}catch{}document.documentElement.dataset.theme=theme;
$('theme').onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('site-theme',theme);}catch{}};
$('login-form').addEventListener('submit',async e=>{e.preventDefault();token=$('token').value.trim();$('login-button').disabled=true;loginError='';$('login-error').textContent='';try{await load();$('token').value=''}catch(e){token='';loginError=e.message==='authError'?'authError':'readError';$('login-error').textContent=tr(loginError)}finally{$('login-button').disabled=false}});
$('logout').onclick=()=>{clearTimeout(releaseTimer);releaseCatalog=null;releaseJob=null;releaseRequest=null;releaseModel='';$('release-models').replaceChildren();$('release-history').replaceChildren();$('release-form').hidden=true;token='';current=null;dataError='';$('data-error').textContent='';$('dashboard').hidden=true;$('login').hidden=false;$('token').value='';$('rows').replaceChildren();$('chart').replaceChildren();$('studio-rows').replaceChildren();$('token').focus()};
async function refresh(){const b=$('refresh');b.disabled=true;dataError='';$('data-error').textContent='';try{await load()}catch(e){dataError=e.message==='authError'?'authError':'readError';$('data-error').textContent=tr(dataError)}finally{b.disabled=false}}$('refresh').onclick=refresh;$('filters').onclick=e=>{const button=e.target.closest('[data-days]');if(button){days=button.dataset.days;void refresh()}};
function saveCSV(rows,filename){const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('csv').onclick=()=>{if(!current)return;saveCSV([[tr('kind'),tr('model'),tr('version'),tr('csvVariant'),tr('revision'),tr('downloads'),tr('source')],...current.downloads.map(x=>[tr(x.kind+'Kind'),modelName(x.model),downloadVersion(x),variantName(x.variant),downloadRevision(x),x.count,tr(x.source==='manual'?'manual':'automatic')])],'XerFilm-downloads-'+current.from+'-'+current.to+'.csv')};
$('studio-csv').onclick=()=>{if(!current)return;saveCSV([[tr('dateTokyo'),tr('exportCount'),tr('packageCount'),tr('filmCount')],...current.studio.daily.map(x=>[x.day,x.count,x.files,x.films])],'XerFilm-studio-'+current.from+'-'+current.to+'.csv')};

const releaseAPI='https://xerfilm-download-statistics.xerfilm-download-statistics.workers.dev/api/releases';
const pubText={
 zh:{title:'正式版发布',refresh:'刷新测试版',intro:'测试通过后，将所选机型的普通版和增强版一起发布。官网域名保持不变。',version:'官网版本号',note:'固件内容保持不变；撤下本机型的测试入口，其他机型不受影响。',notes:'更新说明（中文，每行一条）',translations:'英文／日文说明',confirm:'我已完成所选机型普通版与增强版的实机测试，确认包号正确，同意公开发布。',publish:'发布为正式版 ↗',none:'暂无待发布测试版',stable:'当前正式版',candidate:'待发布测试版',review:'确认发布以下固件？',variant:'普通版 + 增强版',loading:'正在读取…',dispatching:'正在提交…',queued:'排队等待发布…',in_progress:'正在校验与部署，请稍候…',success:'已上线',failed:'发布未完成，请查看发布记录。',attention:'正在核实提交结果，请勿重复发布。',readError:'无法读取发布服务，请稍后刷新。',stale:'页面内容已过期，请刷新测试版后重新确认。',busy:'已有发布正在进行，请等待完成。',invalid:'请检查版本号和三语更新说明；每种语言 1～8 条，每条最多 160 字。',configuration:'发布服务尚未完成配置。',details:'查看发布记录 ↗',offline:'连接中断，正在查询同一次发布的结果…',retry:'重试这次发布 ↻'},
 en:{title:'Release firmware',refresh:'Refresh test builds',intro:'After testing, publish the standard and enhanced builds for one model together. The website domain stays the same.',version:'Public version',note:'Preserves the exact firmware bytes, removes this model’s test entry and leaves other models unchanged.',notes:'Release notes (Chinese, one per line)',translations:'English / Japanese notes',confirm:'I have hardware-tested both variants for the selected model, checked the revision and approve public release.',publish:'Publish stable release ↗',none:'No pending test build',stable:'Current stable',candidate:'Test build',review:'Publish these builds?',variant:'Standard + enhanced',loading:'Loading…',dispatching:'Submitting…',queued:'Queued…',in_progress:'Validating and deploying…',success:'Live',failed:'Publication incomplete. Check the run details.',attention:'Checking the submission. Please do not publish again.',readError:'Release service unavailable. Please refresh later.',stale:'The website changed. Refresh and confirm again.',busy:'A release is already in progress.',invalid:'Check the version and all three languages: 1–8 lines, up to 160 characters per line.',configuration:'Publisher is not configured.',details:'View publication run ↗',offline:'Connection interrupted; checking this publication…',retry:'Retry this publication ↻'},
 ja:{title:'正式版の公開',refresh:'テスト版を更新',intro:'テスト完了後、選んだ機種の通常版と拡張版をまとめて公開します。ドメインは変わりません。',version:'公開バージョン',note:'ファームウェアは変更せず、この機種のテスト版を取り下げます。他の機種には影響しません。',notes:'更新内容（中国語・1行1項目）',translations:'英語／日本語の説明',confirm:'選んだ機種の通常版・拡張版の実機テストを完了し、番号を確認して公開に同意します。',publish:'正式版として公開 ↗',none:'公開待ちのテスト版なし',stable:'現在の正式版',candidate:'テスト版',review:'以下を公開しますか？',variant:'通常版 + 拡張版',loading:'読み込み中…',dispatching:'送信中…',queued:'公開待ち…',in_progress:'検証・公開中…',success:'公開済み',failed:'公開が完了していません。記録をご確認ください。',attention:'送信結果を確認中です。再送しないでください。',readError:'公開サービスを読み込めません。後で更新してください。',stale:'ページが更新されました。再読み込みして確認してください。',busy:'別の公開処理が進行中です。',invalid:'バージョンと3言語の説明を確認してください。各1～8行、1行160文字まで。',configuration:'公開サービスは未設定です。',details:'公開記録を見る ↗',offline:'通信が切れました。同じ公開の結果を確認中…',retry:'今回の公開を再試行 ↻'}
};
let releaseCatalog=null,releaseModel='',releaseJob=null,releaseTimer=null,releaseSubmitting=false,releaseRequest=null;
const pt=k=>pubText[language][k]||k;
const releaseActive=j=>j&&['dispatching','queued','in_progress','attention'].includes(j.status);
async function releaseFetch(path='',options={}){
 const r=await fetch(releaseAPI+path,{...options,cache:'no-store',headers:{Authorization:'Bearer '+token,...options.headers}});
 const data=await r.json();if(!r.ok)throw Error(data.error||'read-error');return data;
}
function publisherError(error){return pt({'stale-release':'stale','release-in-progress':'busy','invalid-release':'invalid','version-downgrade':'invalid','publisher-not-configured':'configuration'}[error.message]||'readError');}
function drawPublisher(){
 for(const n of document.querySelectorAll('[data-pub]'))n.textContent=pt(n.dataset.pub);
 $('release-models').replaceChildren(...(releaseCatalog?.models||[]).map(m=>{
  const b=document.createElement('button');b.type='button';b.className='release-model';b.setAttribute('aria-pressed',String(m.id===releaseModel));b.disabled=releaseSubmitting||releaseActive(releaseJob);const title=document.createElement('strong');title.textContent=m.label;const stable=document.createElement('small');stable.textContent=pt('stable')+' · '+m.stable[0].version+' / '+m.stable[0].revision;const test=document.createElement('small');test.textContent=m.candidate?pt('candidate')+' · '+m.candidate.revision:pt('none');b.append(title,stable,test);b.onclick=()=>selectRelease(m.id);return b;
 }));
 $('release-publish').disabled=!$('release-confirm').checked||releaseSubmitting||releaseActive(releaseJob);
 $('release-refresh').disabled=releaseSubmitting||releaseActive(releaseJob);
 $('release-status').textContent=releaseSubmitting?pt('dispatching'):releaseJob?pt(releaseJob.status):'';
 $('release-history').replaceChildren(...(releaseCatalog?.jobs||[]).map(job=>{const p=document.createElement('p');p.textContent=(releaseCatalog.models.find(m=>m.id===job.model)?.label||job.model)+' · '+job.version+' / '+job.revision+' · '+pt(job.status)+' ';if(job.runURL){const a=document.createElement('a');a.href=job.runURL;a.textContent=pt('details');a.target='_blank';a.rel='noopener noreferrer';p.append(a);}if(job.status==='failed'&&!releaseActive(releaseJob)){const b=document.createElement('button');b.type='button';b.textContent=pt('retry');b.onclick=()=>retryRelease(job);p.append(b);}return p;}));
}
function selectRelease(id){
 releaseModel=id;releaseRequest=null;const m=releaseCatalog.models.find(m=>m.id===id);$('release-confirm').checked=false;
 $('release-form').hidden=!m?.candidate;$('release-detail').textContent=m?.candidate?m.label+' · '+m.candidate.revision+' · '+pt('variant')+'\n'+m.candidate.firmware.map(r=>r.revision+' · SHA-256 '+r.sha256.slice(0,16)+'…').join('\n'):pt('none');
 if(m?.candidate){$('release-version').value=m.candidate.version;for(const lang of ['zh','en','ja'])$('release-'+lang).value=releaseCatalog.notes[lang].join('\n');}drawPublisher();
}
async function loadPublisher(){
 if(!token)return;const credential=token;try{const catalog=await releaseFetch();if(token!==credential)return;releaseCatalog=catalog;$('release-error').textContent='';releaseJob=releaseCatalog.jobs.find(releaseActive)||releaseCatalog.jobs[0]||null;const selected=releaseCatalog.models.find(m=>m.id===releaseModel&&m.candidate)||releaseCatalog.models.find(m=>m.candidate)||releaseCatalog.models[0];selectRelease(selected.id);if(releaseActive(releaseJob))scheduleRelease();}catch(e){$('release-error').textContent=publisherError(e);drawPublisher();}
}
function scheduleRelease(){clearTimeout(releaseTimer);if(token&&releaseActive(releaseJob))releaseTimer=setTimeout(pollRelease,6000);}
async function pollRelease(){
 if(!token||!releaseJob)return;const id=releaseJob.id;
 try{const job=await releaseFetch('/jobs/'+id);if(!token)return;releaseJob=job;if(releaseCatalog){releaseCatalog.jobs=[job,...releaseCatalog.jobs.filter(j=>j.id!==id)];}drawPublisher();if(!releaseActive(job)){await loadPublisher();return;}}
 catch(e){if(e.message==='not-found'){await loadPublisher();return;}if(token)$('release-error').textContent=pt('offline');}scheduleRelease();
}
$('release-confirm').onchange=drawPublisher;
$('release-refresh').onclick=loadPublisher;
$('release-form').onsubmit=async e=>{
 e.preventDefault();if(releaseSubmitting||releaseActive(releaseJob)||!$('release-confirm').checked)return;
 const m=releaseCatalog.models.find(m=>m.id===releaseModel),version=$('release-version').value.trim();if(!m?.candidate)return;
 const notes=Object.fromEntries(['zh','en','ja'].map(lang=>[lang,$('release-'+lang).value.split('\n').map(s=>s.trim()).filter(Boolean)]));
 if(!/^V[1-9]\d?\.\d{1,2}(?:\.\d{1,2})?$/.test(version)||Object.values(notes).some(a=>!a.length||a.length>8||a.some(s=>s.length>160||/[\x00-\x1f<>]/.test(s)))){$('release-error').textContent=pt('invalid');return;}
 if(!window.confirm(pt('review')+'\n\n'+m.label+'\n'+version+' / '+m.candidate.revision+'\n'+pt('variant')+'\n\n'+notes[language].join('\n')))return;
 releaseRequest={id:crypto.randomUUID(),model:m.id,version,notes,head:releaseCatalog.head,snapshot:m.candidate.snapshot,confirmed:true};releaseSubmitting=true;drawPublisher();$('release-error').textContent='';
 try{const result=await releaseFetch('/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(releaseRequest)});releaseJob=result.error?{...releaseRequest,revision:m.candidate.revision,status:'attention'}:result;releaseCatalog.jobs=[releaseJob,...releaseCatalog.jobs];}
 catch(e){if(e.message==='Failed to fetch'||e instanceof TypeError){releaseJob={...releaseRequest,revision:m.candidate.revision,status:'attention'};$('release-error').textContent=pt('offline');}else $('release-error').textContent=publisherError(e);}
 finally{releaseSubmitting=false;$('release-confirm').checked=false;drawPublisher();scheduleRelease();}
};
async function retryRelease(job){
 if(releaseSubmitting||releaseActive(releaseJob)||!confirm(pt('retry')+'\n'+job.model+' '+job.version+' / '+job.revision))return;
 try{releaseJob=await releaseFetch('/jobs/'+job.id+'/retry',{method:'POST'});releaseCatalog.jobs=[releaseJob,...releaseCatalog.jobs.filter(j=>j.id!==job.id)];drawPublisher();scheduleRelease();}catch(e){$('release-error').textContent=publisherError(e);void loadPublisher();}
}

applyLanguage();
