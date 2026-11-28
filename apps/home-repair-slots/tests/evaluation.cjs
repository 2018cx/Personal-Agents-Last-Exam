'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const app=path.resolve(__dirname,'..'),id='home-repair-slots';
const runtime=path.resolve(process.env.PALE_RUNTIME_ROOT||path.join(app,'../../runtime'));
const {prepare}=require(path.join(runtime,'prepare.cjs')),{Client}=require(path.join(runtime,'client.cjs'));
const d=JSON.parse(fs.readFileSync(path.join(app,'evaluation/seed.json'))),dataset=require('../evaluation/dataset.json');
const cov=require('../evaluation/coverage.json'),{localDay,recount}=require('../evaluation/recount.cjs');
const initialTime=require('../fixtures/clock.json').initial_time;
const staged=prepare(app),stateDir=fs.mkdtempSync(path.join(os.tmpdir(),'repair-evaluation-')),clients=[];
function make(role,run='evaluation'){
 const c=new Client(id,role,run,stateDir,'evaluation-'+role,{registry:staged.registry,...(role==='infra'?{initialProfile:'sandbox'}:{})});clients.push(c);return c;
}
const expect=(x,status)=>{a.equal(x.status,status,JSON.stringify(x));return x;};
const snap=async c=>expect(await c.call('env.snapshot'),'ok');
async function test(){
 const i=make('infra'),g=make('agent'),smoke=make('infra','control-smoke');
 await Promise.all(clients.map(c=>c.initialize()));
 const base=await snap(i),other=await snap(smoke),call=(n,args={})=>g.call(id+'.'+n,args);
 const coverage=recount(d,fs.readFileSync(path.join(app,'evaluation/seed.json')));
 a.deepEqual(coverage,cov);a.deepEqual(cov.observed_window,['2025-01-01','2026-12-31']);a.deepEqual(cov.missing_months,[]);
 const load=expect(await i.call('env.load_seed',{expected_version:base.version,data:d,request_id:'evaluation-v1',
  virtual_now:initialTime,bundle:{...base.snapshot.resources.bundle,dataset}}),'ready');
 a.equal(load.quality.automated_pass,true);
 const loaded=await snap(i);a.deepEqual(loaded.snapshot.data,d);a.deepEqual(loaded.snapshot.resources.bundle.dataset,dataset);
 const list=expect(await call('list_slots'),'ok');
 a.deepEqual(list.slots.map(x=>x.id),['S1','S2']);a.equal(list.booking_ids.length,24);
 for(const [m,coverage] of Object.entries(cov.monthly)){
  const book='EB'+m.replace('-',''),row=expect(await call('get_booking',{booking_id:book}),'ok');
  const b=d.bookings.find(x=>x.id===book);
  a.deepEqual(row.booking,b);a.equal(localDay(row.slot.start).slice(0,7),m);
  const events=loaded.snapshot.data.history.filter(x=>localDay(x.at).slice(0,7)===m);
  a.equal(events.length,coverage.synthetic);
  a.ok(events.every(x=>Date.parse(x.at)<Date.parse(row.slot.start)));
  a.equal(events.filter(x=>x.object_id===book&&x.operation==='cancel_booking').length,b.status==='cancelled'?1:0);
  const move=events.find(x=>x.object_id===book&&x.operation==='reschedule_booking');
  if(move){a.equal(move.slot_id,b.slot_id);a.equal(move.prior_slot_id,d.reservations.find(x=>x.id===b.origin).slot_id);}
 }
 const pick=expect(await call('select_slot',{slot_id:'S1',expected_version:list.version,request_id:'eval-preview'}),'committed');
 const ok=expect(await call('confirm_reservation',{reservation_id:pick.reservation.id,expected_version:pick.version,request_id:'eval-book'}),'committed');
 expect(await call('get_booking',{booking_id:ok.booking.id}),'ok');
 a.equal((await snap(i)).snapshot.data.history.length,d.history.length+2);
 expect(await i.call('env.reset',{expected_version:ok.version}),'ready');
 const reset=await snap(i);
 a.deepEqual(reset.snapshot.data,d);a.deepEqual(reset.snapshot.resources.bundle.dataset,dataset);
 a.deepEqual(reset.snapshot.receipts,{});a.equal(reset.snapshot.virtual_now,initialTime);a.ok(reset.version.epoch>ok.version.epoch);
 expect(await call('get_booking',{booking_id:ok.booking.id}),'not_found');
 a.deepEqual((await snap(smoke)).snapshot.data,other.snapshot.data);
 console.log('PASS: separate Infra MCP loads full-window seed, independently reads all 68 dated activity records, validates all 24 monthly Agent booking/slot reads, excludes old slots from availability, resets exactly, and keeps a separate smoke run unchanged.');
}
test().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await Promise.allSettled(clients.map(c=>c.close()));staged.cleanup();fs.rmSync(stateDir,{force:true,recursive:true});});
