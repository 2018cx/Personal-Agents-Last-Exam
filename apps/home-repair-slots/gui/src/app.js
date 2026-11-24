import {el} from '/shared/client.js';
const root=document.querySelector('#app'),nav=el('nav',{'aria-label':'Home Repair navigation'});
const live=el('p',{role:'status','aria-live':'polite'},'Opening synthetic workspace…');
const stage=el('article',{class:'detail','aria-label':'Synthetic booking workspace'});
root.replaceChildren(el('h1',{},'Home Repair Slots'),el('p',{},'Synthetic cabinet-hinge adjustment only. No payment, provider contact or real booking.'),nav,live,stage);
let csrf,tools=new Set(),screen='Slots',selectedReservation=null,selectedBooking=null,turn=0;
const msg=t=>{live.textContent=t;};
const can=n=>tools.has('home-repair-slots.'+n);
const parcel=(res,more=[])=>el('ul',{},[...res,...more].map(text=>el('li',{},text)));
const actions=(...children)=>el('div',{class:'actions'},...children);
const button=(label,act,token)=>el('button',{type:'button',onclick:()=>Promise.resolve().then(act).catch(e=>{if(token==null||token===turn)msg(e.message);})},label);
async function request(route,method='GET',payload){
 const r=await fetch(route,{method,headers:method==='POST'?{'Content-Type':'application/json','X-Pale-CSRF':csrf}:{},...(method==='POST'?{body:JSON.stringify(payload)}:{})});
 const d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'Request failed'),{code:'http_error'});return d;
}
async function call(name,args={}){
 if(!can(name))throw Object.assign(Error('This operation is not allowed by the current policy.'),{code:'unavailable'});
 const r=await request('/api/call','POST',{name:'home-repair-slots.'+name,arguments:args});
 if(!['ok','committed'].includes(r.status))throw Object.assign(Error(r.message||r.status),{code:r.status});
 return r;
}
const end=(token,title,...nodes)=>{if(token===turn){stage.replaceChildren(title,...nodes.filter(node=>node!=null));msg('Workspace state loaded.');}};
function write(area,label,tool,args,version,token,done){
 if(!can(tool))return;
 let sending=false,complete=false,pending;
 const go=button(label,async()=>{
  if(sending||complete||token!==turn||!area.isConnected)return;
  sending=true;pending??={...args,expected_version:version,request_id:crypto.randomUUID()};
  const locks=[...stage.querySelectorAll('button')].filter(x=>!x.disabled||x.dataset.writeLocked==='yes');
  for(const b of locks){b.disabled=true;b.dataset.writeLocked='yes';}
  let uncertain=false;
  try{
   const r=await call(tool,pending);complete=true;
   if(token===turn&&area.isConnected)await done(r);
  }catch(e){
   if(e.code){complete=true;if(token===turn)msg(e.message);}
   else if(token===turn){uncertain=true;go.textContent='Retry '+label;msg('No confirmation received. Retry the same request or refresh and verify the workspace.');}
  }finally{
   sending=false;
   if(uncertain)go.disabled=false;
   else for(const b of locks){b.disabled=false;delete b.dataset.writeLocked;}
   if(complete)go.disabled=true;
  }
 },token);
 area.append(go);
}
const amount=(s,c)=>new Intl.NumberFormat('en',{style:'currency',currency:c.currency,currencyDisplay:'code'}).format(s/100);
function slotLine(s,state){
 const p=state.providers.find(x=>x.id===s.provider_id);
 return s.id+' · '+p?.name+' · '+s.start+' to '+s.end+' · '+amount(s.estimate_minor,state.constraints)+' all-inclusive';
}
const saved=(next,label)=>show(next,label);
async function show(next=screen,outcome){
 screen=next;const token=++turn;
 for(const b of nav.querySelectorAll('[data-screen]')){
  if(b.dataset.screen===next)b.setAttribute('aria-current','page');
  else b.removeAttribute('aria-current');
 }
 stage.replaceChildren();msg('Reading local state…');
 const title=el('h2',{},next);
 try{
  const state=await call('list_slots');if(token!==turn)return;
  const notice=el('p',{},'Requested dates '+state.constraints.from_date+' through '+state.constraints.through_date+' · '+state.constraints.timezone+' · Budget '+amount(state.constraints.budget_minor,state.constraints));
  if(next==='Slots'){
   selectedReservation=state.reservation_id;
   const rows=state.slots.map(s=>{
    const bar=actions();
    write(bar,'Select '+s.id,'select_slot',{slot_id:s.id},state.version,token,r=>{
     selectedReservation=r.reservation.id;return saved('Review reservation','Temporary preview saved. This slot is not held.');
    });
    return el('li',{},slotLine(s,state),bar);
   });
   end(token,title,notice,rows.length?el('ul',{},rows):el('p',{},'No suitable available slots within the requested dates and budget.'));
  }else if(next==='Review reservation'){
   selectedReservation=state.reservation_id||selectedReservation;
   if(!selectedReservation){end(token,title,notice,el('p',{},'No temporary reservation. Choose a suitable slot first.'));return;}
   const r=await call('get_reservation',{reservation_id:selectedReservation});if(token!==turn)return;
   const bar=actions(),status=r.reservation.status;
   if(status==='open')write(bar,'Confirm reservation','confirm_reservation',{reservation_id:selectedReservation},r.version,token,c=>{
    selectedBooking=c.booking.id;return saved('Bookings','Synthetic booking confirmed: '+c.booking.id);
   });
   if(['open','invalidated'].includes(status))write(bar,'Discard reservation','discard_reservation',{reservation_id:selectedReservation},r.version,token,()=>{
    return saved('Review reservation','Reservation discarded. No booking created.');
   });
   bar.append(button('Back to available slots',()=>show('Slots'),token));
   end(token,title,notice,parcel(['Reservation '+r.reservation.id+' · '+status,slotLine(r.slot,state)]),
    status==='invalidated'?el('p',{},'This slot was taken before confirmation. Check alternatives or discard the reservation.'):null,bar);
  }else{
   const links=actions(...state.booking_ids.map(id=>button('Open '+id,()=>{selectedBooking=id;return show(next);},token)));
   if(!state.booking_ids.includes(selectedBooking))selectedBooking=null;
   if(!selectedBooking){end(token,title,notice,links,el('p',{},'Choose a booking.'));return;}
   const r=await call('get_booking',{booking_id:selectedBooking});if(token!==turn)return;
   const info=parcel(['Booking '+r.booking.id+' · '+r.booking.status,slotLine(r.slot,state)]);
   const bar=actions();
   if(next==='Bookings'&&r.booking.status==='confirmed'){
    bar.append(button('Change or cancel '+r.booking.id,()=>show('Change or cancel'),token));
   }else if(next==='Change or cancel'&&r.booking.status==='confirmed'){
    if(can('reschedule_booking')){
     bar.append(el('p',{},'Changing a booking releases the old slot only if the new slot is acquired.'));
     for(const s of state.slots){
      bar.append(button('Reschedule to '+s.id,()=>{
       const confirm=actions(button('Keep existing booking',()=>show('Change or cancel'),token));
       write(confirm,'Confirm reschedule','reschedule_booking',{booking_id:r.booking.id,slot_id:s.id},r.version,token,()=>saved('Bookings','Booking '+r.booking.id+' rescheduled to '+s.id+'.'));
       bar.replaceChildren(el('p',{},slotLine(s,state)),confirm);
      },token));
     }
    }
    if(can('cancel_booking'))bar.append(button('Cancel booking',()=>{
     const confirm=actions(button('Keep booking',()=>show('Change or cancel'),token));
     write(confirm,'Confirm cancellation','cancel_booking',{booking_id:r.booking.id},r.version,token,()=>saved('Bookings','Booking '+r.booking.id+' cancelled.'));
     bar.replaceChildren(el('p',{},'Cancel booking '+r.booking.id+'? No external message is sent.'),confirm);
    },token));
   }
   end(token,title,notice,links,info,bar);
  }
  if(token===turn&&outcome)msg(outcome);
 }catch(e){if(token===turn){stage.replaceChildren(title);msg(e.message);}}
}
async function init(){
 const access=new URLSearchParams(location.hash.slice(1)).get('access');
 if(access){history.replaceState(null,'',location.pathname);({csrf}=await request('/session','POST',{token:access}));}
 else ({csrf}=await request('/session'));
 tools=new Set((await request('/api/tools')).tools.map(t=>t.name));
 nav.replaceChildren(...['Slots','Review reservation','Bookings','Change or cancel'].map(n=>{
  const b=button(n,()=>show(n));b.dataset.screen=n;return b;
 }),button('Refresh',()=>show()));
 await show();
}
init().catch(e=>msg(e.message));
