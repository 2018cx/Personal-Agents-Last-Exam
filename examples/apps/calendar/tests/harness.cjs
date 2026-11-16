'use strict';
// In-memory unit-test fixture, not a platform runtime or security boundary.
const plugin=require('../plugin.cjs');
function fixture(){
 let data=structuredClone(require('../fixtures/minimal.json'));
 const ctx={app_id:require('../app.json').app_id,virtual_now:'2026-11-15T09:00:00-08:00',binding:structuredClone(require('../fixtures/binding.json'))};
 plugin.validateSeed(ctx,data);
 return {ctx,get data(){return structuredClone(data);},
  call(name,args={}){const out=plugin.handleTool(ctx,structuredClone(data),name,args);plugin.validateSeed(ctx,out.data);data=out.data;return structuredClone(out.result);},
  event(event){const out=plugin.applyEvent(ctx,structuredClone(data),structuredClone(event));plugin.validateSeed(ctx,out);data=out;return structuredClone(data);}
 };
}
module.exports={fixture};
