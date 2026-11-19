import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'tasks',title:'Tasks',description:'Track commitments, deadlines and the work that depends on them.',
 list:'tasks.list',collection:'items',queryField:'query',listArgs:{include_inactive:true},get:'tasks.get',item:'item',
 heading:t=>t.title,subtitle:t=>t.status.replace(/_/g,' ')+' · '+t.list,
 labels:{assignee_person_id:'Assignee person ID',due_at:'Due time',blocked_by:'Blocking task IDs',priority:'Priority (0–3)'},
 actions:[
  {label:'New task',tool:'tasks.create',primary:true},
  {label:'Edit task',tool:'tasks.update',selected:true,prefill:t=>({patch:{title:t.title,description:t.description,list:t.list,assignee_person_id:t.assignee_person_id,due_at:t.due_at,priority:t.priority,tags:t.tags,blocked_by:t.blocked_by}})},
  {label:'Change status',tool:'tasks.transition',selected:true,prefill:t=>({status:t.status})}
 ]
};
mount(config);
