'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {handleTool,validateSeed}=require('../plugin.cjs');
const start=require('../fixtures/minimal.json');
const day0={virtual_now:'2027-01-07T16:00:00Z'};
const call=(s,key,args={},ctx=day0)=>handleTool(ctx,s,'study.'+key,args).result;
const rate=(s,card_id,rating,review_day=0,ctx=day0)=>call(s,'record_review',{card_id,rating,review_day,card_version:1},ctx);
test('queue order, no visible answers, and same-day capacity',()=>{
  const s=structuredClone(start); validateSeed(day0,s);
  assert.deepEqual(call(s,'get_queue').cards.map(x=>x.id),['C1','C4','C2']);
  assert.ok(call(s,'list_cards').cards.every(x=>!Object.hasOwn(x,'answer')));
  assert.equal(call(s,'reveal',{card_id:'C2'}).answer,'asiento de ventanilla');
  assert.equal(rate(s,'C2','Again').new_remaining,0);
  assert.throws(()=>rate(s,'C3','Good'),{code:'not_eligible'});
  assert.throws(()=>rate(s,'C2','Good'),{code:'not_eligible'});
  assert.equal(rate(s,'C1','Good').review.due_day,3);
  assert.equal(rate(s,'C4','Good').review.due_day,7);
  assert.equal(call(s,'get_queue').remaining,0);
  assert.equal(call(s,'get_history').history.length,3);
});
test('midnight, skipped days, overdue and stale form',()=>{
  const s=structuredClone(start);
  rate(s,'C1','Again');
  const day1={virtual_now:'2027-01-08T16:00:00Z'};
  assert.equal(call(s,'get_queue',{},day1).day,1);
  assert.throws(()=>rate(s,'C1','Good',0,day1),{code:'stale_review_day'});
  assert.throws(()=>call(s,'record_review',{card_id:'C1',rating:'Good',review_day:1,card_version:2},day1),{code:'stale_card'});
  const day5={virtual_now:'2027-01-13T09:00:00+08:00'};
  assert.deepEqual(call(s,'get_queue',{},day5).cards.map(x=>x.id),['C4','C1','C2']);
  assert.equal(call(s,'get_history',{},day5).history.length,1);
});
test('seed denies impossible constraints and dangling foreign references',()=>{
  const s=structuredClone(start);s.plan.new_limit=4;
  assert.throws(()=>validateSeed(day0,s),{code:'invalid_seed'});
  s.plan.new_limit=1;s.cards[1].deck_id='none';
  assert.throws(()=>validateSeed(day0,s),{code:'invalid_seed'});
});
