import fs from 'node:fs';
const consumer=JSON.parse(fs.readFileSync('ghrab-platform.consumer.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('src/config/performance-budget-baseline.json','utf8'));
const actual=consumer.quality?.performanceBudget||{};
const expected=baseline.budgets||{};
const keys=Object.keys(expected);
const changed=keys.filter(key=>actual[key]!==expected[key]);
if(changed.length){console.error('[budget-freeze] FAIL: '+changed.map(key=>`${key} ${actual[key]} != ${expected[key]}`).join('; '));process.exit(1)}
console.log(`[budget-freeze] PASS: ${keys.length} stropů zmrazeno od ${baseline.frozenAtVersion}`);
