import {el} from '/shared/client.js';
const root=document.querySelector('#app');
const stage=el('article',{class:'detail','aria-label':'Study workspace'});
const notice=el('p',{role:'status','aria-live':'polite'},'Connecting…');
const nav=el('nav',{'aria-label':'Study navigation'});
root.replaceChildren(el('h1',{},'Language Study Workspace'),nav,notice,stage);
let csrf='',allow=[],section='Queue',serial=0;
async function request(url,method='GET',value){
  const r=await fetch(url,{method,headers:method==='POST'?{'Content-Type':'application/json','X-Pale-CSRF':csrf}:{},...(method==='POST'?{body:JSON.stringify(value)}:{})});
  const out=await r.json();
  if(!r.ok)throw Error(out.error||'Connection failed');
  return out;
}
async function call(name,args={}){
  const r=await request('/api/call','POST',{name:'study.'+name,arguments:args});
  if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{code:r.status});
  return r;
}
function button(label,fn){return el('button',{type:'button',onclick:()=>fn().catch(err=>{notice.textContent=err.message;})},label);}
function list(items){return el('ul',{},items.map(s=>el('li',{},s)));}
async function show(next=section){
  section=next;const token=++serial;stage.replaceChildren();notice.textContent='Reading study state…';
  const title=el('h2',{},section);
  if(section==='Decks'){
    const data=await call('list_cards'); if(token!==serial)return;
    stage.replaceChildren(title,...data.decks.map(deck=>el('section',{},el('h3',{},deck.name),list(data.cards.filter(c=>c.deck_id===deck.id).map(c=>c.prompt)))));
  }else if(section==='Plan'){
    const {plan}=await call('get_plan');if(token!==serial)return;
    stage.replaceChildren(title,list(['Target: study day '+plan.target_day,'Daily review limit: '+plan.daily_limit,'New-card limit: '+plan.new_limit]));
  }else if(section==='History'){
    const {history}=await call('get_history');if(token!==serial)return;
    stage.replaceChildren(title,history.length?list(history.map(r=>r.card_id+' · day '+r.day+' · '+r.rating+' · due day '+r.due_day)):el('p',{},'No reviews recorded.'));
  }else{
    const q=await call('get_queue');if(token!==serial)return;
    const form=el('section',{'aria-label':'Review card'});
    const rows=el('ul',{},q.cards.map(c=>el('li',{},c.prompt,' ',button('Reveal '+c.prompt,async()=>{
      const seq=++serial;
      form.replaceChildren();
      const r=await call('reveal',{card_id:c.id});
      if(seq!==serial)return;
      const pending=new Map();
      const controls=el('div',{class:'actions'});
      if(allow.includes('study.record_review')){
        for(const rating of ['Again','Good'])controls.append(button(rating,async()=>{
          const args=pending.get(rating)||{card_id:r.card_id,card_version:r.card_version,review_day:r.review_day,rating,expected_version:r.version,request_id:crypto.randomUUID()};
          pending.set(rating,args);
          for(const b of rows.querySelectorAll('button'))b.disabled=true;
          for(const b of controls.querySelectorAll('button'))b.disabled=true;
          try{await call('record_review',args);}
          catch(err){
            if(!err.code){for(const b of controls.querySelectorAll('button')){if(b.textContent===rating)b.disabled=false;}}
            throw err;
          }finally{for(const b of rows.querySelectorAll('button'))b.disabled=false;}
          if(seq===serial){await show('Queue');notice.textContent='Recorded: '+rating;}
        }));
      }else controls.append(el('p',{},'Rating is disabled by the current study policy.'));
      form.replaceChildren(el('h3',{},c.prompt),el('p',{},r.answer),controls);
    }))));
    stage.replaceChildren(title,el('p',{},'Study day '+q.day+' · '+q.remaining+' review slots and '+q.new_remaining+' new-card slots left'),q.cards.length?rows:el('p',{},'No eligible cards.'),form);
  }
  notice.textContent='Study state loaded.';
}
async function init(){
  const access=new URLSearchParams(location.hash.slice(1)).get('access');
  if(access){history.replaceState(null,'',location.pathname);({csrf}=await request('/session','POST',{token:access}));}
  else ({csrf}=await request('/session'));
  allow=(await request('/api/tools')).tools.map(t=>t.name);
  nav.replaceChildren(...['Decks','Plan','Queue','History'].map(s=>button(s,()=>show(s))),button('Refresh',()=>show()));
  await show();
}
init().catch(err=>{notice.textContent=err.message;});
