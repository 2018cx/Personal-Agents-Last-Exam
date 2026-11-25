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

 const ro=make('infra','read-only'),observer=make('agent','read-only');await Promise.all([ro,observer].map(c=>c.initialize()));
 const baseline=await snap(ro),policies=structuredClone(baseline.snapshot.policies);policies.scenario=policies['read-only'];
 const loaded=expect(await ro.call('env.load_seed',{expected_version:baseline.version,data:baseline.snapshot.data,bundle:baseline.snapshot.resources.bundle,policies,request_id:'observer-seed'}),'ready');
 expect(await call(observer,'read_status'));
 expect(await write(observer,'prepare_cancellation',{},loaded.version,'forbidden'),'permission_denied');
 a.deepEqual((await snap(ro)).snapshot.data,baseline.snapshot.data);
 a.equal(known.status,'ready');
 console.log('PASS: two independent MCP sessions, custom seed, exact boundary, stale revision and preview, receipt replay/conflict, observer denial and reset/replay.');
}
main().catch(e=>{console.error(e,clients.map(c=>c.errors));process.exitCode=1;}).finally(async()=>{await Promise.allSettled(clients.map(c=>c.close()));p.cleanup();});
