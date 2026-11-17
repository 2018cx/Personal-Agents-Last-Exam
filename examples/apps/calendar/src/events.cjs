'use strict';
const {log}=require('./diagnostics.cjs');
const {copy,fail}=require('./domain-utils.cjs');
function applyEvent(ctx,data,event){
 log(ctx,'calendar.event.started',{event_id:event.event_id,operation:event.operation});
 if(event.operation!=='calendar.upsert')fail('invalid_event','Unknown Calendar event.');
 const i=data.events.findIndex(x=>x.id===event.payload.id);log(ctx,'calendar.upsert.matched',{object_id:event.payload.id,found:i>=0});if(i<0)data.events.push(copy(event.payload));else data.events[i]=copy(event.payload);log(ctx,'calendar.upsert.prepared',{object_id:event.payload.id});return data;
}
module.exports={applyEvent};
