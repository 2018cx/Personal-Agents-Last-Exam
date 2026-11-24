'use strict';
const a=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const rt=path.resolve(process.env.PALE_RUNTIME_ROOT);
const {prepare}=require(rt+'/prepare.cjs'),{Client}=require(rt+'/client.cjs'),{start}=require(rt+'/web/server.cjs');
let p,h,i,b;
async function main(){
 p=prepare(path.join(__dirname,'..'));
 h=await start({app:p.app,registry:p.registry,run:'refund-browser',profile:'scenario',stateDir:path.join(p.root,'state')});
 i=new Client(p.app,'infra',h.run,h.stateDir,'browser-verifier',{registry:p.registry});await i.initialize();
 b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,chromiumSandbox:true});
 const page=await b.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const btn=name=>page.getByRole('button',{name,exact:true}),visible=txt=>page.getByText(txt,{exact:true}).waitFor(),status=page.getByRole('status');
 const open=async id=>{await btn('Order lookup').click();await page.getByLabel('Order ID').fill(id);await btn('Find order').click();};
 const snap=()=>i.call('env.snapshot'),base=await snap();
 const reset=async()=>{a.equal((await i.call('env.reset',{expected_version:(await snap()).version})).status,'ready');const s=await snap();a.deepEqual(s.snapshot.data,base.snapshot.data);a.deepEqual(s.snapshot.receipts,{});a.equal(s.snapshot.virtual_now,base.snapshot.virtual_now);};
 const forward=async id=>{const s=await snap();a.equal((await i.call('env.advance_time',{expected_version:s.version,request_id:id,virtual_now:'2026-01-10T10:00:01Z'})).status,'committed');};
 await page.goto(h.accessUrl);
 await page.getByLabel('Order ID').waitFor();
 await open('order-3');await visible('Return deadline passed');a.equal(await btn('Prepare refund preview').count(),0);
 await open('order-1');await btn('Prepare refund preview').click();await btn('Discard preview').click();
 await status.getByText('Preview discarded. No refund request was submitted.').waitFor();
 const discarded=(await snap()).snapshot.data.requests; a.equal(discarded.find(r=>r.id==='RR-1').status,'discarded');
 a.equal(discarded.filter(r=>r.order_id==='order-1'&&r.status==='confirmed').length,0);
 for(let pass=0;pass<2;pass++){
  await reset();
  await open('order-2');await btn('Review preview request-1').click();await btn('Confirm refund request').waitFor();
  await forward('browser-cutoff');
  await btn('Confirm refund request').click();await status.getByText(/workspace changed/).waitFor();
  await btn('Refresh view').click();await visible('Return deadline passed');a.equal(await btn('Confirm refund request').count(),0);
  a.deepEqual((await snap()).snapshot.data,base.snapshot.data);
 }
 await reset();
 await open('order-2');await btn('Review preview request-1').click();await btn('Confirm refund request').click();
 await status.getByText('Synthetic request recorded. No money was returned.').waitFor();
 a.equal((await snap()).snapshot.data.requests.find(r=>r.id==='request-1').status,'confirmed');
 await forward('browser-after-confirm');await btn('Refresh view').click();await visible('Request request-1 · confirmed');
 await btn('Cancel request…').click();await btn('Confirm cancellation').click();await status.getByText('Synthetic request cancelled.').waitFor();
 a.equal((await snap()).snapshot.data.requests.find(r=>r.id==='request-1').status,'cancelled');
 await open('order-6');await btn('View request request-4 (dispatched)').click();await visible('Dispatched requests cannot be cancelled.');
 a.equal(await btn('Cancel request…').count(),0);a.deepEqual(errors,[]);
 console.log('PASS: actual Chromium order lookup, preview/discard, stale check then expired no-op across two reset/replays, confirm and cancel after time advance, dispatched cutoff (independent Infra snapshots).');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await Promise.allSettled([b?.close(),i?.close()]);await h?.close();p?.cleanup();});
