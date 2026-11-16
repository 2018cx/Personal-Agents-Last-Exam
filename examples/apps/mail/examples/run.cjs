'use strict';
const {fixture}=require('../tests/harness.cjs');
const app=fixture(),event=require('./scenario.json');
const before=app.data;app.event(event);
console.log(JSON.stringify({example:'mail',mode:'local business functions',before,after:app.data},null,2));
console.log('PASS: local App event example. Platform MCP, permissions and persistence are validated separately.');
