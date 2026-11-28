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
// Six independently authored timelines. First/last are UTC calendar-month offsets
// from January 2025; each subscriber keeps their own billing anniversary.
const profiles=[
 {first:0,last:12,day:1,hour:0,min:0,saves:[[0,8,20,14],[2,2,6,51],[11,23,14,7]],clock:[12,14,7,18],status:'paid_active',actions:[]},
 {first:3,last:11,day:9,hour:7,min:24,saves:[[3,12,8,30],[4,25,21,5],[10,11,18,17]],clock:[12,9,9,12],status:'free',actions:[['cancel',[9,21,6,49],[9,21,7,3]],['revoke',[9,24,16,21],[9,24,20,35]],['cancel',[11,28,18,41],[11,29,9,27]]]},
 {first:10,last:12,day:19,hour:16,min:6,saves:[[10,19,21,55],[11,4,11,28],[12,22,8,13]],clock:[12,31,18,3],status:'cancellation_scheduled',actions:[['cancel',[12,29,11,38],[12,29,11,45]]]},
 {first:12,last:16,day:26,hour:5,min:53,saves:[[12,28,5,44],[13,18,19,2],[16,27,8,59]],clock:[17,7,16,42],status:'paid_active',actions:[['cancel',[15,2,22,5],[15,2,22,7]],['revoke',[15,18,16,25],[15,19,4,51]]]},
 {first:15,last:21,day:5,hour:13,min:11,saves:[[15,7,8,31],[17,12,20,44],[20,14,16,6]],clock:[22,5,16,33],status:'free',actions:[['cancel',[21,17,10,12],[21,20,8,20]]]},
 {first:19,last:23,day:12,hour:19,min:39,saves:[[19,13,7,15],[21,23,21,52],[23,31,12,6]],clock:[23,31,20,14],status:'paid_active',actions:[['cancel',[21,26,14,6],[21,26,15,51]],['revoke',[22,4,12,27],[22,4,12,30]]]}
];
const t=(m,day,h,min=0)=>new Date(Date.UTC(2025,m,day,h,min)).toISOString();
const partition=(person,index)=>{
 const p=profiles[index], account_id='listener-cohort-'+(index+1);
 const boundary=m=>t(m,p.day,p.hour,p.min);
 const free=p.status==='free', clock=t(...p.clock);
 const seed={account_id,status:p.status,period_start:boundary(p.last),period_end:boundary(p.last+1),next_period_end:boundary(p.last+2),
  phase:free?1:0,decision_revision:0,ended_at:free?boundary(p.last+1):null,
  saved:media[index].map((title,i)=>({id:'media-'+(i+1),title,saved_at:t(...p.saves[i])})),
  history:[],previews:[],action_receipts:[]};
 const timeline=[{kind:'subscription_started',at:boundary(p.first)}];
 for(let j=p.first+1;j<=p.last;j++)timeline.push({kind:'period_started',at:boundary(j)});
 let decision='paid_active';
 for(const [action,created,confirmed] of p.actions){
  const n=seed.previews.length+1, at=t(...confirmed), created_at=t(...created);
  const effective_at=boundary(at<boundary(confirmed[0])?confirmed[0]:confirmed[0]+1);
  if(!(created_at<=at&&at<effective_at&&at<=clock)||((action==='cancel')!==(decision==='paid_active')))throw Error('Invalid authored action');
  decision=action==='cancel'?'cancellation_scheduled':'paid_active';
  seed.previews.push({id:'SE-P'+n,action,status:'confirmed',phase:0,decision_revision:n-1,created_at});
  seed.action_receipts.push({id:'SE-R'+n,preview_id:'SE-P'+n,action,confirmed_at:at,resulting_status:decision,effective_at});
  timeline.push({kind:action==='cancel'?'cancellation_scheduled':'cancellation_revoked',at});
  seed.decision_revision++;
 }
 if(free){
  if(decision!=='cancellation_scheduled'||seed.action_receipts.at(-1).effective_at!==seed.ended_at||clock<seed.ended_at)throw Error('Inconsistent ended account');
  timeline.push({kind:'paid_access_ended',at:seed.ended_at});
 }else if(decision!==seed.status||!(seed.period_start<=clock&&clock<seed.period_end))throw Error('Inconsistent paid account');
 seed.history=timeline.sort((a,b)=>a.at.localeCompare(b.at)).map((e,i)=>({id:'history-'+(i+1),...e}));
 const binding={people:[{person_id:account_id,name:person}],accounts:[{app_id:'subscription-exit',account_id,owner_person_id:account_id}],
  objects:{'subscription-exit':['plan-1',...['saved','history','previews','action_receipts'].flatMap(k=>seed[k].map(r=>r.id))]}};
 return {label:person,virtual_now:clock,binding,seed};
};
const generate=()=>JSON.stringify({dataset_id:'subscription-exit-evaluation-v2',source:'original-deterministic-synthetic',timezone:'UTC',accounts:people.map(partition)},null,2)+'\n';
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
 return '# Subscription Exit evaluation history (v2)\n\n'+
  'Origin: **100% original synthetic, MIT**. No external account data or media; explanation derived from public product documentation only. Synthetic December 2026 records are simulated, not observed. A November real-data anchor does not apply to these fictional private accounts (see #20 delivery review).\n\n'+
  '- Source: `accounts-v1.json`, SHA-256 `'+digest+'`. Six independently bound, overlapping subscriber histories with distinct billing anniversaries, load clocks, saved-entry times and varied cancel/withdrawal patterns. Three start active, one starts with revocable cancellation, and two start shortly after documented paid access ended. The smoke defaults are not counted.\n'+
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
