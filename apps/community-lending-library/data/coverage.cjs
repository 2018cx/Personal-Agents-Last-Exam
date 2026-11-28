'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const assert=require('node:assert/strict');
const bytes=fs.readFileSync(path.join(__dirname,'evaluation-v1.json')), d=JSON.parse(bytes);
const timezone='Asia/Shanghai', fmt=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'});
const date=value=>{
 const fields=Object.fromEntries(fmt.formatToParts(new Date(value)).map(p=>[p.type,p.value]));
 return fields.year+'-'+fields.month+'-'+fields.day;
};
const sets={}, months={}, overall=new Set();
function add(event, instant){
 if(!instant)return;
 const day=date(instant);assert.ok(day>='2025-01-01'&&day<='2026-12-31',day);
 const key=day.slice(0,7);
 const m=(months[key]??={dates:new Set(),events:{},source:'synthetic-lending-v1'});
 m.dates.add(day);m.events[event]=(m.events[event]||0)+1;
 (sets[event]??=new Set()).add(day);overall.add(day);
}
for(const h of d.holds)add('hold_created',h.created_at);
for(const l of d.loans){
 add('checkout',l.checked_out_at);add('renewal',l.renewed_at);add('return',l.returned_at);
}
for(const a of d.attempts){add('desk_requested',a.requested_at);add('desk_resolved',a.resolved_at);}
for(const q of [...d.queue,...d.queue_history]){add('queue_joined',q.joined_at);add('queue_ended',q.ended_at);}
assert.equal(Object.keys(months).length,24);
const sorted=[...overall].sort();assert.equal(sorted[0],'2025-01-01');assert.equal(sorted.at(-1),'2026-12-31');
const report={
 source:'synthetic-lending-v1',real_records:0,timezone,
 sha256:createHash('sha256').update(bytes).digest('hex'),
 first_date:sorted[0],last_date:sorted.at(-1),distinct_dates:overall.size,
 seeded_rows:Object.fromEntries(['members','items','copies','holds','loans','attempts','queue','queue_history'].map(k=>[k,d[k].length])),
 date_fields:{holds:['created_at'],loans:['checked_out_at','renewed_at','returned_at'],attempts:['requested_at','resolved_at'],queue_history:['joined_at','ended_at']},
 field_distinct_dates:Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,v.size])),
 exclusions:['Copy/member/item definitions are undated. Derived hold expiry and due dates are obligations, not actual activity. Null optional dates are not counted.'],
 months:Object.fromEntries(Object.entries(months).map(([k,v])=>[k,{...v,dates:v.dates.size}]))
};
console.log(JSON.stringify(report,null,2));
