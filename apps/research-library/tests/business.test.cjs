'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateSeed,handleTool,applyEvent}=require('../plugin.cjs');
const s=()=>structuredClone(require('../fixtures/minimal.json'));
const c=(now='2027-01-08T08:00:00Z')=>({binding:require('../fixtures/binding.json'),role:'agent',virtual_now:now});
const b={library_id:'group-1'}, item={...b,id:'paper-17'}, event=require('../examples/scenario.json');
const call=(d,n,args,ctx=c())=>handleTool(ctx,d,'library.'+n,args).result;
const denied=(fn,code)=>assert.throws(fn,{code});
const grant=(d,e=event)=>applyEvent({...c(e.at),role:'infra'},d,e);
test('read-only search filters, author privacy and library boundaries',()=>{
 const d=s(), before=structuredClone(d);
 assert.equal(call(d,'search',{...b,query:'Avery',tag:'methods',reading_status:'reading'}).records.length,1);
 assert.deepEqual(call(d,'search',{...b,query:'missing'}).records,[]);
 assert.deepEqual(call(d,'get',item).notes,[]);
 denied(()=>call(d,'search',{library_id:'private-a'}),'permission_denied');
 denied(()=>call(d,'get',{...b,id:'private-1'}),'not_found');
 assert.deepEqual(d,before);
});
test('viewer denied, editor import must be scoped and singular',()=>{
 const d=s(), args={...b,catalog_id:'catalog-18'}, initial=structuredClone(d);
 denied(()=>call(d,'import',args),'permission_denied');assert.deepEqual(d,initial);
 grant(d);
 const {record}=call(d,'import',args);assert.equal(record.catalog_id,'catalog-18');assert.equal(record.revision,1);
 assert.deepEqual(call(d,'get',{...b,id:record.id}).record,record);
 denied(()=>call(d,'import',args),'duplicate_import');
 assert.equal(d.records.length,3);
});
test('edits advance record revision, protect author note, and reject stale or expired form',()=>{
 const d=s();grant(d);
 const {record}=call(d,'save_record',{...item,expected_record_revision:2,patch:{tags:['revised'],reading_status:'read'}});
 assert.equal(record.revision,3);
 denied(()=>call(d,'save_note',{...item,expected_record_revision:2,text:'x'}),'stale_record');
 assert.equal(call(d,'save_note',{...item,expected_record_revision:3,text:'My note'}).note.author,'b');
 assert.deepEqual(call(d,'get',item).notes.map(n=>n.text),['My note']);
 assert.equal(d.notes[0].text,'Check method');
 const before=structuredClone(d);
 denied(()=>call(d,'save_record',{...item,expected_record_revision:4,patch:{title:'Late'}},c('2027-01-08T12:00:00Z')),'session_expired');
 assert.deepEqual(d,before);
});
test('seed rejects broken references and duplicate scope',()=>{
 const d=s();validateSeed(c(),d);
 d.notes.push({record_id:'missing',author:'a',text:'x'});denied(()=>validateSeed(c(),d),'invalid_seed');
 const bad=s();bad.records.push({...bad.records[0],id:'dup'});denied(()=>validateSeed(c(),bad),'invalid_seed');
});
test('permission change cannot be invoked by Agent and leaves other grants intact',()=>{
 const d=s();denied(()=>applyEvent(c(),d,event),'invalid_event');
 const initial=structuredClone(d.libraries[1]);grant(d);
 assert.deepEqual(d.libraries[1],initial);
 denied(()=>grant(d,{...event,payload:{...event.payload,principal_id:'missing'}}),'invalid_event');
});
