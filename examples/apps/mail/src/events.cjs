'use strict';
const {copy,fail}=require('./domain-utils.cjs');
const {receiveNotification}=require('./messaging.cjs');
function applyEvent(ctx,data,event){
 if(event.operation==='mail.receive_notification')return receiveNotification(ctx,data,event);
 if(event.operation!=='mail.deliver')fail('invalid_event','Unknown Mail event.');
 if(event.payload.account_id!==data.account_id)fail('invalid_seed','Message account does not match this App instance.');
 if(data.messages.some(x=>x.id===event.payload.id))fail('already_exists','Message ID already exists.');
 data.messages.push(copy(event.payload));return data;
}
module.exports={applyEvent};
