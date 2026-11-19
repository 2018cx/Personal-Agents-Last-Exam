import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'notes',title:'Notes',description:'Capture preferences, ideas and reference material.',
 list:'notes.list',collection:'items',queryField:'query',listArgs:{include_inactive:true},get:'notes.get',item:'item',
 heading:n=>n.title,subtitle:n=>(n.pinned?'Pinned · ':'')+(n.trashed?'Trashed':n.archived?'Archived':n.tags.join(', ')),
 labels:{body:'Note',tags:'Tags',files:'Attachments'},
 actions:[
  {label:'New note',tool:'notes.create',primary:true},
  {label:'Edit note',tool:'notes.update',selected:true,prefill:n=>({patch:{title:n.title,body:n.body,tags:n.tags,pinned:n.pinned}})},
  {label:'Organize note',tool:'notes.flags',selected:true,prefill:n=>({patch:{pinned:n.pinned,archived:n.archived,trashed:n.trashed}})},
  {label:'Add attachments',tool:'notes.attachment.add',selected:true},
  {label:'Download attachment',tool:'notes.attachment.read',selected:true}
 ]
};
mount(config);
