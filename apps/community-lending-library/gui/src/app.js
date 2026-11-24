import {el} from '/shared/client.js';
const app='community-lending-library.', root=document.querySelector('#app');
const nav=el('nav',{'aria-label':'Lending views'}),status=el('p',{role:'status','aria-live':'polite'},'Connecting…'),stage=el('article',{class:'detail','aria-label':'Lending workspace'});
root.replaceChildren(el('h1',{},'Community Lending Library'),el('p',{},'Fictional single-location cooperative. No fees, shipping, or real handovers.'),nav,status,stage);
const pages=['Catalog','Item','Holds and queue','Current loans','Activity and receipts'];
let csrf, tools=new Set(), page='Catalog', selection=null, serial=0;
const say=text=>{status.textContent=text;};
const supported=n=>tools.has(app+n);
const p=text=>el('p',{},text);
const button=(label,fn,t)=>el('button',{type:'button',onclick:()=>Promise.resolve().then(fn).catch(e=>{if(t==null||t===serial)say(e.message);})},label);
const panel=(heading,...children)=>el('section',{},el('h3',{},heading),...children);
const rows=(items,empty)=>items.length?el('ul',{},items.map(item=>el('li',{},item))):p(empty);
async function request(path,body){
 const post=body!==undefined;
 const response=await fetch(path,{method:post?'POST':'GET',headers:post?{'Content-Type':'application/json','X-Pale-CSRF':csrf}:{},...(post?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok)throw Object.assign(Error(data.error||'Request failed'),{code:'http_error'});
 return data;
}
async function call(name,args={}){
 if(!supported(name))throw Object.assign(Error('Not permitted by this profile.'),{code:'unavailable'});
 const r=await request('/api/call',{name:app+name,arguments:args});
 if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{code:r.status});
 return r;
}
function action(target,label,name,args,version,t,message){
 if(!supported(name))return;
 let sending=false,done=false,attempt;
 const go=button(label,async()=>{
  if(t!==serial||!target.isConnected||sending||done)return;
  attempt??={...args,expected_version:version,request_id:crypto.randomUUID()};
  sending=true;
  const locks=[...stage.querySelectorAll('button')].filter(b=>!b.disabled||b.dataset.locked==='yes');
  for(const b of locks){b.disabled=true;b.dataset.locked='yes';}
  let uncertain=false;
  try{
   await call(name,attempt);done=true;
   if(t===serial&&target.isConnected)await show(page,message);
  }catch(e){
   if(e.code){done=true;if(t===serial)say(e.message);}
   else if(t===serial){uncertain=true;go.textContent='Retry '+label;say('No receipt received. Retry the same request or refresh and verify before sending a new one.');}
  }finally{
   sending=false;
   if(uncertain)go.disabled=false;
   else for(const b of locks){b.disabled=false;delete b.dataset.locked;}
   if(done)go.disabled=true;
  }
 },t);target.append(go);
}
function planned(target,start,label,explain,name,args,version,t,message){
 if(!supported(name))return;
 target.append(button(start,()=>{
  const review=el('div',{class:'actions'},p(explain));
  action(review,label,name,args,version,t,message);
  review.append(button('Discard preview',()=>{review.remove();say('Preview discarded; nothing was submitted.');},t));
  target.querySelector('[data-preview]')?.remove();review.dataset.preview='';target.append(review);
 },t));
}
function itemLine(i){return i.name+' · '+i.available+' available · '+i.queue_length+' waiting'+(i.your_position==null?'':' · your position '+i.your_position);}
const pick=id=>{selection=id;return show('Item');};
let query='';
async function show(next=page,message){
 page=next;const t=++serial;
 for(const b of nav.querySelectorAll('[data-page]')){
  if(b.dataset.page===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
 const title=el('h2',{},page);stage.replaceChildren(title);say('Reading current lending state…');
 const mount=(...nodes)=>{if(t===serial){stage.replaceChildren(title,...nodes);say(message||'Lending state loaded.');}};
 try{
  if(page==='Catalog'){
   const data=await call('search_items',query.trim()?{query:query.trim()}:{});if(t!==serial)return;
   const search=el('input',{type:'search','aria-label':'Search catalog',maxlength:160,value:query});
   const form=el('form',{},search,el('button',{type:'submit'},'Search'));
   form.addEventListener('submit',e=>{e.preventDefault();query=search.value;show('Catalog');});
   mount(form,rows(data.items.map(i=>el('div',{},itemLine(i),' ',button('Open '+i.name,()=>pick(i.id),t))),'No matching items.'));
  } else if(page==='Item'){
   if(!selection){mount(p('Open an item from Catalog.'));return;}
   const d=await call('get_item',{item_id:selection});if(t!==serial)return;
   const i=d.item, operations=el('div',{class:'actions'});
   if(!i.available&&i.your_position==null)action(operations,'Join waitlist','join_queue',{item_id:i.id},d.version,t,'Your queue entry was recorded.');
   if(i.your_position!==null)action(operations,'Leave waitlist','leave_queue',{item_id:i.id},d.version,t,'You left this item’s waitlist.');
   const copies=d.copies.map(c=>{
    const view=el('div',{},c.id+' · '+c.status.replace('_',' '));
    if(c.status==='available')planned(view,'Preview hold '+c.id,'Confirm hold','Hold only '+i.name+' copy '+c.id+' for one simulated day.','confirm_hold',{item_id:i.id,copy_id:c.id},d.version,t,'Hold confirmed. Checkout still needs a simulated desk receipt.');
    return view;
   });
   mount(panel(i.name,p(itemLine(i)),p('At most two copies; one-day holds; seven-day loans; one three-day renewal if eligible and nobody else is waiting.'),rows(copies,'There are no copies of this item.'),operations));
  } else if(page==='Holds and queue'){
   const d=await call('list_holds');if(t!==serial)return;
   const entries=d.holds.map(h=>{
    const view=el('div',{},h.id+' · '+h.copy_id+' · '+h.status+' · expires '+h.expires_at);
    if(h.status==='open'){
      action(view,'Request checkout '+h.id,'request_checkout',{hold_id:h.id},d.version,t,'Checkout requested. Custody is unchanged until an accepted desk receipt.');
      planned(view,'Cancel hold '+h.id,'Confirm cancellation','Cancel this hold and its pending checkout.','cancel_hold',{hold_id:h.id},d.version,t,'Hold cancelled; pending checkout cannot be accepted.');
    }
    return view;
   });
   const queues=d.queue.map(q=>{const view=el('div',{},q.item_id+' · position '+q.position+' of '+q.length);action(view,'Leave waitlist '+q.item_id,'leave_queue',{item_id:q.item_id},d.version,t,'You left this item’s waitlist.');return view;});
   mount(panel('Your holds',rows(entries,'No holds.')),panel('Your queue positions',rows(queues,'You are not waiting for any item.')));
  } else if(page==='Current loans'){
   const d=await call('list_loans');if(t!==serial)return;
   mount(rows(d.loans.map(l=>{
    const view=el('div',{},l.id+' · '+l.copy_id+' · '+(l.returned_at?'returned '+l.returned_at:(l.overdue?'overdue':'open')+' · due '+l.due_at));
    if(!l.returned_at){
     const rev=el('div',{});view.append(rev);
     rev.append(button('Preview renewal '+l.id,async()=>{
      const r=await call('preview_renewal',{loan_id:l.id});if(t!==serial||!rev.isConnected)return;
      const review=el('div',{class:'actions'},p(r.eligible?'Proposed due: '+r.proposed_due_at:'Renewal unavailable: '+r.reason.replaceAll('_',' ')+'. Due date remains '+r.due_at));
      if(r.eligible)action(review,'Confirm renewal','confirm_renewal',{loan_id:l.id},r.version,t,'Renewal confirmed; current due date refreshed.');
      review.append(button('Discard preview',()=>{review.remove();say('Preview discarded; the due date was not changed.');},t));
      rev.querySelector('[data-preview]')?.remove();review.dataset.preview='';rev.append(review);
     },t));
     action(view,'Request return '+l.id,'request_return',{loan_id:l.id},d.version,t,'Return requested. Loan remains open until the desk accepts.');
    }
    return view;
   }),'No loans on this member’s record.'));
  } else {
   const d=await call('list_activity');if(t!==serial)return;
   mount(rows(d.attempts.map(r=>{
    const view=el('div',{},r.id+' · '+r.operation+' '+r.copy_id+' · attempt '+r.attempt+' · '+r.status+(r.event_id?' · desk receipt '+r.event_id:''));
    if(r.status==='pending')planned(view,'Cancel request '+r.id,'Confirm cancellation','Invalidate this request before desk acceptance.','cancel_request',{attempt_id:r.id},d.version,t,'Request cancelled; no custody change.');
    return view;
   }),'No desk requests or receipts.'));
  }
 }catch(e){if(t===serial)say(e.message);}
}
async function init(){
 const token=new URLSearchParams(location.hash.slice(1)).get('access');
 if(token){history.replaceState(null,'',location.pathname);({csrf}=await request('/session',{token}));}
 else ({csrf}=await request('/session'));
 tools=new Set((await request('/api/tools')).tools.map(t=>t.name));
 nav.replaceChildren(...pages.map(label=>{const b=button(label,()=>show(label));b.dataset.page=label;return b;}),button('Refresh',()=>show()));
 await show();
}
init().catch(e=>say(e.message));
