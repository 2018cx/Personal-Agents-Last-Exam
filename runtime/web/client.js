// Shared UI primitives. Each App owns its action catalog, field labels and data presentation.
// All data comes from the fixed Agent MCP connection; no fixture or admin state is embedded.
const el=(tag,attrs={},...children)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)n.setAttribute(k,v);}for(const c of children.flat())if(c!=null)n.append(c instanceof Node?c:document.createTextNode(String(c)));return n;};
const title=k=>k.replace(/_/g,' ').replace(/^./,s=>s.toUpperCase());
const clone=v=>v===undefined?undefined:structuredClone(v);
function download(filename,mime,bytes){const url=URL.createObjectURL(new Blob([bytes],{type:mime}));const a=el('a',{href:url,download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function visibleValue(value){if(Array.isArray(value))return value.map(v=>typeof v==='object'?Object.entries(v).map(([k,x])=>title(k)+': '+visibleValue(x)).join(' · '):String(v)).join('\n');if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>title(k)+': '+visibleValue(v)).join('\n');return value==null?'—':String(value);}
async function transfer(file){
  if(file.size>1048576)throw Error('File exceeds the local 1 MiB limit.');
  const mime=file.type||({'txt':'text/plain','ics':'text/calendar','json':'application/json','pdf':'application/pdf'}[file.name.split('.').pop()]||'application/octet-stream');
  const buf=await file.arrayBuffer(),bytes=new Uint8Array(buf),sha=new Uint8Array(await crypto.subtle.digest('SHA-256',buf));
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const out={filename:file.name,mime_type:mime,base64:btoa(binary),sha256:Array.from(sha,b=>b.toString(16).padStart(2,'0')).join('')};
  // The current media profile accepts optional descriptive metadata; bytes remain authoritative.
  return out;
}
export async function mount(config){
  document.title=config.title+' · PALE';document.body.dataset.app=config.id;
  let csrf='',tools=[],records=[],selected=null,version=null,refreshNumber=0,selectionNumber=0,busy=false;
  const status=el('p',{role:'status','aria-live':'polite',id:'status'},'Connecting…');
  const search=el('input',{type:'search',placeholder:config.searchLabel||'Search','aria-label':'Search'});
  const list=el('div',{class:'records',id:'records'}),detail=el('section',{class:'detail','aria-label':'Selected record'});
  const globalActions=el('div',{class:'actions'}),recordActions=el('div',{class:'actions'});
  const dialog=el('dialog',{'aria-label':'Business operation'}),form=el('form',{}),fields=el('div',{class:'fields'}),formError=el('p',{role:'alert',class:'form-error'});
  const formTitle=el('h2'),submit=el('button',{type:'submit',class:'primary'},'Save');
  const cancel=el('button',{type:'button',onclick:()=>dialog.close()},'Cancel');
  form.append(formTitle,fields,formError,el('div',{class:'form-actions'},cancel,submit));dialog.append(form);
  const refreshButton=el('button',{type:'button',onclick:()=>refresh().catch(showError)},'Refresh');
  document.querySelector('#app').replaceChildren(
    el('header',{class:'topbar'},el('div',{},el('span',{class:'eyebrow'},'PALE / PERSONAL APPS'),el('h1',{},config.title)),el('span',{class:'session'},'Business workspace')),
    el('main',{},el('div',{class:'intro'},el('p',{},config.description),globalActions),
      el('div',{class:'toolbar'},search,refreshButton),status,
      el('div',{class:'workspace'},el('aside',{'aria-label':'Records'},list),detail)),dialog);
  function showError(error){status.textContent=error.message;status.dataset.error='true';}
  function loading(value){document.querySelector('#app').setAttribute('aria-busy',String(value));for(const b of document.querySelectorAll('.record,.actions button,.toolbar button'))b.disabled=value;}
  async function request(url,method='GET',value){
    const r=await fetch(url,{method,headers:method==='POST'?{'Content-Type':'application/json','X-Pale-CSRF':csrf}:{},...(method==='POST'?{body:JSON.stringify(value)}:{})});
    const out=await r.json();if(!r.ok)throw Error(out.error||'Request failed');return out;
  }
  async function call(name,args){const r=await request('/api/call','POST',{name,arguments:args});if(!['ok','committed','ready'].includes(r.status)){const message={stale_version:'This record changed. Close this form and refresh before trying again.',permission_denied:'This operation is not allowed for the current account and policy.'}[r.status]||r.message||r.status;throw Object.assign(Error(message),{code:r.status});}return r;}
  async function refresh(preferredId=selected?.id){
    const ticket=++refreshNumber;loading(true);
    try{
    const discovered=await request('/api/tools');
    tools=discovered.tools;
    const args=clone(config.listArgs||{});
    if(config.queryField&&search.value)args[config.queryField]=search.value;
    const result=await call(config.list,args);if(ticket!==refreshNumber)return;
    version=result.version;records=result[config.collection]||[];
    if(!config.queryField&&search.value)records=records.filter(x=>visibleValue(x).toLowerCase().includes(search.value.toLowerCase()));
    list.replaceChildren();globalActions.replaceChildren();
    for(const action of config.actions.filter(a=>!a.selected&&tools.some(t=>t.name===a.tool)))globalActions.append(actionButton(action));
    for(const item of records){
      const button=el('button',{type:'button',class:'record','aria-pressed':item.id===preferredId,'data-record-id':item.id,onclick:()=>select(item.id).catch(showError)},
        el('span',{class:'record-title'},config.heading(item)),el('span',{class:'record-subtitle'},config.subtitle(item)));
      list.append(button);
    }
    if(!records.length)list.append(el('p',{class:'empty'},'No matching records.'));
    const pick=records.find(x=>x.id===preferredId)||records[0];
    if(pick)await select(pick.id);else{selected=null;detail.replaceChildren(el('div',{class:'empty'},'Create a record to get started.'));}
    status.textContent=records.length+' records · Updated from the App';delete status.dataset.error;
    }finally{if(ticket===refreshNumber)loading(false);}
  }
  async function select(id){
    const ticket=++selectionNumber;loading(true);
    try{
    const result=await call(config.get,{id});if(ticket!==selectionNumber)return;selected=result[config.item]||result.item;version=result.version;
    for(const b of list.querySelectorAll('[data-record-id]'))b.setAttribute('aria-pressed',String(b.dataset.recordId===id));
    recordActions.replaceChildren();
    for(const a of config.actions.filter(a=>a.selected&&(!a.available||a.available(selected))&&tools.some(t=>t.name===a.tool)))recordActions.append(actionButton(a));
    const values=el('dl',{class:'record-values'});
    for(const [key,value]of Object.entries(selected)){
      if(key==='id'||config.hidden?.includes(key))continue;
      values.append(el('dt',{},config.labels?.[key]||title(key)),el('dd',{},visibleValue(value)));
    }
    detail.replaceChildren(el('div',{class:'detail-head'},el('span',{class:'eyebrow'},selected.id),el('h2',{},config.heading(selected)),recordActions),values);
    }finally{if(ticket===selectionNumber)loading(false);}
  }
  function actionButton(action){return el('button',{type:'button',class:action.primary?'primary':'',onclick:()=>open(action).catch(showError)},action.label);}
  function schemaForm(schema,values,parent,prefix='',required=[]){
    const readers=[];
    for(const[key,original]of Object.entries(schema.properties||{})){
      if(['id','expected_version','request_id'].includes(key))continue;
      const nullable=original.anyOf?.some(s=>s.type==='null');
      const s=original.anyOf?.find(x=>x.type!=='null')||original;
      const fieldName=prefix+key,label=config.labels?.[fieldName]||config.labels?.[key]||title(key);
      const value=values?.[key],isRequired=required.includes(key);
      if(s.type==='object'&&key!=='file'){
        const group=el('fieldset',{},el('legend',{},key==='patch'?'Changes':label));parent.append(group);
        const read=schemaForm(s,value||{},group,fieldName+'.',s.required||[]);readers.push(async out=>{const v=await read();if(Object.keys(v).length)out[key]=v;});continue;
      }
      const wrap=el('label',{class:'field'},el('span',{},label+(isRequired?' *':'')));let input;
      if(key==='file'||key==='files'){
        input=el('input',{type:'file',multiple:key==='files',required:isRequired,'data-field':fieldName});
        readers.push(async out=>{if(input.files.length){const files=await Promise.all([...input.files].map(transfer));out[key]=key==='file'?files[0]:files;}});
      }else if(s.enum||s.type==='boolean'){
        input=el('select',{'data-field':fieldName,required:isRequired});
        if(!isRequired)input.append(el('option',{value:''},'Leave unchanged'));
        for(const v of s.enum||[true,false])input.append(el('option',{value:String(v)},s.type==='boolean'?(v?'Yes':'No'):title(String(v))));
        if(value!==undefined)input.value=String(value);
        readers.push(async out=>{if(input.value!=='')out[key]=s.type==='boolean'?input.value==='true':input.value;});
      }else{
        const multi=s.type==='array'||['body','text','description','notes'].includes(key);
        const datetime=s.format==='date-time',type=datetime?'datetime-local':s.type==='integer'||s.type==='number'?'number':'text';
        input=el(multi?'textarea':'input',{...(!multi?{type}:{}),'data-field':fieldName,required:isRequired,
          ...(s.minimum!==undefined?{min:s.minimum}:{}),...(s.maximum!==undefined?{max:s.maximum}:{}),
          ...(s.maxLength?{maxlength:s.maxLength}:{}),...(multi?{rows:4}:{})});
        if(value!==undefined&&value!==null){
          if(datetime){const date=new Date(value);input.value=new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
          else input.value=Array.isArray(value)?value.join('\n'):String(value);
        }
        if(s.type==='array')wrap.append(el('small',{},'One value per line.'));
        if(datetime)wrap.append(el('small',{},'Your browser’s local time.'));
        readers.push(async out=>{
          const v=input.value;
          if(v===''){if(nullable)out[key]=null;else if(s.type==='array'&&(value!==undefined||isRequired))out[key]=[];else if(isRequired||value!==undefined)out[key]='';return;}
          out[key]=s.type==='array'?v.split(/[\n,]/).map(x=>x.trim()).filter(Boolean):datetime?new Date(v).toISOString():['integer','number'].includes(s.type)?Number(v):v;
        });
      }
      wrap.append(input);parent.append(wrap);
    }
    return async()=>{const out={};for(const read of readers)await read(out);return out;};
  }
  async function open(action){
    const tool=tools.find(t=>t.name===action.tool);if(!tool)throw Error('Operation unavailable');
    const item=clone(selected),formVersion=clone(version);let pendingWrite=null;
    let values={...(action.defaults||{}),...(action.prefill? action.prefill(item):{})};
    if(action.selected&&tool.inputSchema.properties.id)values.id=item.id;
    fields.replaceChildren();formError.textContent='';delete formError.dataset.code;formTitle.textContent=action.label;submit.textContent=action.submit||action.label;
    const read=schemaForm(tool.inputSchema,values,fields,'',tool.inputSchema.required||[]);
    if(!fields.children.length)fields.append(el('p',{},item?'Apply this action to “'+config.heading(item)+'”?':'Run this action?'));
    form.onsubmit=async event=>{
      event.preventDefault();if(busy)return;busy=true;submit.disabled=true;formError.textContent='';
      try{
        const args=await read();if(values.id)args.id=values.id;
        // Send only edited fields. A Task may allow rescheduling but forbid title/attendee edits.
        if(args.patch&&item){
          const properties=tool.inputSchema.properties.patch.properties;
          for(const [key,value]of Object.entries(args.patch)){
            const original=item[key],schema=properties[key],date=schema?.format==='date-time'||schema?.anyOf?.some(x=>x.format==='date-time');
            if(JSON.stringify(value)===JSON.stringify(original)||(value===null&&original===undefined)||
              (date&&value&&original&&Date.parse(value)===Date.parse(original)))delete args.patch[key];
          }
          if(!Object.keys(args.patch).length)throw Error('No changes to save.');
        }
        if(tool.inputSchema.properties.expected_version){
          args.expected_version=formVersion;
          const signature=JSON.stringify(args);
          if(!pendingWrite||pendingWrite.signature!==signature)pendingWrite={signature,id:'web-'+crypto.randomUUID()};
          args.request_id=pendingWrite.id;
        }
        const result=await call(action.tool,args);
        if(result.file){const f=result.file;download(f.filename,f.mime_type,Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0)));}
        if(result.text&&result.mime_type)download('event.ics',result.mime_type,result.text);
        if(action.exportResult)download(action.exportResult,'application/json',JSON.stringify(result,null,2));
        dialog.close();await refresh(result.id||item?.id);
        if(!tool.inputSchema.properties.expected_version&&!result.file&&!result.text&&!action.exportResult){
          const output=el('section',{class:'query-result'},el('h3',{},action.label));
          for(const [key,value]of Object.entries(result))if(!['status','version','app_id'].includes(key))output.append(el('h4',{},title(key)),el('pre',{},visibleValue(value)));
          detail.append(output);
        }
        status.textContent=action.success||'Action completed.';
      }catch(e){formError.textContent=e.message;formError.dataset.code=e.code||'request_failed';}
      finally{busy=false;submit.disabled=false;}
    };
    dialog.showModal();fields.querySelector('input,textarea,select')?.focus();
  }
  search.addEventListener('input',()=>refresh().catch(showError));
  try{
    const token=new URLSearchParams(location.hash.slice(1)).get('access');
    if(token){history.replaceState(null,'',location.pathname);({csrf}=await request('/session','POST',{token}));}
    else ({csrf}=await request('/session'));
    await refresh();
  }catch(e){showError(e);}
}
