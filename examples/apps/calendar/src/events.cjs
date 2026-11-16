'use strict';
const {copy,fail}=require('./domain-utils.cjs');
function applyEvent(ctx,data,event){
 if(event.operation!=='calendar.upsert')fail('invalid_event','Unknown Calendar event.');
 const i=data.events.findIndex(x=>x.id===event.payload.id);if(i<0)data.events.push(copy(event.payload));else data.events[i]=copy(event.payload);return data;
}
module.exports={applyEvent};
