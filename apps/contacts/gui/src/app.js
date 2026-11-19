import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'contacts',title:'Contacts',description:'Keep people, contact details and shared identity references together.',
 list:'contacts.list',collection:'items',queryField:'query',listArgs:{include_inactive:true},get:'contacts.get',item:'item',
 heading:c=>c.display_name,subtitle:c=>c.organization+(c.archived?' · Archived':''),
 labels:{display_name:'Name',person_id:'Bound person ID',emails:'Email addresses',phones:'Phone numbers'},
 actions:[
  {label:'New contact',tool:'contacts.create',primary:true},
  {label:'Edit contact',tool:'contacts.update',selected:true,prefill:c=>({patch:{display_name:c.display_name,person_id:c.person_id,emails:c.emails,phones:c.phones,organization:c.organization,groups:c.groups,notes:c.notes}})},
  {label:'Archive or restore',tool:'contacts.flags',selected:true,prefill:c=>({patch:{archived:!c.archived}})}
 ]
};
mount(config);
