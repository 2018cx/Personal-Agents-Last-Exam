import {mount} from '/shared/client.js';
// App-owned interaction catalog and presentation. The Host only supplies an Agent connection.
export const config={
 id:'files',title:'Files',description:'Keep original files, folders and their version history.',
 list:'files.list',collection:'items',queryField:'query',listArgs:{include_inactive:true},get:'files.get',item:'item',
 heading:f=>f.name,subtitle:f=>f.kind+(f.trashed?' · Trashed':'')+' · '+f.versions.length+' versions',
 labels:{parent_id:'Parent folder ID (blank for root)',file:'File',source:'Source note',number:'Version number (blank for latest)'},
 actions:[
  {label:'Upload file',tool:'files.put',primary:true},
  {label:'New folder',tool:'files.mkdir'},
  {label:'Rename or move',tool:'files.move',selected:true,prefill:f=>({patch:{name:f.name,parent_id:f.parent_id}})},
  {label:'Upload new version',tool:'files.put',selected:true},
  {label:'Download file',tool:'files.read',selected:true,available:f=>f.kind==='file'},
  {label:'Trash or restore',tool:'files.trash',selected:true,prefill:f=>({trashed:!f.trashed})}
 ]
};
mount(config);
