export function parseFirmwareTotal(value){
 if(!Number.isSafeInteger(value?.total)||value.total<0||!/^\d{4}-\d{2}-\d{2}$/.test(value?.asOf||''))return null;
 const date=new Date(value.asOf+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value.asOf)return null;
 if(value.generatedAt!==undefined){
  const generatedAt=new Date(value.generatedAt);
  if(typeof value.generatedAt!=='string'||!Number.isFinite(generatedAt.getTime()))return null;
  return {total:value.total,asOf:value.asOf,generatedAt:generatedAt.toISOString()};
 }
 return {total:value.total,asOf:value.asOf};
}
export function choiceDate(day,language,generatedAt){
 if(generatedAt){
  const timestamp=new Date(generatedAt);
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(timestamp).map(p=>[p.type,p.value]));
  if(language==='zh')return `${parts.year} 年 ${parts.month} 月 ${parts.day} 日 ${parts.hour} 时（东京时间）`;
  if(language==='ja')return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}時（東京時間）`;
  return new Intl.DateTimeFormat('en',{year:'numeric',month:'long',day:'numeric',hour:'numeric',timeZone:'Asia/Tokyo'}).format(timestamp)+' (Tokyo time)';
 }
 const [year,month,date]=day.split('-');
 return language==='zh'?`${year} 年 ${month} 月 ${date} 日`:language==='ja'?`${year}年${month}月${date}日`:new Intl.DateTimeFormat('en',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));
}
