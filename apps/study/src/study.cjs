'use strict';
const DAY = 86400000;
const ORIGIN = Date.parse('2027-01-08T00:00:00+08:00');
const stageDelay = [1, 1, 3, 7];
function today(ctx) { return Math.floor((Date.parse(ctx.virtual_now) - ORIGIN) / DAY); }
function reject(code, message) { throw Object.assign(new Error(message), {code}); }
function queue(s, day) {
  const reviews = s.history.filter(r => r.day === day);
  const seen = new Set(reviews.map(r => r.card_id));
  const remaining = Math.max(0, s.plan.daily_limit - reviews.length);
  const newRemaining = Math.max(0, s.plan.new_limit - reviews.filter(r => r.was_new).length);
  const candidates = s.cards.filter(c => s.plan.deck_ids.includes(c.deck_id) && !seen.has(c.id));
  const byDue = (a,b) => a.due_day - b.due_day || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const due = candidates.filter(c => c.reviewed && c.due_day <= day).sort(byDue);
  const fresh = candidates.filter(c => !c.reviewed && c.due_day <= day).sort(byDue).slice(0, newRemaining);
  return { day, remaining, new_remaining:newRemaining, cards:[...due,...fresh].slice(0, remaining) };
}
function validateSeed(_ctx,s) {
  for(const xs of [s.decks,s.cards,s.history]) {
    if(new Set(xs.map(x=>x.id)).size !== xs.length) reject('invalid_seed','Duplicate record IDs');
  }
  const decks = new Set(s.decks.map(d=>d.id));
  const cards = new Map(s.cards.map(c=>[c.id,c]));
  if(s.cards.some(c=>!decks.has(c.deck_id)) || s.plan.deck_ids.some(d=>!decks.has(d)) || s.plan.new_limit>s.plan.daily_limit)
    reject('invalid_seed','Invalid plan or deck relationship');
  if(new Set(s.history.map(r=>JSON.stringify([r.card_id,r.day]))).size!==s.history.length ||
    s.history.some(r=>!cards.get(r.card_id)?.reviewed))
    reject('invalid_seed','Invalid history relationship');
}
function handleTool(ctx,s,name,a) {
  const day=today(ctx); const q=()=>queue(s,day);
  let result;
  switch(name){
    case 'study.list_cards': result={decks:s.decks,cards:s.cards.map(({answer,...c})=>c)}; break;
    case 'study.get_plan': result={plan:s.plan}; break;
    case 'study.get_queue': {
      const {cards,...limits}=q();result={...limits,cards:cards.map(({answer,...c})=>c)};break;
    }
    case 'study.get_history': result={history:s.history};break;
    case 'study.reveal': {
      const card=q().cards.find(c=>c.id===a.card_id);
      if(!card) reject('not_eligible','Card is not eligible in this queue');
      result={card_id:card.id,card_version:card.card_version,answer:card.answer,review_day:day}; break;
    }
    case 'study.record_review': {
      if(a.review_day!==day) reject('stale_review_day','Reveal the card again on the current study day');
      const card=q().cards.find(c=>c.id===a.card_id);
      if(!card) reject('not_eligible','Card is not eligible in this queue');
      if(a.card_version!==card.card_version) reject('stale_card','Card version changed');
      const was_new=!card.reviewed;
      card.stage=a.rating==='Good'?Math.min(3,card.stage+1):0;
      card.due_day=day+stageDelay[card.stage]; card.reviewed=true;
      const review={id:'review:'+require('node:crypto').createHash('sha256').update(JSON.stringify([card.id,day])).digest('hex').slice(0,32),card_id:card.id,day,rating:a.rating,was_new,stage:card.stage,due_day:card.due_day};
      s.history.push(review);
      result={review,remaining:q().remaining,new_remaining:q().new_remaining};break;
    }
    default: reject('unknown_tool','Unknown study operation');
  }
  return {data:s,result:{status:'ok',...result}};
}
module.exports={handleTool,validateSeed,applyEvent(){reject('invalid_event','No incoming events in v1');},
  records:s=>s.cards,objects:s=>[...s.cards,...s.decks,s.plan].map(x=>x.id),references:()=>[]};
