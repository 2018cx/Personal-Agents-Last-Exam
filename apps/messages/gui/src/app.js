import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'messages',title:'Messages',description:'Follow conversations and manage your own messages.',
 list:'messages.list',collection:'items',queryField:'query',listArgs:{include_inactive:true},get:'messages.get',item:'item',
 heading:m=>m.text||'Retracted message',subtitle:m=>m.conversation_id+' · '+(m.retracted?'Retracted':m.author_person_id),
 labels:{text:'Message',conversation_id:'Conversation ID',participant_ids:'Participant person IDs',recipient_account_id:'Recipient account ID'},
 actions:[
  {label:'New message',tool:'messages.send',primary:true,success:'Message saved locally. Cross-App delivery requires the configured Messaging workflow.'},
  {label:'New conversation',tool:'messages.conversation.create'},
  {label:'View conversations',tool:'messages.conversations'},
  {label:'Edit message',tool:'messages.edit',selected:true,prefill:m=>({text:m.text})},
  {label:'Mark read',tool:'messages.mark_read',selected:true},
  {label:'Retract',tool:'messages.retract',selected:true},
  {label:'Add attachments',tool:'messages.attachment.add',selected:true},
  {label:'Download attachment',tool:'messages.attachment.read',selected:true},
  {label:'Export delivery envelope',tool:'messages.outbound',selected:true,exportResult:'outbound-message.json'}
 ]
};
mount(config);
