'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const corpus=path.join(__dirname,'accounts-v1.json'),report=path.join(__dirname,'COVERAGE.md');
const people=['Theo Maren','Ada Solberg','Ivo Calder','Noor Vale','Mina Hartwell','Eli Sato'];
const media=[
 ['After the Ferry','Low-Tide Letters','Kitchen Table Sessions'],
 ['Glass Orchard','The Paper Observatory','Four Lanterns'],
 ['Wait for Dawn','The Quiet Viaduct','Garden Weather'],
 ['Pocket Astronomer','Cedar and Silt','Northbound Trio'],
 ['Blue Courtyard','Canal at Dusk','Seven Small Winters'],
 ['Hidden Bearings','Patterns in Snow','Lights Above Harlow']
];
const t=(m,day=1,h=0)=>new Date(Date.UTC(2025,m,day,h)).toISOString();
const seedAt=(m,day=1)=>t(m,day,18);
const partition=(person,index)=>{
 const first=index*4, m=first+3, account_id='listener-cohort-'+(index+1);
 const free=index===2||index===4, pending=index===1||index===3;
 const clock=free?t(m+1,1,0):seedAt(index===5?23:m,index===5?31:27);
 const seed={account_id,status:free?'free':pending?'cancellation_scheduled':'paid_active',
  period_start:t(m),period_end:t(m+1),next_period_end:t(m+2),phase:free?1:0,decision_revision:0,ended_at:free?t(m+1):null,
  saved:media[index].map((title,i)=>({id:'media-'+(i+1),title,saved_at:t(first+(i===2?3:i),i===2&&index===5?31:[3,12,19][i],11)})),
  history:[{id:'history-1',kind:'subscription_started',at:t(first)}],previews:[],action_receipts:[]};
 function hist(kind, at){seed.history.push({id:'history-'+(seed.history.length+1),kind,at});}
 function receive(action,month,day){
  const n=seed.previews.length+1, at=t(month,day,15), p={id:'SE-P'+n,action,status:'confirmed',phase:0,decision_revision:n-1,created_at:t(month,day,14)};
  seed.previews.push(p);
  seed.action_receipts.push({id:'SE-R'+n,preview_id:p.id,action,confirmed_at:at,resulting_status:action==='cancel'?'cancellation_scheduled':'paid_active',effective_at:t(month+1)});
  hist(action==='cancel'?'cancellation_scheduled':'cancellation_revoked',at);
  seed.decision_revision++;
 }
 for(let j=first+1;j<=m;j++){
  hist('period_started',t(j));
  if(j===m-1&&(index!==2&&index!==1)){receive('cancel',j,8+index);receive('revoke',j,18+index);}
  if(j===m&&(free||pending))receive('cancel',j,15+index);
 }
 if(free)hist('paid_access_ended',seed.ended_at);
 const binding={people:[{person_id:account_id,name:person}],accounts:[{app_id:'subscription-exit',account_id,owner_person_id:account_id}],
  objects:{'subscription-exit':['plan-1',...['saved','history','previews','action_receipts'].flatMap(k=>seed[k].map(r=>r.id))]}};
 return {label:person,virtual_now:new Date(Math.max(Date.parse(clock),Date.parse('2026-01-01T01:00:00Z'))).toISOString(), binding,seed};
};
const generate=()=>JSON.stringify({dataset_id:'subscription-exit-evaluation-v1',source:'original-deterministic-synthetic',timezone:'UTC',accounts:people.map(partition)},null,2)+'\n';
function summarize(bytes){
 const x=JSON.parse(bytes),parts={history:'at',saved:'saved_at',action_receipts:'confirmed_at'};
 const totals=Object.fromEntries(Object.keys(parts).map(k=>[k,new Set()])),all=new Set(),counts=new Map();let records=0;
 for(const {seed} of x.accounts)for(const [kind,field] of Object.entries(parts))for(const item of seed[kind]){
  const when=new Date(item[field]).toISOString(),day=when.slice(0,10),month=day.slice(0,7);
  if(day<'2025-01-01'||day>'2026-12-31')throw Error('Unexpected out-of-window date: '+day);
  const c=counts.get(month)||{history:0,saved:0,action_receipts:0,dates:new Set()};
  c[kind]++;c.dates.add(day);counts.set(month,c);records++;totals[kind].add(day);all.add(day);
 }
 const dates=[...all].sort(), digest=crypto.createHash('sha256').update(bytes).digest('hex');
 const rows=[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([k,c])=>'| '+[k,c.history,c.saved,c.action_receipts,c.dates.size].join(' | ')+' |').join('\n');
 return '# Subscription Exit evaluation history (v1)\n\n'+
  'Origin: **100% original synthetic, MIT**. No external account data or media; explanation derived from public product documentation only. Synthetic December 2026 records are simulated, not observed. A November real-data anchor does not apply to these fictional private accounts (see #20 delivery review).\n\n'+
  '- Source: `accounts-v1.json`, SHA-256 `'+digest+'`. Six independently bound accounts across six four-month cohorts, with active, scheduled and ended subscriptions, retained selections and cancel/withdrawal confirmation history. The smoke defaults are not counted.\n'+
  '- Occurrence fields: `history.at`, `saved.saved_at`, `action_receipts.confirmed_at` (UTC); '+records+' dated records; '+all.size+' global distinct days; '+dates[0]+'–'+dates.at(-1)+'. Distinct dates by record source: '+Object.entries(totals).map(([k,v])=>k+' '+v.size).join(', ')+'.\n'+
  '- '+counts.size+'/24 months. No missing months, malformed or out-of-window counted dates. Preview creation is an intermediate action and excluded; scenario clocks, future period/renewal boundaries and receipt effective dates do not count again.\n'+
  '- Before each independent run, load only that account through `env.load_seed` with its exact `binding`, `seed`, and `virtual_now`. Keep the run policy and replace the old smoke bundle\'s dataset expected count (saved + history + previews + receipts). `node tests/core.cjs` verifies all six loads and reads via real public Agent MCP; no later records are exposed to an earlier first session.\n'+
  '- Recount actual delivered bytes: `node evaluation/build.cjs --check`. Deterministically rebuild the dataset and report: `node evaluation/build.cjs`.\n\n'+
  '| Month | Subscription history | Saved entries | Confirmation receipts | Distinct dates (dedup) |\n| --- | ---: | ---: | ---: | ---: |\n'+rows+'\n';
}
if(process.argv.includes('--check')){
 const bytes=fs.readFileSync(corpus,'utf8'), summary=summarize(bytes);
 if(bytes!==generate()||summary!==fs.readFileSync(report,'utf8'))throw Error('Corpus or report is not reproducible');
 console.log(summary);
}else{
 const bytes=generate();fs.writeFileSync(corpus,bytes);fs.writeFileSync(report,summarize(bytes));
}
