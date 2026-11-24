'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PALE_PLAYWRIGHT_MODULE||'playwright');
const root=process.env.PALE_RUNTIME_ROOT, APP='community-lending-library';
if(!root)throw Error('Set PALE_RUNTIME_ROOT');
const {prepare}=require(path.join(root,'prepare.cjs')),{start}=require(path.join(root,'web/server.cjs')),{Client}=require(path.join(root,'client.cjs'));
async function main(){
 const p=prepare(path.resolve(__dirname,'..')),run='lending-visual',stateDir=p.root+'/visual';
 let host,infra,browser;
 try{
  host=await start({app:APP,registry:p.registry,run,stateDir,profile:'sandbox'});
  infra=new Client(APP,'infra',run,stateDir,'lending-browser-infra',{registry:p.registry,initialProfile:'sandbox'});
  await infra.initialize();
  browser=await chromium.launch({chromiumSandbox:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const page=await browser.newPage({viewport:{width:1024,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const press=label=>page.getByRole('button',{name:label,exact:true}).click();
  const text=str=>page.getByText(str,{exact:false}).first().waitFor({state:'visible'});
  const data=async()=>infra.call('env.snapshot');
  const desk=async(operation,attempt,outcome,event_id)=>{
   const d=await data();
   const receipt=await infra.call('env.apply_event',{expected_version:d.version,event:{event_id,at:d.snapshot.virtual_now,operation:APP+'.desk_outcome',payload:{operation,attempt,outcome,member_id:'M1',copy_id:'C4'}}});
   assert.equal(receipt.status,'committed',JSON.stringify(receipt));return receipt;
  };
  await page.goto(host.accessUrl);await page.getByRole('heading',{name:'Catalog',exact:true}).waitFor();
  await press('Open Measuring tape');
  await press('Preview hold C1');
  await press('Discard preview');
  assert.equal((await data()).snapshot.data.holds.length,1);
  await press('Preview hold C1');
  await press('Confirm hold');
  await text('Hold confirmed');
  assert.equal((await data()).snapshot.data.holds.length,2);
  await press('Holds and queue');
  await press('Request checkout H1');
  await text('Checkout requested');
  await press('Activity and receipts');await text('attempt 2 · pending');
  await press('Current loans');await text('No loans on this member’s record');
  await desk('checkout',2,'accepted','browser-checkout');
  await press('Refresh');await text('L2 · C4 · open');
  await press('Preview renewal L2');await text('Proposed due:');
  const before=await data();assert.equal(before.snapshot.data.loans.at(-1).renewed,false);
  await press('Confirm renewal');await text('Renewal confirmed');
  assert.equal((await data()).snapshot.data.loans.at(-1).renewed,true);
  await press('Request return L2');await text('Return requested');
  assert.equal((await data()).snapshot.data.loans.at(-1).returned_at,null);
  await desk('return',1,'accepted','browser-return');
  await press('Refresh');await text('L2 · C4 · returned');
  await press('Activity and receipts');
  await text('browser-checkout');await text('browser-return');
  assert.deepEqual(errors,[]);
  console.log('PASS: actual Chromium five views, discarded/confirmed hold, desk-gated checkout/return, renewal and receipt read-back; no JS errors.');
 }finally{await browser?.close();await infra?.close();await host?.close();p.cleanup();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
