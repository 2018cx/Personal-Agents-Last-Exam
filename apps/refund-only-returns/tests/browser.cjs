'use strict';
const a=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const rt=path.resolve(process.env.PALE_RUNTIME_ROOT||path.join(__dirname,'../../../runtime'));
const {prepare}=require(rt+'/prepare.cjs'),{Client}=require(rt+'/client.cjs'),{start}=require(rt+'/web/server.cjs');
const viewport={width:1280,height:900},out=process.env.PALE_EVIDENCE_DIR,run='refund-browser';
let p,h,i,b;
async function main(){
 if(out)fs.mkdirSync(out,{recursive:true});
 p=prepare(path.join(__dirname,'..'));
 h=await start({app:p.app,registry:p.registry,run,profile:'scenario',stateDir:path.join(p.root,'state')});
 i=new Client(p.app,'infra',h.run,h.stateDir,'browser-verifier',{registry:p.registry});await i.initialize();
 b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,chromiumSandbox:true});
 const page=await b.newPage({viewport}),errors=[],steps=[];page.on('pageerror',e=>errors.push(e.message));
 const btn=name=>page.getByRole('button',{name,exact:true}),visible=txt=>page.getByText(txt,{exact:true}).waitFor(),status=page.getByRole('status'),field=page.getByLabel('Order number');
 const open=async id=>{await btn('Order lookup').click();await field.fill(id);await btn('Find order').click();};
 const snap=()=>i.call('env.snapshot'),base=await snap();
 const frame=async (slug,action,expected,check)=>{
  const s=await snap();a.equal(s.status,'ok');
  const observed=check(s.snapshot,s.version);
  const file=String(steps.length+1).padStart(2,'0')+'-'+slug+'.png';
  if(out)await page.screenshot({path:path.join(out,file),fullPage:true});
  steps.push({file,action,expected,observed,infra:{snapshot_call:'env.snapshot',version:s.version,virtual_now:s.snapshot.virtual_now}});
 };
 const noWrite=s=>{a.deepEqual(s.data,base.snapshot.data);return 'Baseline business data unchanged';};
 const reset=async()=>{a.equal((await i.call('env.reset',{expected_version:(await snap()).version})).status,'ready');const s=await snap();a.deepEqual(s.snapshot.data,base.snapshot.data);a.deepEqual(s.snapshot.receipts,{});a.equal(s.snapshot.virtual_now,base.snapshot.virtual_now);};
 const forward=async id=>{const s=await snap();a.equal((await i.call('env.advance_time',{expected_version:s.version,request_id:id,virtual_now:'2026-01-10T10:00:01Z'})).status,'committed');};
 await page.goto(h.accessUrl);await field.waitFor();
 await frame('lookup','Open Web Host access link','Order lookup has a labeled order-number field and start action',noWrite);
 await open('bad?input');await visible('Enter a valid order number, such as #10421.');a.equal(await field.getAttribute('aria-invalid'),'true');
 await frame('malformed-number','Submit malformed order number','Inline message; no raw validator text and no state mutation',noWrite);
 await open('99999');await visible('No order matched that number in this account. Check it and try again.');
 await frame('not-found','Search for missing #99999','Field-level not-found message; no state mutation',noWrite);
 await open('#10423');await visible('Return deadline passed');a.equal(await btn('Prepare refund preview').count(),0);
 await frame('expired-order','Find older order #10423','Expired with no preview button',noWrite);
 await open('#10421');await visible('Desk organizer');
 a.match(await page.locator('article').innerText(),/¥13\.50/);
 a.doesNotMatch(await page.locator('article').innerText(),/2026-01-02T09:/);
 await frame('order-detail','Find #10421','Item, amount, formatted dates and eligibility visible; read only',noWrite);
 for(let pass=0;pass<2;pass++){
  await btn('Prepare refund preview').click();await status.getByText('Preview prepared. Nothing has been submitted.').waitFor();
  const id='RR-'+(pass+1);
  await frame('discard-'+pass+'-preview','Open refund preview '+(pass+1),'New draft; no confirmed request',s=>{a.equal(s.data.requests.find(r=>r.id===id).status,'draft');return id+' draft';});
  await btn('Discard preview').click();await status.getByText('Preview discarded. No refund request was submitted.').waitFor();
  await frame('discard-'+pass+'-result','Discard preview','Draft becomes discarded without a confirmed request',s=>{a.equal(s.data.requests.find(r=>r.id===id).status,'discarded');a.equal(s.data.requests.filter(r=>r.order_id==='order-1'&&r.status==='confirmed').length,0);return id+' discarded; confirmed count 0';});
 }
 for(let pass=0;pass<2;pass++){
  await reset();
  await open('#10422');await btn('Review preview').click();await btn('Confirm refund request').waitFor();
  if(!pass)await frame('cutoff-before','Review seeded draft for #10422','Eligible before advancing to the deadline',noWrite);
  await forward('browser-cutoff');
  await btn('Confirm refund request').click();await visible('The workspace changed. Refresh and review before retrying.');
  if(!pass)await frame('cutoff-stale','After Infra advances clock, click old confirmation','Inline stale rejection; draft remains unchanged',noWrite);
  await btn('Refresh view').click();await visible('Return deadline passed');a.equal(await btn('Confirm refund request').count(),0);
  if(!pass)await frame('cutoff-refreshed','Refresh after stale denial','Expired and no confirm control; business records unchanged',noWrite);
  a.deepEqual((await snap()).snapshot.data,base.snapshot.data);
 }
 await reset();
 await open('#10421');
 for(let pass=0;pass<2;pass++){
  await btn('Prepare refund preview').click();await btn('Confirm refund request').click();
  await status.getByText('Synthetic request recorded. No money was returned.').waitFor();
  const id='RR-'+(pass+1);
  await frame('cancel-'+pass+'-confirmed','Confirm the '+(pass+1)+' refund request','Current request is confirmed',s=>{a.equal(s.data.requests.find(r=>r.id===id).status,'confirmed');return id+' confirmed';});
  await btn('Cancel request…').click();
  await frame('cancel-'+pass+'-prompt','Open cancellation confirmation','Prompt visible; request still confirmed',s=>{a.equal(s.data.requests.find(r=>r.id===id).status,'confirmed');return id+' still confirmed';});
  await btn('Confirm cancellation').click();await status.getByText('Synthetic request cancelled.').waitFor();
  await frame('cancel-'+pass+'-result','Confirm cancellation','Same-clock previously cancelled request does not block this attempt',s=>{a.equal(s.data.requests.find(r=>r.id===id).status,'cancelled');a.equal(s.virtual_now,base.snapshot.virtual_now);return id+' cancelled, clock unchanged';});
  await btn('Order detail').click();await btn('Prepare refund preview').waitFor();
 }
 await reset();
 await open('#10422');await btn('Review preview').click();await btn('Confirm refund request').click();
 await status.getByText('Synthetic request recorded. No money was returned.').waitFor();
 await forward('browser-after-confirm');await btn('Refresh view').click();await visible('Confirmed');
 await frame('confirmed-after-cutoff','Advance past deadline after confirmation, then refresh','Request remains confirmed',s=>{a.equal(s.data.requests.find(r=>r.id==='request-1').status,'confirmed');return 'request-1 confirmed after deadline';});
 await btn('Cancel request…').click();await btn('Confirm cancellation').click();await status.getByText('Synthetic request cancelled.').waitFor();
 a.equal((await snap()).snapshot.data.requests.find(r=>r.id==='request-1').status,'cancelled');
 await open('#10426');await btn('View request 1 · dispatched').click();await visible('Dispatched requests cannot be cancelled.');
 a.equal(await btn('Cancel request…').count(),0);
 await frame('dispatched','Open dispatched request','Status stays dispatched; no cancellation button',s=>{a.equal(s.data.requests.find(r=>r.id==='request-4').status,'dispatched');return 'request-4 dispatched';});
 await reset();await open('#10421');await btn('Prepare refund preview').waitFor();
 await frame('reset','Reset through independent Infra, then look up again','Baseline and clock restored',noWrite);
 a.deepEqual(errors,[]);
 if(out)fs.writeFileSync(path.join(out,'sequence.json'),JSON.stringify({chromium:b.version(),viewport,run,steps},null,2)+'\n');
 console.log('PASS: actual Chromium and independent Infra checks for lookup, malformed/missing order, two same-clock discards and cancellations, stale expiry, confirmed-after-deadline, dispatch cutoff and reset/replay.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await Promise.allSettled([b?.close(),i?.close()]);await h?.close();p?.cleanup();});
