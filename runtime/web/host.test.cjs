'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {start}=require('./server.cjs');
test('business web boundary: session, origin, fixed role, no hidden files, policy and persisted state',async()=>{
  const stateDir=fs.mkdtempSync(path.join(os.tmpdir(),'pale-web-boundary-'));let host;
  try{
    host=await start({app:'notes',stateDir});
    const post=(route,body,headers={})=>fetch(host.url+route,{method:'POST',headers:{Origin:host.url,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    assert.equal((await fetch(host.url+'/api/tools')).status,401);
    assert.equal((await post('/session',{token:'wrong'})).status,403);
    const login=await post('/session',{token:new URLSearchParams(host.accessUrl.split('#')[1]).get('access')});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0],{csrf}=await login.json();
    const headers={Cookie:cookie,'X-Pale-CSRF':csrf};
    assert.equal((await post('/api/call',{name:'notes.list',arguments:{}},{Cookie:cookie})).status,403);
    assert.equal((await post('/api/call',{name:'notes.list',arguments:{}},{...headers,Origin:'https://untrusted.invalid'})).status,403);
    for(const name of ['env.snapshot','env.reset','env.load_seed','env.apply_event'])assert.equal((await post('/api/call',{name,arguments:{}},headers)).status,403);
    assert.equal((await post('/api/call',{name:'notes.list',arguments:{},role:'infra'},headers)).status,400);
    for(const route of ['/api/infra/notes','/fixtures/minimal.json','/.state/web-demo/notes.json','/src/operations.cjs'])assert.equal((await fetch(host.url+route,{headers:{Cookie:cookie}})).status,404);
    const listed=await (await post('/api/call',{name:'notes.list',arguments:{}},headers)).json();
    const args={title:'Browser boundary note',expected_version:listed.version,request_id:'web-test'};
    const written=await (await post('/api/call',{name:'notes.create',arguments:args},headers)).json();
    assert.equal(written.status,'committed');
    assert.equal((await (await post('/api/call',{name:'notes.create',arguments:args},headers)).json()).duplicate,true);
    assert.equal((await (await post('/api/call',{name:'notes.create',arguments:{...args,title:'Stale',request_id:'different'}},headers)).json()).status,'stale_version');
    await host.close();host=null;
    host=await start({app:'notes',stateDir,profile:'scenario'});
    // Restart cannot reset state or silently replace the existing profile.
    const r=await host.client.call('notes.list');
    assert.ok(r.items.some(x=>x.title==='Browser boundary note'));
    await host.close();host=null;
    host=await start({app:'notes',stateDir,run:'restricted',profile:'scenario'});
    const denied=await host.client.call('notes.create',{title:'Forbidden',expected_version:(await host.client.call('notes.list')).version,request_id:'deny'});
    assert.equal(denied.status,'permission_denied');
  }finally{await host?.close();fs.rmSync(stateDir,{recursive:true,force:true});}
});
