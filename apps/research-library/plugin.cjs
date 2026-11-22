'use strict';
const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
const find = (xs, id) => xs.find(x => x.id === id);
const den = () => fail('permission_denied', 'Not permitted for the current library or account.');
const person = (ctx, d) => ctx.binding.accounts.find(x => x.app_id === 'library' && x.account_id === d.account_id)?.owner_person_id;
function validateSeed(ctx, d) {
  const principals = new Set(ctx.binding.people.map(x => x.person_id));
  const check = (keys, reason) => {
    if (new Set(keys).size !== keys.length) fail('invalid_seed', reason);
  };
  if (!principals.has(person(ctx, d))) fail('invalid_seed', 'Library account has no bound principal.');
  check(d.libraries.map(x => x.id), 'Duplicate library.');
  check(d.catalog.map(x => x.id), 'Duplicate catalog item.');
  check(d.records.map(x => x.id), 'Duplicate record.');
  check(d.records.map(x => x.library_id + ':' + x.catalog_id), 'Duplicate import within a library.');
  check(d.notes.map(x => x.record_id + ':' + x.author), 'Duplicate note.');
  for (const l of d.libraries) {
    check(l.grants.map(x => x.principal_id), 'Duplicate grant.');
    if (l.grants.some(x => !principals.has(x.principal_id))) fail('invalid_seed', 'Grant names an unknown principal.');
  }
  if (d.records.some(x => !find(d.libraries, x.library_id) || !find(d.catalog, x.catalog_id))) fail('invalid_seed', 'Unresolvable record reference.');
  if (d.notes.some(x => !find(d.records,x.record_id) || !principals.has(x.author))) fail('invalid_seed', 'Unresolvable note reference.');
}
function applyEvent(ctx, d, e) {
  if (ctx.role!=='infra' || e.operation!=='library.permission_change') fail('invalid_event','Unsupported event.');
  const {library_id, principal_id, role} = e.payload;
  const l = find(d.libraries, library_id);
  if (!l || !ctx.binding.people.some(x=>x.person_id===principal_id) || !['none','viewer','editor'].includes(role)) fail('invalid_event','Unknown library, principal or role.');
  l.grants=l.grants.filter(x=>x.principal_id!==principal_id);
  if (role!=='none') l.grants.push({principal_id,role});
  return d;
}
function handleTool(ctx,d,name,args) {
  if (Date.parse(ctx.virtual_now)>=Date.parse(d.session_expires_at)) fail('session_expired','This synthetic session has expired.');
  const actor=person(ctx,d), library=find(d.libraries,args.library_id);
  const role=library?.grants.find(x=>x.principal_id===actor)?.role;
  if (!actor || !['viewer','editor'].includes(role)) den();
  if (['library.import','library.save_record','library.save_note'].includes(name) && role!=='editor') den();
  const records=d.records.filter(x=>x.library_id===library.id);
  const get=()=>find(records,args.id) || fail('not_found','Record is unavailable in the selected library.');
  const match=(x)=>!args.query || [x.title,...x.authors].join(' ').toLowerCase().includes(args.query.toLowerCase());
  const finish=result=>({data:d,result});
  switch(name) {
    case 'library.search':
      return finish({records:records.filter(x=>match(x)&&(!args.tag||x.tags.includes(args.tag))&&(!args.reading_status||x.reading_status===args.reading_status))});
    case 'library.get': {
      const record=get();
      return finish({record,notes:d.notes.filter(n=>n.record_id===record.id && n.author===actor)});
    }
    case 'library.catalog_search': return finish({items:d.catalog.filter(match)});
    case 'library.import': {
      const item=find(d.catalog,args.catalog_id);
      if (!item) fail('not_found','Unknown catalog item.');
      if (records.some(x=>x.catalog_id===item.id)) fail('duplicate_import','Already imported in this library.');
      if (d.records.length>=100) fail('capacity_reached','Record limit reached.');
      let serial=1;
      while (find(d.records,'import-'+serial)) serial++;
      const record={...item,id:'import-'+serial,catalog_id:item.id,library_id:library.id,revision:1,tags:[],reading_status:'unread'};
      d.records.push(record);
      return finish({record});
    }
    case 'library.save_record':
    case 'library.save_note': {
      const record=get();
      if (record.revision!==args.expected_record_revision) fail('stale_record','The record changed; reread it before saving.');
      if (name==='library.save_record') {
        const fields=['title','authors','year','tags','reading_status'];
        for (const field of fields) if (Object.hasOwn(args.patch,field)) record[field]=args.patch[field];
        record.revision++;
        return finish({record});
      }
      const i=d.notes.findIndex(n=>n.record_id===record.id&&n.author===actor);
      if (i<0 && d.notes.length>=100) fail('capacity_reached','Note limit reached.');
      const note={record_id:record.id,author:actor,text:args.text};
      if (i<0) d.notes.push(note); else d.notes[i]=note;
      record.revision++;
      return finish({record,note});
    }
    default: fail('invalid_arguments','Unknown Library operation.');
  }
}
module.exports={validateSeed,applyEvent,handleTool,objects:d=>d.records.map(x=>x.id),records:d=>d.records,references:()=>[]};
