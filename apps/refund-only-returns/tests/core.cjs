'use strict';
const a=require('node:assert/strict'),path=require('node:path'),r=path.resolve(process.env.PALE_RUNTIME_ROOT);
const {prepare}=require(r+'/prepare.cjs'),{Client}=require(r+'/client.cjs');
const app='refund-only-returns',p=prepare(path.join(__dirname,'..')),cs=[];
const make=(role,run,initialProfile)=>{const c=new Client(app,role,run,path.join(p.root,'state'),'returns-verifier',{registry:p.registry,initialProfile});cs.push(c);return c;};
const exp=(r,s='ok')=>{a.equal(r.status,s,JSON.stringify(r));return r;};
const q=id=>({refund_request_id:id}),o=id=>({order_id:id});
const call=(c,n,args={})=>c.call(app+'.'+n,args),write=(c,n,args,v,id)=>call(c,n,{...args,expected_version:v,request_id:id});
const snap=async c=>exp(await c.call('env.snapshot'));
const time='2026-01-10T10:00:01Z';
async function main(){
 const i=make('infra','approved-v1');await i.initialize();
 const low=make('infra','read-only-control');await low.initialize();
 const lb=await snap(low), policies=structuredClone(lb.snapshot.policies);policies.scenario=policies['read-only'];
 exp(await low.call('env.load_seed',{expected_version:lb.version,data:lb.snapshot.data,policies,bundle:lb.snapshot.resources.bundle,request_id:'read-only-seed',virtual_now:lb.snapshot.virtual_now}),'ready');
 const ga=make('agent','read-only-control');await ga.initialize();
 const lowOrder=exp(await call(ga,'read_order',o('order-1')));
 exp(await write(ga,'prepare_preview',o('order-1'),lowOrder.version,'permission-test'),'permission_denied');
 const g=make('agent','approved-v1'),g2=make('agent','approved-v1');await Promise.all([g.initialize(),g2.initialize()]);
 const orig=await snap(i);
 const loaded=exp(await i.call('env.load_seed',{expected_version:orig.version,data:orig.snapshot.data,bundle:orig.snapshot.resources.bundle,request_id:'baseline',virtual_now:'2026-01-10T09:00:00Z'}),'ready');
 const baseline=await snap(i);
 for(const [j,key] of ['order','request'].entries()){
  const bad=structuredClone(baseline.snapshot.data);
  if(key==='order')bad.orders[3].ordered_at='2026-01-10T09:00:01Z';
  else bad.requests[0].created_at='2026-01-10T09:00:01Z';
  exp(await i.call('env.load_seed',{expected_version:baseline.version,data:bad,virtual_now:'2026-01-10T09:00:00Z',request_id:'bad-seed-'+j}),'invalid_seed');
  const same=await snap(i);a.deepEqual(same.snapshot.data,baseline.snapshot.data);a.deepEqual(same.version,baseline.version);
 }

 a.equal(exp(await call(g,'read_order',o('order-2'))).order.eligibility,'eligible');
 exp(await call(g,'read_order',o('wrong')),'not_found');
 exp(await g.call('env.advance_time',{}),'permission_denied');
 const move=exp(await i.call('env.advance_time',{expected_version:loaded.version,request_id:'expire-first',virtual_now:time}),'committed');
 a.deepEqual((await snap(i)).snapshot.data,baseline.snapshot.data);
 exp(await write(g,'confirm_request',q('request-1'),loaded.version,'old'),'stale_version');
 a.equal(exp(await call(g2,'read_order',o('order-2'))).order.eligibility,'expired');
 exp(await write(g,'confirm_request',q('request-1'),move.version,'new'),'return_expired');
 a.deepEqual((await snap(i)).snapshot.data,baseline.snapshot.data);
 exp(await write(g,'cancel_request',q('request-4'),move.version,'dispatched'),'already_dispatched');
 for(let j=0;j<2;j++){
  const reset=exp(await i.call('env.reset',{expected_version:(await snap(i)).version}),'ready');
  const restored=await snap(i);a.deepEqual(restored.snapshot.data,baseline.snapshot.data);a.deepEqual(restored.snapshot.receipts,{});a.equal(restored.snapshot.virtual_now,baseline.snapshot.virtual_now);
  const args={...q('request-1'),expected_version:reset.version,request_id:'confirm-before-cutoff'};
  const yes=exp(await call(g,'confirm_request',args),'committed');a.equal(yes.request.status,'confirmed');
  const m=exp(await i.call('env.advance_time',{expected_version:yes.version,request_id:'expire-after-confirm',virtual_now:time}),'committed');
  const view=exp(await call(g2,'read_request',q('request-1')));
  a.equal(view.request.status,'confirmed');a.equal(view.order.deadline_passed,true);
  const old=await snap(i);
  a.deepEqual(await call(g2,'confirm_request',args),{...yes,duplicate:true});
  a.deepEqual((await snap(i)).version,old.version);a.deepEqual((await snap(i)).snapshot.data,old.snapshot.data);
  exp(await call(g2,'confirm_request',{...args,...q('request-4')}),'idempotency_conflict');
  const cancel=exp(await write(g,'cancel_request',q('request-1'),m.version,'cancel-after-expiry'),'committed');
  a.equal(cancel.request.status,'cancelled');
  exp(await write(g,'prepare_preview',o('order-2'),cancel.version,'expired-reopen'),'return_expired');
  const prev=exp(await write(g,'prepare_preview',o('order-1'),cancel.version,'new-preview'),'committed');
  const drop=exp(await write(g,'discard_preview',q(prev.request.id),prev.version,'discard'),'committed');
  a.equal(drop.request.status,'discarded');
  a.equal(exp(await call(g2,'read_order',o('order-1'))).requests.filter(x=>x.status==='confirmed').length,0);
 }
 console.log('PASS: real Core MCP state, roles, time/optimistic-version boundary, replay/conflict, cancellation and two full resets/replays.');
}
main().catch(e=>{console.error(e,cs.map(c=>c.errors));process.exitCode=1;}).finally(async()=>{await Promise.allSettled(cs.map(c=>c.close()));p.cleanup();});
