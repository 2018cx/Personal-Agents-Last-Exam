import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'mail', title:'Mail', description:'Read your inbox, manage drafts and organize messages.',
 list:'mail.search', collection:'messages', queryField:'query', get:'mail.get', item:'message',
 heading:m=>m.subject, subtitle:m=>m.folder+' · '+m.from,
 labels:{to:'To (email addresses)',body:'Message',read:'Mark as read',folder:'Destination folder',files:'Attachments'},
 actions:[
  {label:'Compose',tool:'mail.draft.create',primary:true,submit:'Save draft'},
  {label:'Edit draft',tool:'mail.draft.update',selected:true,available:m=>m.folder==='drafts',prefill:m=>({patch:{to:m.to,subject:m.subject,body:m.body}})},
  {label:'Send draft',tool:'mail.send',selected:true,available:m=>m.folder==='drafts',success:'Moved to Sent. Cross-App delivery requires the configured Messaging workflow.'},
  {label:'Read status',tool:'mail.flags.update',selected:true,prefill:m=>({read:!m.read})},
  {label:'Move',tool:'mail.move',selected:true,prefill:m=>({folder:m.folder})},
  {label:'Trash',tool:'mail.trash',selected:true},
  {label:'Add attachments',tool:'mail.attachment.add',selected:true,available:m=>m.folder==='drafts'},
  {label:'Download attachment',tool:'mail.attachment.get',selected:true},
  {label:'Remove attachment',tool:'mail.attachment.remove',selected:true,available:m=>m.folder==='drafts'}
 ]
};
mount(config);
