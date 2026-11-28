'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sha=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
const fields={activity:'history[].at'};
const zone='Asia/Shanghai';
const fmt=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
function localDay(value){
 const at=new Date(value);a.ok(Number.isFinite(+at),'Invalid date '+value);
 const parts=Object.fromEntries(fmt.formatToParts(at).map(x=>[x.type,x.value]));
 return [parts.year,parts.month,parts.day].join('-');
}
const pad=x=>String(x).padStart(2,'0');
const instant=(month,day,hour,minute=0)=>month+'-'+pad(day)+'T'+pad(hour)+':'+pad(minute)+':00+08:00';
const ym=i=>new Date(Date.UTC(2025,i,1)).toISOString().slice(0,7);
const render=x=>JSON.stringify(x,null,2)+'\n';
function generate(){
 const s=require('../fixtures/minimal.json');
 const data={account_id:s.account_id,service:s.service,constraints:s.constraints,providers:s.providers,
  slots:s.slots.filter(x=>['S1','S2'].includes(x.id)),reservations:[],bookings:[],history:[]};
 const moves=new Set([2,8,15,21]); // Four distinct prior slots and coherent state transitions.
 for(let m=0;m<24;m++){
  const month=ym(m), key=month.replace('-',''), d=m===0?1:m===23?20:4+m%11;
  const moved=moves.has(m),cancelled=m%3!==0||m===23;
  const dayOfService=m===23?31:d+9, startHour=9+(m*3)%7, minute=m%2?30:0;
  const slot={id:'ES'+key,provider_id:data.providers[m%2].id,start:instant(month,dayOfService,startHour,minute),
   end:instant(month,dayOfService,startHour+1,minute),estimate_minor:8200+(m*275)%4600,taken:false};
  const old=moved?{...slot,id:'EP'+key,start:instant(month,dayOfService-2,startHour,minute),
   end:instant(month,dayOfService-2,startHour+1,minute),estimate_minor:slot.estimate_minor+200}:slot;
  data.slots.push(slot);if(moved)data.slots.push(old);
  const r={id:'ER'+key,slot_id:old.id,status:'confirmed'};
  const b={id:'EB'+key,slot_id:slot.id,status:cancelled?'cancelled':'confirmed',origin:r.id};
  data.reservations.push(r);data.bookings.push(b);
  data.history.push({operation:'select_slot',object_id:r.id,slot_id:old.id,at:instant(month,d,18,m%2?25:10)},
   {operation:'confirm_reservation',object_id:b.id,slot_id:old.id,at:instant(month,d+1,8,15)});
  if(moved)data.history.push({operation:'reschedule_booking',object_id:b.id,slot_id:slot.id,prior_slot_id:old.id,at:instant(month,d+3,12,25)});
  if(cancelled)data.history.push({operation:'cancel_booking',object_id:b.id,slot_id:slot.id,
   at:m===23?instant(month,31,8,5):instant(month,d+5,16,35)});
 }
 return data;
}
function recount(data,raw){
 const months=Object.fromEntries(Array.from({length:24},(_,m)=>[ym(m),{real:0,synthetic:0,days:new Set(),operations:{}}]));
 const distinct=new Set(),ops={};
 let prior=0;
 for(const h of data.history){
  const t=Date.parse(h.at),day=localDay(h.at),m=months[day.slice(0,7)];
  a.ok(t>=prior,'History is not in event order');prior=t;
  a.ok(m,'History outside coverage window');
  m.synthetic++;m.days.add(day);distinct.add(day);
  m.operations[h.operation]=(m.operations[h.operation]||0)+1;
  ops[h.operation]=(ops[h.operation]||0)+1;
 }
 for(const m of Object.values(months))m.days=m.days.size;
 const dates=[...distinct].sort();
 return {schema:'home-repair-slots.coverage.v1',source:'synthetic-evaluation-v1',counting_zone:zone,counted_fields:fields,
  requested_window:['2025-01-01','2026-12-31'],observed_window:[dates[0],dates.at(-1)],real:0,synthetic:data.history.length,
  distinct_dates:dates.length,missing_months:Object.entries(months).filter(([,m])=>!m.synthetic).map(([k])=>k),
  operation_totals:ops,monthly:months,core_records:{slots:data.slots.length,bookings:data.bookings.length,reservations:data.reservations.length},
  excluded:'Counts actual booking activity timestamps only. Slots are scheduled times, not activity. Future scenario offers, account and provider configuration are not counted.',seed_sha256:sha(raw)};
}
function main(){
 const file=path.join(__dirname,'seed.json'),cov=path.join(__dirname,'coverage.json'),raw=render(generate());
 if(process.argv.includes('--generate')){
  fs.writeFileSync(file,raw);fs.writeFileSync(cov,render(recount(JSON.parse(raw),raw)));return;
 }
 const delivered=fs.readFileSync(file,'utf8'),actual=render(recount(JSON.parse(delivered),delivered));
 a.equal(delivered,raw,'Seed regeneration differs');a.equal(fs.readFileSync(cov,'utf8'),actual,'Coverage differs');
 process.stdout.write(actual);
}
if(require.main===module)main();
module.exports={localDay,recount};
