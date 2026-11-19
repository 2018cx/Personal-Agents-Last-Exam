import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'calendar',title:'Calendar',description:'Plan your time, check availability and manage events.',
 list:'calendar.list',collection:'events',listArgs:{include_cancelled:true},get:'calendar.get',item:'event',
 heading:e=>e.title,subtitle:e=>e.start+' · '+e.status,
 labels:{timezone:'Event timezone',text:'iCalendar content',exclude_id:'Exclude event ID'},
 actions:[
  {label:'New event',tool:'calendar.create',primary:true,defaults:{timezone:'America/Los_Angeles'}},
  {label:'Check availability',tool:'calendar.freebusy'},
  {label:'Import calendar',tool:'calendar.import_ics'},
  {label:'Edit event',tool:'calendar.update',selected:true,available:e=>e.status!=='cancelled',prefill:e=>({patch:{title:e.title,start:e.start,end:e.end,location:e.location,attendees:e.attendees}})},
  {label:'Cancel event',tool:'calendar.cancel',selected:true,available:e=>e.status!=='cancelled'},
  {label:'Export calendar',tool:'calendar.export_ics',selected:true},
  {label:'Add attachments',tool:'calendar.attachment.add',selected:true,available:e=>e.status!=='cancelled'},
  {label:'Download attachment',tool:'calendar.attachment.get',selected:true},
  {label:'Remove attachment',tool:'calendar.attachment.remove',selected:true,available:e=>e.status!=='cancelled'}
 ]
};
mount(config);
