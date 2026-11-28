import {el} from '/shared/client.js';
const root=document.querySelector('#app'),stage=el('section',{'aria-label':'Refund request workspace'}),status=el('p',{role:'status','aria-live':'polite',class:'tag'}),nav=el('nav',{class:'actions','aria-label':'Navigation'});
status.hidden=true;status.classList.remove('tag');
root.replaceChildren(
 el('header',{class:'toolbar'},el('div',{class:'brand'},el('span',{class:'brand-mark','aria-hidden':'true'},'↶'),el('div',{},el('h1',{},'Refund-only Returns'),el('small',{},'Paperfield Goods · fictional storefront')))),
 el('section',{class:'detail'},el('article',{},nav,el('div',{class:'tags'},status),stage)));
let csrf,tools=new Set(),orderId=null,orderNumberValue='',requestId=null,view='Order lookup',generation=0;
const app='refund-only-returns.';
const say=s=>{status.textContent=s;status.hidden=!s;status.classList.toggle('tag',!!s);};
const can=n=>tools.has(app+n);
const btn=(label,action,kind='')=>el('button',{type:'button',class:kind,onclick:()=>Promise.resolve().then(action).catch(()=>say('Could not open this view. Please refresh.'))},label);
async function http(path,body){
 const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json','X-Pale-CSRF':csrf||''},body:JSON.stringify(body)}:{});
 const d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'Host request failed.'),{known:true});return d;
}
async function call(op,args){
 if(!can(op))throw Object.assign(Error('Operation is unavailable in this session.'),{known:true});
 const r=await http('/api/call',{name:app+op,arguments:args});
 if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{known:true,code:r.status});
 return r;
}
const eligibility=(o,requests)=>requests.some(q=>q.status==='dispatched')?'Request already dispatched':({eligible:'Eligible for refund request',expired:'Return deadline passed',ineligible:'Not eligible',already_requested:'An active request already exists'})[o.eligibility];
const fmtTime=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
const date=x=>fmtTime.format(new Date(x));
const money=o=>new Intl.NumberFormat('en-US',{style:'currency',currency:o.currency,currencyDisplay:'narrowSymbol'}).format(o.refund_minor/100);
const orderNumber=o=>o.order_number?'#'+o.order_number:o.id;
const requestName=q=>q.attempt?'Request '+q.attempt:'Refund request';
const statusName=s=>({draft:'Preview',confirmed:'Confirmed',cancelled:'Cancelled',discarded:'Discarded preview',dispatched:'Dispatched'})[s];
const field=(k,v)=>el('div',{class:'metadata-line'},el('span',{},k),el('strong',{},v));
const details=(o,now,requests=[])=>el('section',{'aria-label':'Order summary'},
 el('div',{class:'tags'},el('span',{class:'tag'},eligibility(o,requests))),
 field('Order number',orderNumber(o)),field('Item',o.item_name),field('Estimated refund',money(o)),
 field('Ordered',date(o.ordered_at)),field('Return deadline',date(o.return_deadline)),field('Scenario time',date(now)));
const permittedErrors=new Set(['preview_exists','return_expired','ineligible','already_requested','already_dispatched','not_draft','not_confirmed','capacity_reached','not_found','permission_denied']);
const explain=e=>e.code==='stale_version'?'The workspace changed. Refresh and review before retrying.':permittedErrors.has(e.code)?e.message:'Could not complete that action. Refresh and check the current request.';

function write(area,label,n,args,version,token,done){
 if(!can(n))return;
 let pending,busy=false,finished=false;
 const error=el('p',{class:'form-error','aria-live':'polite'});
 const b=btn(label,async()=>{
  if(busy||finished||token!==generation||!area.isConnected)return;
  pending??={...args,expected_version:version,request_id:crypto.randomUUID()};
  error.textContent='';
  busy=true;const neighbors=[...area.querySelectorAll('button')].filter(x=>x!==b);for(const x of [b,...neighbors])x.disabled=true;
  try{const r=await call(n,pending);finished=true;if(token===generation)await done(r);}
  catch(e){
   if(token!==generation)return;
   if(e.known){finished=true;error.textContent=explain(e);}
   else{b.textContent='Retry '+label;error.textContent='No acknowledgement. Retry the same action or refresh to verify the current request.';}
  }finally{busy=false;b.disabled=finished;for(const x of neighbors)x.disabled=false;}
 },/^(Confirm|Prepare)/.test(label)?'primary':'');
 area.append(b,error);
}
async function render(target=view,notice=''){
 view=target;const token=++generation;stage.replaceChildren(el('h2',{},target));say('');
 if(target==='Order lookup'){
  const input=el('input',{id:'order-id',type:'text',autocomplete:'off','aria-describedby':'order-help order-error',placeholder:'10421'});input.value=orderNumberValue||'';
  const error=el('p',{id:'order-error',class:'form-error','aria-live':'polite'});
  const invalid=s=>{input.setAttribute('aria-invalid','true');error.textContent=s;};
  input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');error.textContent='';});
  const form=el('form',{class:'fields'},el('div',{class:'field'},el('label',{for:'order-id'},'Order number'),input,el('small',{id:'order-help'},'Use the number from your order confirmation. In the demo, try #10421.'),error),el('div',{class:'actions'},el('button',{type:'submit',class:'primary'},'Find order')));
  form.addEventListener('submit',async e=>{
   e.preventDefault();const id=input.value.trim().replace(/^#/,'');
   if(!/^(?:[0-9]{5,12}|[A-Za-z][A-Za-z0-9_-]{0,79})$/.test(id)){invalid('Enter a valid order number, such as #10421.');return;}
   input.removeAttribute('aria-invalid');error.textContent='';
   const op=++generation,button=form.querySelector('button');button.disabled=true;
   try{const r=await call('lookup_order',{order_id:id});if(op!==generation)return;orderId=r.order.id;orderNumberValue=orderNumber(r.order);requestId=null;await render('Order detail');}
   catch(e){if(op===generation)invalid(e.code==='not_found'?'No order matched that number in this account. Check it and try again.':explain(e));}
   finally{button.disabled=false;}
  });
  stage.append(form);if(notice)say(notice);return;
 }
 if(!orderId)return render('Order lookup','Find a synthetic order first.');
 try{
  const bar=el('div',{class:'actions'});
  if(target==='Order detail'){
   const r=await call('read_order',{order_id:orderId});if(token!==generation)return;
   const draft=r.requests.find(x=>x.status==='draft');
   if(draft)bar.append(btn('Review preview',()=>{requestId=draft.id;return render('Request review');}));
   else if(r.order.eligibility==='eligible')write(bar,'Prepare refund preview','prepare_preview',{order_id:orderId},r.version,token,async x=>{requestId=x.request.id;await render('Request review','Preview prepared. Nothing has been submitted.');});
   bar.append(...r.requests.filter(x=>x.status!=='draft').map(x=>btn('View '+requestName(x).toLowerCase()+' · '+statusName(x.status).toLowerCase(),()=>{requestId=x.id;return render('Request status');})));
   stage.append(el('p',{class:'muted'},r.policy.summary),details(r.order,r.virtual_now,r.requests),el('div',{class:'reader-footer'},bar));
  }else{
   if(!requestId)return render('Order detail','Open a preview or request first.');
   const r=await call('read_request',{refund_request_id:requestId});if(token!==generation)return;
   const q=r.request,args={refund_request_id:q.id};
   if(target==='Request review'&&q.status!=='draft'){
    view=target='Request status';stage.replaceChildren(el('h2',{},target));
   }
   if(q.status==='draft'&&target==='Request review'){
    if(r.order.eligibility==='eligible')write(bar,'Confirm refund request','confirm_request',args,r.version,token,()=>render('Request status','Synthetic request recorded. No money was returned.'));
    write(bar,'Discard preview','discard_preview',args,r.version,token,()=>render('Order detail','Preview discarded. No refund request was submitted.'));
   }
   if(q.status==='confirmed'&&target==='Request status'&&can('cancel_request'))bar.append(btn('Cancel request…',()=>{
    const confirm=el('div',{class:'actions'},el('p',{},'Cancel this refund request?'),btn('Keep request',()=>render('Request status')));
    bar.replaceChildren(confirm);write(confirm,'Confirm cancellation','cancel_request',args,r.version,token,()=>render('Request status','Synthetic request cancelled.'));
   }));
   const next={
    confirmed:'Your request is recorded. You can cancel it before dispatch. No money was returned.',
    cancelled:'No action is needed. If this order is still eligible, you can start a new request.',
    discarded:'This preview was never submitted. Open Order detail to start again.',
    dispatched:'Dispatched requests cannot be cancelled.'
   };
   const summary=target==='Request review'?details(r.order,r.virtual_now):
    el('section',{'aria-label':'Request progress'},
     field('Order number',orderNumber(r.order)),
     field(q.submitted_at?'Submitted':'Request opened',date(q.submitted_at??q.created_at)),
     field('Estimated refund',money(r.order)));
   stage.append(el('div',{class:'tags'},el('span',{class:'tag'},statusName(q.status))),summary,el('p',{class:'muted'},next[q.status]??'Review the refund estimate before submitting.'),el('div',{class:'reader-footer'},bar));
  }
  if(notice)say(notice);
 }catch(e){if(token===generation)stage.append(el('p',{class:'form-error'},explain(e)));}
}
async function start(){
 const access=new URLSearchParams(location.hash.slice(1)).get('access');
 if(access)history.replaceState(null,'',location.pathname);
 ({csrf}=await http('/session',access?{token:access}:undefined));
 tools=new Set((await http('/api/tools')).tools.map(t=>t.name));
 nav.append(btn('Order lookup',()=>render('Order lookup')),btn('Order detail',()=>render('Order detail')),btn('Refresh view',()=>render()));
 await render();
}
start().catch(()=>say('Could not open this session. Use the access link from the Web Host.'));
