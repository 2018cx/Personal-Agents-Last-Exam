'use strict';
const a=require('node:assert/strict'),path=require('node:path');
const rt=path.resolve(process.env.PALE_RUNTIME_ROOT||path.join(__dirname,'../../../runtime'));
const {prepare}=require(rt+'/prepare.cjs'),{Client}=require(rt+'/client.cjs');
const app='subscription-exit',p=prepare(path.join(__dirname,'..')),clients=[],end='2026-02-01T00:00:00Z';
const make=(role,run)=>{const c=new Client(app,role,run,path.join(p.root,'state'),'subscription-verifier',{registry:p.registry});clients.push(c);return c;};
const expect=(r,s='ok')=>{a.equal(r.status,s,JSON.stringify(r));return r;};
const snap=async i=>expect(await i.call('env.snapshot'));
const account_id='account-1', call=(g,n,args={})=>g.call(app+'.'+n,{account_id,...args});
const write=(g,n,x,expected_version,request_id)=>call(g,n,{...x,expected_version,request_id});
async function main(){
 const i=make('infra','exact-boundary'),g=make('agent','exact-boundary'),g2=make('agent','exact-boundary');
 await Promise.all([i,g,g2].map(c=>c.initialize()));
 const init=await snap(i),seed=structuredClone(require('../fixtures/pending.json'));seed.saved[0].title='Task-provided synthetic entry';
 const known=expect(await i.call('env.load_seed',{expected_version:init.version,data:seed,bundle:init.snapshot.resources.bundle,request_id:'custom',virtual_now:'2026-01-31T23:59:59Z'}),'ready');
 expect(await g.call('env.advance_time',{}),'permission_denied');
 expect(await call(g,'read_status',{account_id:'not-me'}),'not_found');
 for(let j=0;j<2;j++){
  if(j){expect(await i.call('env.reset',{expected_version:(await snap(i)).version}),'ready');const s=await snap(i);a.deepEqual(s.snapshot.data,seed);a.deepEqual(s.snapshot.receipts,{});}
  const before=await snap(i),opened=expect(await write(g,'prepare_revocation',{},before.version,'preview'),'committed');
  const moved=expect(await i.call('env.advance_time',{expected_version:opened.version,request_id:'equal',virtual_now:end}),'committed');
  const state=await snap(i),args={preview_id:opened.preview.id};
  expect(await write(g,'confirm',args,opened.version,'old-rev'),'stale_version');
  const read=expect(await call(g2,'read_status'));a.equal(read.entitlement.access,'free');a.equal(read.entitlement.effective_end,end);
  a.deepEqual(read.entitlement.saved,seed.saved);a.deepEqual(read.open_previews,[]);
  expect(await write(g,'confirm',args,moved.version,'fresh-rev'),'stale_preview');
  const final=await snap(i);a.deepEqual(final.snapshot.data,state.snapshot.data);a.deepEqual(final.snapshot.receipts,state.snapshot.receipts);a.deepEqual(final.version,state.version);
 }
 const other=make('infra','receipt-persistence'),agent=make('agent','receipt-persistence');await Promise.all([other,agent].map(c=>c.initialize()));
 const opening=expect(await write(agent,'prepare_cancellation',{},(await snap(other)).version,'cancel-draft'),'committed');
 const args={preview_id:opening.preview.id,expected_version:opening.version,request_id:'cancel-final'};
 const result=expect(await call(agent,'confirm',args),'committed');
 const state=await snap(other);
 a.deepEqual(await call(agent,'confirm',args),{...result,duplicate:true});
 expect(await call(agent,'confirm',{...args,preview_id:'different'}),'idempotency_conflict');
 a.deepEqual((await snap(other)).version,state.version);
 a.deepEqual(expect(await call(agent,'read_receipt',{receipt_id:result.receipt.id})).receipt,result.receipt);

 // Reproduce real Core duplicate-record enforcement at the same instant.
 const repeatI=make('infra','same-time-repeats'),repeatG=make('agent','same-time-repeats');
 await Promise.all([repeatI,repeatG].map(c=>c.initialize()));
 for(let k=0;k<4;k++){
  const opened=expect(await write(repeatG,'prepare_cancellation',{},(await snap(repeatI)).version,'open-'+k),'committed');
  if(k>=2)expect(await write(repeatG,'abandon',{preview_id:opened.preview.id},opened.version,'discard-'+k),'committed');
 }
 const repeated=await snap(repeatI);
 a.deepEqual(repeated.snapshot.data.previews.map(p=>p.status),['open','open','abandoned','abandoned']);
 a.equal(repeated.snapshot.data.action_receipts.length,0);
 const renewed=expect(await repeatI.call('env.advance_time',{expected_version:repeated.version,request_id:'renew-first',virtual_now:end}),'committed');
 const old=repeated.snapshot.data.previews[0].id;
 expect(await write(repeatG,'confirm',{preview_id:old},renewed.version,'old-p1'),'stale_preview');
 const opened=expect(await write(repeatG,'prepare_cancellation',{},renewed.version,'open-renewed'),'committed');
 const confirm=expect(await write(repeatG,'confirm',{preview_id:opened.preview.id},opened.version,'confirm-renewed'),'committed');
 a.equal(confirm.receipt.effective_at,'2026-03-01T00:00:00Z');
 const next=expect(await repeatI.call('env.advance_time',{expected_version:confirm.version,request_id:'end-renewed',virtual_now:confirm.receipt.effective_at}),'committed');
 const projected=expect(await repeatG.call(app+'.read_status',{}));
 a.equal(projected.entitlement.access,'free');a.equal(projected.entitlement.effective_end,confirm.receipt.effective_at);a.deepEqual(projected.version,next.version);
 a.deepEqual(projected.entitlement.saved,repeated.snapshot.data.saved);
 expect(await repeatG.call(app+'.read_status',{account_id:'some-other-account'}),'not_found');

 // Load and observe every delivered evaluation partition as a distinct bound account.
 const cohorts=require('../evaluation/accounts-v1.json');
 const partitions=[...cohorts.accounts,{seed:require('../fixtures/free.json'),binding:require('../fixtures/binding.json'),virtual_now:end}];
 for(const [j,row] of partitions.entries()){
  const ci=make('infra','cohort-'+j),cg=make('agent','cohort-'+j);await Promise.all([ci.initialize(),cg.initialize()]);
  const s=await snap(ci), bundle=s.snapshot.resources.bundle;
  bundle.dataset.expected_counts.records=row.seed.saved.length+row.seed.history.length+row.seed.previews.length+row.seed.action_receipts.length;
  expect(await ci.call('env.load_seed',{expected_version:s.version,data:row.seed,binding:row.binding,bundle,virtual_now:row.virtual_now,request_id:'load-cohort'}),'ready');
  const found=expect(await cg.call(app+'.read_status',{}));
  a.deepEqual(found.history,row.seed.history);
  a.deepEqual(found.entitlement.saved,row.seed.saved);
  a.deepEqual(found.receipts,row.seed.action_receipts);
  const receipt=row.seed.action_receipts[0];
  if(receipt)a.deepEqual(expect(await cg.call(app+'.read_receipt',{receipt_id:receipt.id})).receipt,receipt);
  if(row.seed.status==='free')a.equal(Date.parse(found.entitlement.effective_end),Date.parse(row.seed.period_end));
  a.deepEqual((await snap(ci)).snapshot.data,row.seed);
 }

 const ro=make('infra','read-only'),observer=make('agent','read-only');await Promise.all([ro,observer].map(c=>c.initialize()));
 const baseline=await snap(ro),policies=structuredClone(baseline.snapshot.policies);policies.scenario=policies['read-only'];
 const loaded=expect(await ro.call('env.load_seed',{expected_version:baseline.version,data:baseline.snapshot.data,bundle:baseline.snapshot.resources.bundle,policies,request_id:'observer-seed'}),'ready');
 expect(await call(observer,'read_status'));
 expect(await write(observer,'prepare_cancellation',{},loaded.version,'forbidden'),'permission_denied');
 a.deepEqual((await snap(ro)).snapshot.data,baseline.snapshot.data);
 a.equal(known.status,'ready');
 console.log('PASS: two independent MCP sessions, custom seed, exact boundary, stale revision and preview, receipt replay/conflict, observer denial and reset/replay, same-instant previews, renewed cancellation, six evaluation loads and corrected Free seed.');
}
main().catch(e=>{console.error(e,clients.map(c=>c.errors));process.exitCode=1;}).finally(async()=>{await Promise.allSettled(clients.map(c=>c.close()));p.cleanup();});
