'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const seedPath=path.join(__dirname,'seed.json');
const digest=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
function generated(){
 const smoke=require('../fixtures/minimal.json');
 const products=[['Desk organizer',1350],['Canvas pencil case',1690],['Linen notebook',2200],['Cotton tote',2890],['A5 sketchbook',2430],['Steel bottle',4980],['Reading stand',3590],['Cable clips',1190]];
 const data={...smoke,orders:[],requests:[]};
 for(let n=0;n<24;n++){
  const year=2025+Math.floor(n/12),month=n%12;
  for(let k=0;k<2;k++){
   const i=n*2+k+1,[item_name,refund_minor]=products[(n+k*3)%products.length];
   const day=k===0?(n===0?1:3+n%5):(n===23?31:18+n%7);
   const at=new Date(Date.UTC(year,month,day,8+i%10,i%4*15)),dayMs=86400000;
   const o={id:'history-'+i,item_id:'history-item-'+i,item_name,policy_id:data.policy.id,
    ordered_at:at.toISOString(),return_deadline:new Date(+at+dayMs*(n%3===0?14:21)).toISOString(),
    refund_minor:refund_minor+(n%4)*100,currency:'CNY',refundable:k===0||n%4!==1,order_number:String(20000+i)};
   data.orders.push(o);
   if(k===0||i%7===0&&o.refundable&&n!==23){
    const statuses=['cancelled','dispatched','confirmed','discarded'];
    data.requests.push({id:'history-request-'+i,order_id:o.id,status:statuses[(n+k)%4],
     created_at:new Date(+at+dayMs*(2+n%5)).toISOString(),attempt:1});
   }
  }
 }
 return data;
}
function report(data,raw){
 const days=new Set(),months=Object.fromEntries(Array.from({length:24},(_,i)=>[
  new Date(Date.UTC(2025,i,1)).toISOString().slice(0,7),{orders:0,requests:0,real:0,synthetic:0,days:new Set()}]));
 for(const [field,kind] of [['ordered_at','orders'],['created_at','requests']]){
  for(const r of data[kind]){
   const date=new Date(r[field]).toISOString().slice(0,10),m=months[date.slice(0,7)];
   a.ok(m,'Date must fall in the two-year window');
   m[kind]++;m.synthetic++;m.days.add(date);days.add(date);
  }
 }
 for(const m of Object.values(months))m.days=m.days.size;
 const dates=[...days].sort();
 return {schema:'refund-only-returns.coverage.v1',source:'synthetic-evaluation',counting_zone:'UTC',
  counted_fields:{orders:'ordered_at',requests:'created_at'},requested_window:['2025-01-01','2026-12-31'],
  observed_window:[dates[0],dates.at(-1)],real:0,synthetic:data.orders.length+data.requests.length,
  distinct_dates:dates.length,missing_months:Object.entries(months).filter(([,m])=>!m.synthetic).map(([k])=>k),
  monthly:months,seed_sha256:digest(raw)};
}
function main(){
 const asJson=o=>JSON.stringify(o,null,2)+'\n';
 const write=process.argv.includes('--generate'),data=generated();
 const raw=asJson(data),coverage=asJson(report(data,raw)),cp=path.join(__dirname,'coverage.json');
 if(write){fs.writeFileSync(seedPath,raw);fs.writeFileSync(cp,coverage);}
 else{
  a.equal(fs.readFileSync(seedPath,'utf8'),raw,'Seed regeneration drift');
  a.equal(fs.readFileSync(cp,'utf8'),coverage,'Coverage drift');
  process.stdout.write(coverage);
 }
}
if(require.main===module)main();
module.exports={report};
