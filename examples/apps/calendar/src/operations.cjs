'use strict';
// Business operations receive a working copy; only Core may commit the result.
const {fail,range,overlap}=require('./domain-utils.cjs');
const {ical}=require('./formats/ical.cjs');
function handleTool(ctx,data,name,args){
 const records=data.events,e=records.find(x=>x.id===args.id);
 if(name==='calendar.list'){
  if((args.start||args.end)&&!range(args))fail('invalid_arguments','A valid start and end are required.');
  return {data,result:{events:records.filter(x=>(args.include_cancelled||x.status!=='cancelled')&&(!args.start||overlap(x,args)))}};
 }
 if(name==='calendar.freebusy'){if(!range(args))fail('invalid_arguments','Start must precede end.');return {data,result:{busy:records.filter(x=>x.id!==args.exclude_id&&x.status!=='cancelled'&&overlap(x,args)).map(x=>({id:x.id,start:x.start,end:x.end}))}};}
 if(name==='calendar.create'){
  let n=1;while(records.some(x=>x.id==='evt-local-'+n))n++;const id='evt-local-'+n;
  const next={id,uid:id+'@pale.example',account_id:data.account_id,calendar_id:data.calendar_id,title:args.title,start:args.start,end:args.end,timezone:args.timezone,location:args.location||'',organizer_person_id:data.owner_person_id,attendees:[data.owner_person_id],status:'confirmed',sequence:0};
  if(records.some(x=>x.status!=='cancelled'&&overlap(x,next)))fail('calendar_overlap','An event already occupies this time range.');records.push(next);return {data,result:{id}};
 }
 if(!e)fail('not_found','Event not found.');
 if(name==='calendar.get')return {data,result:{event:e}};
 if(name==='calendar.export_ics')return {data,result:{mime_type:'text/calendar',text:ical(e)}};
 if(name==='calendar.update'){
  if(!Object.keys(args.patch).length)fail('invalid_arguments','No update fields were supplied.');
  if(e.status==='cancelled')fail('invalid_state','Cancelled events cannot be updated.');const next={...e,...args.patch,sequence:e.sequence+1};
  if(records.some(x=>x.id!==e.id&&x.status!=='cancelled'&&overlap(x,next)))fail('calendar_overlap','An event already occupies this time range.');Object.assign(e,next);
 }else if(name==='calendar.cancel'){e.status='cancelled';e.sequence++;}
 else fail('not_found','Unknown Calendar operation.');
 return {data,result:{id:e.id}};
}
module.exports={handleTool};
