'use strict';
const a=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const rt=path.resolve(process.env.PALE_RUNTIME_ROOT||path.join(__dirname,'../../../runtime'));
const {prepare}=require(rt+'/prepare.cjs'),{Client}=require(rt+'/client.cjs'),{start}=require(rt+'/web/server.cjs');
let p,h,i,b;
const end='2026-02-01T00:00:00Z';
const expect=(r,s='ok')=>{a.equal(r.status,s,JSON.stringify(r));return r;};
async function main(){
 p=prepare(path.join(__dirname,'..'));
 h=await start({app:p.app,registry:p.registry,run:'subscription-browser',profile:'scenario',stateDir:path.join(p.root,'state')});
 i=new Client(p.app,'infra',h.run,h.stateDir,'browser-verifier',{registry:p.registry});await i.initialize();
 b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,chromiumSandbox:true});
 const page=await b.newPage(),errors=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
 const btn=name=>page.getByRole('button',{name,exact:true}),visible=txt=>page.getByText(txt,{exact:true}).waitFor(),status=page.getByRole('status');
 const snap=async()=>expect(await i.call('env.snapshot')),base=await snap();
 const reset=async()=>{expect(await i.call('env.reset',{expected_version:(await snap()).version}),'ready');const s=await snap();a.deepEqual(s.snapshot.data,base.snapshot.data);a.deepEqual(s.snapshot.receipts,{});a.equal(s.snapshot.virtual_now,base.snapshot.virtual_now);};
 const forward=async(id,virtual_now)=>expect(await i.call('env.advance_time',{expected_version:(await snap()).version,request_id:id,virtual_now}),'committed');
 const notice=text=>status.getByText(text,{exact:true}).waitFor();
 const cancel=async()=>{await btn('Prepare cancellation').click();await notice('Preview prepared. No entitlement change.');await btn('Confirm cancellation').click();await notice('Confirmation recorded.');await visible('Paid until scheduled end');};
 await page.goto(h.accessUrl);
 await page.getByLabel('Account ID').fill('unbound');await btn('Open account').click();await notice('Account not found.');
 await page.getByLabel('Account ID').fill('account-1');await btn('Open account').click();await visible('Paid · active');
 await btn('Prepare cancellation').click();await notice('Preview prepared. No entitlement change.');await btn('Abandon preview').click();await notice('Preview abandoned. No entitlement change.');
 let s=await snap();a.equal(s.snapshot.data.status,'paid_active');a.equal(s.snapshot.data.previews[0].status,'abandoned');
 a.equal(s.snapshot.data.action_receipts.length,0);
 await btn('Overview').click();await cancel();
 s=await snap();a.equal(s.snapshot.data.status,'cancellation_scheduled');a.equal(s.snapshot.data.action_receipts[0].action,'cancel');
 await btn('View receipt '+s.snapshot.data.action_receipts[0].id).click();await page.getByText(/Receipt SE-R\d+ · cancel ·/).waitFor();
 await btn('Overview').click();await btn('Prepare revocation').click();await notice('Preview prepared. No entitlement change.');
 await btn('Abandon preview').click();await notice('Preview abandoned. No entitlement change.');
 a.equal((await snap()).snapshot.data.status,'cancellation_scheduled');
 await btn('Overview').click();await btn('Prepare revocation').click();await btn('Confirm revocation').click();await notice('Confirmation recorded.');
 s=await snap();a.equal(s.snapshot.data.status,'paid_active');a.equal(s.snapshot.data.action_receipts.length,2);
 await forward('next-period','2026-04-01T10:00:00Z');await btn('Refresh view').click();await visible('The next period is the last one modeled.');
 await visible('Current period: 2026-02-01T00:00:00Z to 2026-03-01T00:00:00Z');
 for(let run=0;run<2;run++){
  await reset();await btn('Overview').click();await cancel();
  await forward('before-end','2026-01-31T23:59:59Z');await btn('Overview').click();await btn('Prepare revocation').click();await btn('Confirm revocation').waitFor();
  await forward('exact-end',end);const boundary=await snap();await btn('Confirm revocation').click();await notice('The workspace changed. Refresh and review the current subscription.');
  await btn('Refresh view').click();await visible('Free · paid access ended');
  a.equal(await btn('Confirm revocation').count(),0);
  for(const item of base.snapshot.data.saved)await visible(item.title);
  const after=await snap();a.deepEqual(after.snapshot.data,boundary.snapshot.data);a.deepEqual(after.snapshot.receipts,boundary.snapshot.receipts);a.deepEqual(after.version,boundary.version);
 }
 a.deepEqual(errors,[]);
 console.log('PASS: genuine Chromium clicks in all views, successful cancel/revoke, both abandons, receipt read, exact-boundary stale UI, saved entries retained and two reset/replays, with independent Infra readback.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await Promise.allSettled([b?.close(),i?.close()]);await h?.close();p?.cleanup();});
