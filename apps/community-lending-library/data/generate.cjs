'use strict';
// Build reproducible synthetic evaluation history by replaying the actual lending rules.
// No external data, clock, randomness or dependency.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {handleTool,applyEvent,validateSeed}=require('../plugin.cjs');
const app='community-lending-library';
const d0=require('../fixtures/minimal.json'), b=require('../fixtures/binding.json');
const data=structuredClone(d0);
for(const key of ['holds','loans','queue','attempts','queue_history'])data[key]=[];
for(const key of ['next_hold','next_loan','next_attempt','next_sequence'])data[key]=1;
data.seed_at=data.materialized_at='2025-01-01T09:00:00+08:00';
let state=data, eventNumber=0;
const as=(m,at,role='agent')=>({role,virtual_now:at,binding:{...b,accounts:b.accounts.map(r=>({...r,owner_person_id:m}))}});
function act(m,at,n,args){
 state.member_id=m;
 const {data,result}=handleTool(as(m,at),state,app+'.'+n,args);
 state=data;return result;
}
function event(at,n,payload){
 state=applyEvent(as(state.member_id,at,'infra'),state,{operation:app+'.'+n,payload,event_id:'history-event-'+(++eventNumber)});
}
function resolve(m,at,action,attempt,outcome){
 event(at,'desk_outcome',{operation:action,member_id:m,copy_id:attempt.copy_id,attempt:attempt.attempt,outcome});
}
const items=[['I4','C7'],['I5','C8'],['I7','C10']];
const members=['M1','M2','M3','M4'];
for(let month=0;month<24;month++){
 const y=2025+(month>=12?1:0),m=month%12+1;
 const clock=(day,hour=9,min=0)=>[y,String(m).padStart(2,'0'),String(day).padStart(2,'0')].join('-')+'T'+String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0')+':00+08:00';
 const cycle=(start,returned,pick,mbr,waiting,renew,rejected)=>{
  const [item_id,copy_id]=items[pick];
  const h=act(mbr,clock(start),'confirm_hold',{item_id,copy_id}).hold;
  const req=act(mbr,clock(start,10),'request_checkout',{hold_id:h.id}).attempt;
  if(rejected){
   resolve(mbr,clock(start,11),'checkout',req,'rejected');
   const replacement=act(mbr,clock(start,12),'request_checkout',{hold_id:h.id}).attempt;
   resolve(mbr,clock(start,13),'checkout',replacement,'accepted');
  } else resolve(mbr,clock(start,11),'checkout',req,'accepted');
  const l=state.loans.at(-1);
  if(renew)act(mbr,clock(start+2,12),'confirm_renewal',{loan_id:l.id});
  event(clock(start+3,11),'queue_join',{member_id:waiting,item_id,sequence:state.next_sequence});
  const ret=act(mbr,clock(returned),'request_return',{loan_id:l.id}).attempt;
  resolve(mbr,clock(returned,10),'return',ret,'accepted');
  const promoted=state.holds.at(-1);
  assert.equal(promoted.member_id,waiting);
  assert.equal(promoted.copy_id,copy_id);
  act(waiting,clock(returned,13),'cancel_hold',{hold_id:promoted.id});
 };
 cycle(1,6,month%3,members[month%4],members[(month+1)%4],month%2===0,month%3===0);
 cycle(11,16,(month+1)%3,members[(month+2)%4],members[(month+3)%4],month%3!==0,month%4===0);
 cycle(month===23?24:21,month===23?31:26,(month+2)%3,members[(month+3)%4],members[month%4],month%3===1,false);
}
state.member_id='M1';
validateSeed(as('M1',state.materialized_at),state);
assert.equal(state.queue.length,0);
const out=JSON.stringify(state,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(out,fs.readFileSync(path.join(__dirname,'evaluation-v1.json'),'utf8'));
else fs.writeFileSync(path.join(__dirname,'evaluation-v1.json'),out);
