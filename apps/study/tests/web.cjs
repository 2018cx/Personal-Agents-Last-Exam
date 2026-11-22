'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PALE_PLAYWRIGHT_MODULE||'playwright');
const runtime=process.env.PALE_RUNTIME_ROOT||path.resolve(__dirname,'../../../runtime');
const {prepare}=require(path.join(runtime,'prepare.cjs'));
const {start}=require(path.join(runtime,'web/server.cjs'));
async function run(){
 const stateDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-browser-'));
 const assembly=prepare(path.resolve(__dirname,'..'));
 const hosts=[]; let browser;
 try{
  const host=await start({app:'study',registry:assembly.registry,run:'study-browser',stateDir});hosts.push(host);
  const restricted=await start({app:'study',registry:assembly.registry,profile:'scenario',run:'study-restricted',stateDir});hosts.push(restricted);
  browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,chromiumSandbox:true}:{chromiumSandbox:true});
  const context=await browser.newContext({viewport:{width:850,height:730}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host.accessUrl);
  await page.getByRole('heading',{name:'Queue',exact:true}).waitFor();
  assert.equal(await page.getByText('estación de tren',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Decks',exact:true}).click();
  await page.getByRole('heading',{name:'Travel Spanish',exact:true}).waitFor();
  await page.getByRole('button',{name:'Plan',exact:true}).click();
  await page.getByText('Daily review limit: 3',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Queue',exact:true}).click();
  await page.getByRole('button',{name:'Reveal Train station',exact:true}).click();
  await page.getByText('estación de tren',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Good',exact:true}).click();
  await page.getByText('Recorded: Good',{exact:true}).waitFor();
  await page.getByRole('button',{name:'History',exact:true}).click();
  await page.getByText('C1 · day 0 · Good · due day 3',{exact:true}).waitFor();
  assert.equal((await host.client.call('study.get_history')).history.length,1);
  await page.reload();
  await page.getByRole('heading',{name:'Queue',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Reveal Train station',exact:true}).count(),0);
  await page.getByRole('button',{name:'Reveal Open today',exact:true}).click();
  await page.getByRole('button',{name:'Again',exact:true}).waitFor();
  // A different real Agent caller commits after this page opened its form.
  const other=await host.client.call('study.reveal',{card_id:'C2'});
  const out=await host.client.call('study.record_review',{card_id:other.card_id,card_version:other.card_version,review_day:other.review_day,rating:'Again',request_id:'other-session',expected_version:other.version});
  assert.equal(out.status,'committed');
  await page.getByRole('button',{name:'Good',exact:true}).click();
  await page.getByText('The observed version is stale; read the current state before retrying.',{exact:true}).waitFor();
  assert.equal((await host.client.call('study.get_history')).history.length,2);
  await page.reload();
  await page.getByRole('heading',{name:'Queue',exact:true}).waitFor();
  await page.getByRole('button',{name:'History',exact:true}).click();
  const {card_id,day,rating,due_day}=out.review;
  await page.getByText(`${card_id} · day ${day} · ${rating} · due day ${due_day}`,{exact:true}).waitFor();
  await page.getByRole('button',{name:'History',exact:true}).click();
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await page.getByText('C2 · day 0 · Again · due day 1',{exact:true}).waitFor();
  await page.goto(restricted.accessUrl);
  await page.getByRole('button',{name:'Reveal Train station',exact:true}).click();
  await page.getByText('Rating is disabled by the current study policy.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Good',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('Web Host browser: decks, plan, reveal, explicit rating, history, independent write after reload, stale form and restricted policy passed.');
 }finally{
  await browser?.close();await Promise.all(hosts.map(h=>h.close()));assembly.cleanup();fs.rmSync(stateDir,{recursive:true,force:true});
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
