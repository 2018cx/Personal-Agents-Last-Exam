import {el} from '/shared/client.js';
const root=document.querySelector('#app'),area=el('section',{class:'detail','aria-label':'Subscription workspace'}),message=el('p',{role:'status','aria-live':'polite'}),nav=el('nav',{class:'actions','aria-label':'Navigation'});
root.replaceChildren(el('header',{class:'contact-hero'},el('div',{},el('p',{class:'kicker'},'ECHO ARBOR'),el('h1',{},'Subscription Exit'),el('p',{class:'muted'},'Manage a fictional plan. No payments or live subscriptions.'))),nav,area);
Object.assign(root.style,{width:'min(100%, 62rem)',margin:'0 auto',padding:'clamp(1rem, 4vw, 2.5rem)'});
const prefix='subscription-exit.', names={paid_active:'Paid · active',cancellation_scheduled:'Paid until scheduled end',free:'Free · paid access ended'};
const labels={cancel:'Cancellation scheduled',revoke:'Cancellation withdrawn'};
const fmt=new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeStyle:'short'});
const dateFmt=new Intl.DateTimeFormat('en-US',{dateStyle:'long'});
const date=t=>dateFmt.format(new Date(t)), time=t=>fmt.format(new Date(t));
let csrf,allowed=new Set(),selected=null,receiptId=null,view='Overview',generation=0,writing=false;
const say=s=>{message.textContent=s;},button=(label,fn)=>el('button',{type:'button',onclick:()=>Promise.resolve().then(fn).catch(e=>say(friendly(e)))},label);
const possible=n=>allowed.has(prefix+n);
const friendly=e=>({
 stale_version:'The workspace changed. Refresh and review the current subscription.',
 stale_preview:'That preview is out of date. Refresh and start a new preview if needed.',
 period_outside_scenario:'The last modeled billing period has ended. No further change can be scheduled here.',
 cancellation_already_scheduled:'A cancellation is already scheduled for this plan.',
 no_pending_cancellation:'There is no scheduled cancellation to withdraw.',
 free_account:'Paid access already ended. There is no subscription to cancel.',
 not_found:'This subscription item is no longer available.',
 permission_denied:'This account view does not allow that action.',
 not_open:'This preview was already closed.',
 already_confirmed:'This change was already confirmed. Check Status and receipts.'
}[e.code]||'The change could not be completed. Refresh to check your subscription before trying again.');
async function http(url,data){
 const r=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json','X-Pale-CSRF':csrf||''},body:JSON.stringify(data)}:{});
 if(!r.ok)throw Error('The Web Host did not acknowledge this operation.');
 return r.json();
}
async function call(op,args={}){
 if(!possible(op))throw Object.assign(Error(),{code:'permission_denied',confirmedError:true});
 const r=await http('/api/call',{name:prefix+op,arguments:args});
 if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{confirmedError:true,code:r.status});
 return r;
}
function card(label,...content){
 const node=el('article',{},el('p',{class:'kicker'},label),...content);
 Object.assign(node.style,{padding:'1.35rem',marginBlock:'0.85rem',border:'1px solid var(--line)',borderRadius:'0.85rem',background:'#f9fbff'});
 return node;
}
function available(x){
 const e=x.entitlement;
 return e.access==='paid'&&(!e.transition_consumed||Date.parse(x.virtual_now)<Date.parse(e.period_end));
}
function statusBlock(x,plan){
 const e=x.entitlement;
 const title=el('h3',{},plan?(e.access==='paid'?plan.name+' plan':'Free plan'):'Plan status');
 const detail=e.entitlement==='free'?'Paid access ended on '+date(e.effective_end)+'.':e.entitlement==='cancellation_scheduled'?'Your paid access continues until '+date(e.effective_end)+'.':'Current billing period ends '+date(e.period_end)+'.';
 const cardNodes=[title,el('p',{class:'tag'},names[e.entitlement]),el('p',{},detail)];
 if(plan&&e.access==='paid'){
   const amount=new Intl.NumberFormat('en-US',{style:'currency',currency:plan.currency,currencyDisplay:'code'}).format(plan.renewal_minor/100);
   cardNodes.push(el('p',{class:'muted'},amount+' per modeled period · no charge is made'));
 }
 if(e.entitlement==='paid_active'&&e.transition_consumed&&!available(x))cardNodes.push(el('p',{class:'muted'},'The final modeled billing period has ended. This workspace does not simulate a later renewal or cancellation.'));
 const saved=card('YOUR LIBRARY',el('h3',{},'Saved entries'),el('ul',{},e.saved.map(v=>el('li',{},v.title))));
 return [card('YOUR PLAN',...cardNodes),saved];
}
function write(bar,label,op,args,version,token,done){
 if(!possible(op))return;
 let pending;const b=button(label,async()=>{
  if(writing||token!==generation)return;
  pending??={...args,expected_version:version,request_id:crypto.randomUUID()};
  writing=true;for(const node of bar.querySelectorAll('button'))node.disabled=true;
  try{const out=await call(op,pending);if(generation===token)await done(out);}
  catch(e){
   if(generation!==token)return;
   if(e.confirmedError){say(friendly(e));return;}
   for(const node of bar.querySelectorAll('button'))node.disabled=false;
   b.textContent='Retry '+label;say('No acknowledgement. Retry the same request, or refresh to check its result.');
  }finally{writing=false;}
 });b.classList.add('primary');bar.append(b);
}
async function display(target=view,notice=''){
 view=target;const token=++generation;
 for(const b of nav.querySelectorAll('[data-view]')){
   if(b.dataset.view===target)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
 area.replaceChildren(el('h2',{},target),message);say('');
 try{
  const x=await call(target==='Overview'?'read_plan':'read_status');if(token!==generation)return;
  const bar=el('div',{class:'actions'});
  if(target==='Overview'){
   area.append(...statusBlock(x,x.plan));
   const action=x.entitlement.entitlement==='cancellation_scheduled'?'revocation':'cancellation';
   if(available(x))write(bar,'Prepare '+action,'prepare_'+action,{},x.version,token,async r=>{selected=r.preview.id;await display('Preview','Preview prepared. No entitlement change.');});
  }else if(target==='Preview'){
   const p=x.open_previews.find(p=>p.id===selected);
   if(p){
    area.append(card('REVIEW CHANGE',el('h3',{},p.action==='cancel'?'Review cancellation':'Review withdrawal'),el('p',{},p.action==='cancel'?'Your paid access will continue until '+date(x.entitlement.period_end)+'. Your saved entries will stay in your library.':'Withdraw the scheduled cancellation and keep paid access through the billing boundary.')));
    write(bar,p.action==='cancel'?'Confirm cancellation':'Confirm revocation','confirm',{preview_id:p.id},x.version,token,async r=>{receiptId=r.receipt.id;await display('Status and receipts','Confirmation recorded.');});
    write(bar,'Abandon preview','abandon',{preview_id:p.id},x.version,token,async()=>{selected=null;await display('Status and receipts','Preview abandoned. No entitlement change.');});
   }else{
    area.append(...statusBlock(x),el('p',{},selected?'That preview is no longer current. Start again from Overview.':'No current preview selected.'));
    for(const p of x.open_previews)bar.append(button('Open preview '+p.id,()=>{selected=p.id;return display('Preview');}));
   }
  }else{
   area.append(...statusBlock(x));
   if(receiptId){
    const r=await call('read_receipt',{receipt_id:receiptId});if(token!==generation)return;
    area.append(card('CONFIRMATION',el('h3',{},labels[r.receipt.action]),el('p',{},'Confirmed '+time(r.receipt.confirmed_at)+'.'),el('p',{},'Billing boundary: '+date(r.receipt.effective_at)),el('p',{class:'muted'},'Receipt reference '+r.receipt.id)));
   }
   for(const receipt of x.receipts)bar.append(button('View receipt '+receipt.id,()=>{receiptId=receipt.id;return display('Status and receipts');}));
  }
  area.append(bar,message);if(notice)say(notice);
 } catch(e){if(token===generation)say(friendly(e));}
}
async function init(){
 const token=new URLSearchParams(location.hash.slice(1)).get('access');if(token)history.replaceState(null,'',location.pathname);
 ({csrf}=await http('/session',token?{token}:undefined));
 allowed=new Set((await http('/api/tools')).tools.map(t=>t.name));
 for(const page of ['Overview','Preview','Status and receipts']){
  const b=button(page,()=>display(page));b.dataset.view=page;nav.append(b);
 }
 nav.append(button('Refresh view',()=>display()));await display();
}
init().catch(e=>{area.append(message);say(friendly(e));});
