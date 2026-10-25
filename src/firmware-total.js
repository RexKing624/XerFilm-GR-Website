export function parseFirmwareTotal(value){
 if(!Number.isSafeInteger(value?.total)||value.total<0||!/^\d{4}-\d{2}-\d{2}$/.test(value?.asOf||''))return null;
 const date=new Date(value.asOf+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value.asOf)return null;
 return {total:value.total,asOf:value.asOf};
}
export function choiceDate(day,language){
 const [year,month,date]=day.split('-');
 return language==='zh'?`${year} 年 ${month} 月 ${date} 日`:language==='ja'?`${year}年${month}月${date}日`:new Intl.DateTimeFormat('en',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));
}
