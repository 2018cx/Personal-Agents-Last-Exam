import {el} from '/shared/client.js';
const root=document.querySelector('#app'),area=el('section',{'aria-label':'Subscription workspace'}),message=el('p',{role:'status'}),nav=el('nav',{'aria-label':'Navigation'});
root.replaceChildren(el('h1',{},'Subscription Exit'),el('p',{},'Fictional data. No payments or live subscriptions.'),nav,message,area);
const prefix='subscription-exit.', names={paid_active:'Paid · active',cancellation_scheduled:'Paid until scheduled end',free:'Free · paid access ended'};
let csrf,allowed=new Set(),account='account-1',selected=null,receiptId=null,view='Overview',generation=0,writing=false;
const say=s=>{message.textContent=s;},button=(label,fn)=>el('button',{type:'button',onclick:()=>Promise.resolve().then(fn).catch(e=>say(e.message))},label);
const possible=n=>allowed.has(prefix+n);
async function http(url,data){
 const r=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json','X-Pale-CSRF':csrf||''},body:JSON.stringify(data)}:{});
 const x=await r.json();if(!r.ok)throw Error('The Web Host did not acknowledge this operation.');return x;
}
async function call(op,args={}){
 if(!possible(op))throw Error('This operation is not available to the current role.');
 const r=await http('/api/call',{name:prefix+op,arguments:{account_id:account,...args}});
 if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{confirmedError:true,code:r.status});
 return r;
}
function statusBlock(x){
 const e=x.entitlement, rows=[names[e.entitlement],'Current period: '+e.period_start+' to '+e.period_end,'Scenario time: '+x.virtual_now];
 if(e.effective_end)rows.push('Paid access ends: '+e.effective_end);
 if(e.renewal==='outside_scenario')rows.push('The next period is the last one modeled.');
 return el('section',{},el('h3',{},'Entitlement'),el('ul',{},rows.map(t=>el('li',{},t))),el('h3',{},'Saved entries'),el('ul',{},e.saved.map(v=>el('li',{},v.title))));
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
   if(e.confirmedError){say(e.code==='stale_version'?'The workspace changed. Refresh and review the current subscription.':e.message);return;}
   for(const node of bar.querySelectorAll('button'))node.disabled=false;
   b.textContent='Retry '+label;say('No acknowledgement. Retry the same request, or refresh to check its result.');
  }finally{writing=false;}
 });bar.append(b);
}
async function display(target=view,notice=''){
 view=target;const token=++generation;
 area.replaceChildren(el('h2',{},target));say('');
 if(target==='Overview'){
   const input=el('input',{id:'account',required:true,maxlength:80});input.value=account;
   const form=el('form',{},el('label',{for:'account'},'Account ID'),input,el('button',{type:'submit'},'Open account'));
   form.addEventListener('submit',e=>{e.preventDefault();const id=input.value.trim();if(id){account=id;selected=null;receiptId=null;display('Overview');}});
   area.append(form);
 }
 try{
  const x=await call(target==='Overview'?'read_plan':'read_status');if(token!==generation)return;
  const bar=el('div',{class:'actions'});
  if(target==='Overview'){
   const amount=new Intl.NumberFormat('en',{style:'currency',currency:x.plan.currency,currencyDisplay:'code'}).format(x.plan.renewal_minor/100);
   area.append(el('p',{},x.plan.service+' · '+x.plan.name+' · '+amount+' (informational only)'),statusBlock(x));
   const action=x.entitlement.entitlement==='cancellation_scheduled'?'revocation':'cancellation';
   if(!x.entitlement.transition_consumed)write(bar,'Prepare '+action,'prepare_'+action,{},x.version,token,async r=>{selected=r.preview.id;await display('Preview','Preview prepared. No entitlement change.');});
  }else if(target==='Preview'){
   const p=x.open_previews.find(p=>p.id===selected);
   if(p){
    area.append(el('p',{},p.action==='cancel'?'Schedule paid access to end at '+x.entitlement.period_end:'Keep paid access through the period boundary.'),statusBlock(x));
    write(bar,p.action==='cancel'?'Confirm cancellation':'Confirm revocation','confirm',{preview_id:p.id},x.version,token,async r=>{receiptId=r.receipt.id;await display('Status and receipts','Confirmation recorded.');});
    write(bar,'Abandon preview','abandon',{preview_id:p.id},x.version,token,async()=>{selected=null;await display('Status and receipts','Preview abandoned. No entitlement change.');});
   }else{
    area.append(statusBlock(x),el('p',{},'No current preview selected.'));
    for(const p of x.open_previews)bar.append(button('Open preview '+p.id,()=>{selected=p.id;return display('Preview');}));
   }
  }else{
   area.append(statusBlock(x));
   if(receiptId){
    const r=await call('read_receipt',{receipt_id:receiptId});if(token!==generation)return;
    area.append(el('p',{},'Receipt '+r.receipt.id+' · '+r.receipt.action+' · '+r.receipt.confirmed_at));
   }
   for(const receipt of x.receipts)bar.append(button('View receipt '+receipt.id,()=>{receiptId=receipt.id;return display('Status and receipts');}));
  }
  area.append(bar);if(notice)say(notice);
 } catch(e){
  if(token!==generation)return;
  say(e.message);
  area.append(button('Return to default account',()=>{account='account-1';return display('Overview');}));
 }
}
async function init(){
 const token=new URLSearchParams(location.hash.slice(1)).get('access');if(token)history.replaceState(null,'',location.pathname);
 ({csrf}=await http('/session',token?{token}:undefined));
 allowed=new Set((await http('/api/tools')).tools.map(t=>t.name));
 for(const page of ['Overview','Preview','Status and receipts'])nav.append(button(page,()=>display(page)));
 nav.append(button('Refresh view',()=>display()));await display();
}
init().catch(e=>say(e.message));
