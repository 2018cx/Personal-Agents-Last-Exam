import {el} from '/shared/client.js';
const root=document.querySelector('#app'),stage=el('section',{'aria-label':'Refund request workspace'}),status=el('p',{role:'status','aria-live':'polite'}),nav=el('nav',{'aria-label':'Navigation'});
root.replaceChildren(el('h1',{},'Refund-only Returns'),el('p',{},'Synthetic requests only. No money is moved.'),nav,status,stage);
let csrf,tools=new Set(),orderId=null,requestId=null,view='Order lookup',generation=0;
const app='refund-only-returns.';
const say=s=>{status.textContent=s;};
const can=n=>tools.has(app+n);
const btn=(label,action)=>el('button',{type:'button',onclick:()=>Promise.resolve().then(action).catch(e=>say(e.message))},label);
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
const eligibility=o=>({eligible:'Eligible for refund request',expired:'Return deadline passed',ineligible:'Not eligible',already_requested:'An active request already exists'})[o.eligibility];
const details=(o,now)=>el('ul',{},[o.item_name+' · '+o.id,'Fixed informational amount: '+new Intl.NumberFormat('en',{style:'currency',currency:o.currency,currencyDisplay:'code'}).format(o.refund_minor/100),'Ordered: '+o.ordered_at,'Return deadline: '+o.return_deadline,'Current scenario time: '+now,eligibility(o)].map(s=>el('li',{},s)));
function write(area,label,n,args,version,token,done){
 if(!can(n))return;
 let pending,busy=false,finished=false;
 const b=btn(label,async()=>{
  if(busy||finished||token!==generation||!area.isConnected)return;
  pending??={...args,expected_version:version,request_id:crypto.randomUUID()};
  busy=true;const neighbors=[...area.querySelectorAll('button')].filter(x=>x!==b);for(const x of [b,...neighbors])x.disabled=true;
  try{const r=await call(n,pending);finished=true;if(token===generation)await done(r);}
  catch(e){
   if(token!==generation)return;
   if(e.known){finished=true;say(e.code==='stale_version'?'The workspace changed. Refresh and review before retrying.':e.message);}
   else{b.textContent='Retry '+label;say('No acknowledgement. Retry the same action or refresh to verify the current request.');}
  }finally{busy=false;b.disabled=finished;for(const x of neighbors)x.disabled=false;}
 });
 area.append(b);
}
async function render(target=view,notice=''){
 view=target;const token=++generation;stage.replaceChildren(el('h2',{},target));say('');
 if(target==='Order lookup'){
  const input=el('input',{id:'order-id',type:'text',required:true,autocomplete:'off',maxlength:80});input.value=orderId||'';
  const form=el('form',{},el('label',{for:'order-id'},'Order ID'),input,el('button',{type:'submit'},'Find order'));
  form.addEventListener('submit',async e=>{
   e.preventDefault();const id=input.value.trim();if(!id)return;
   const op=++generation,button=form.querySelector('button');button.disabled=true;
   try{const r=await call('lookup_order',{order_id:id});if(op!==generation)return;orderId=r.order.id;requestId=null;await render('Order detail');}
   catch(e){if(op===generation)say(e.message);}
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
   if(draft)bar.append(btn('Review preview '+draft.id,()=>{requestId=draft.id;return render('Request review');}));
   else if(r.order.eligibility==='eligible')write(bar,'Prepare refund preview','prepare_preview',{order_id:orderId},r.version,token,async x=>{requestId=x.request.id;await render('Request review','Preview prepared. Nothing has been submitted.');});
   bar.append(...r.requests.filter(x=>x.status!=='draft').map(x=>btn('View request '+x.id+' ('+x.status+')',()=>{requestId=x.id;return render('Request status');})));
   stage.append(el('p',{},r.merchant.name+' · policy '+r.policy.version+': '+r.policy.summary),details(r.order,r.virtual_now),bar);
  }else{
   if(!requestId)return render('Order detail','Open a preview or request first.');
   const r=await call('read_request',{refund_request_id:requestId});if(token!==generation)return;
   const q=r.request,args={refund_request_id:q.id};
   if(q.status==='draft'&&target==='Request review'){
    if(r.order.eligibility==='eligible')write(bar,'Confirm refund request','confirm_request',args,r.version,token,()=>render('Request status','Synthetic request recorded. No money was returned.'));
    write(bar,'Discard preview','discard_preview',args,r.version,token,()=>render('Order detail','Preview discarded. No refund request was submitted.'));
   }
   if(q.status==='confirmed'&&target==='Request status'&&can('cancel_request'))bar.append(btn('Cancel request…',()=>{
    const confirm=el('div',{class:'actions'},el('p',{},'Cancel request '+q.id+'?'),btn('Keep request',()=>render('Request status')));
    bar.replaceChildren(confirm);write(confirm,'Confirm cancellation','cancel_request',args,r.version,token,()=>render('Request status','Synthetic request cancelled.'));
   }));
   stage.append(el('p',{},'Request '+q.id+' · '+q.status),details(r.order,r.virtual_now),el('p',{},q.status==='dispatched'?'Dispatched requests cannot be cancelled.':'This status does not represent money returned.'),bar);
  }
  if(notice)say(notice);
 }catch(e){if(token===generation)say(e.message);}
}
async function start(){
 const access=new URLSearchParams(location.hash.slice(1)).get('access');
 if(access)history.replaceState(null,'',location.pathname);
 ({csrf}=await http('/session',access?{token:access}:undefined));
 tools=new Set((await http('/api/tools')).tools.map(t=>t.name));
 nav.append(btn('Order lookup',()=>render('Order lookup')),btn('Order detail',()=>render('Order detail')),btn('Refresh view',()=>render()));
 await render();
}
start().catch(e=>say(e.message));
