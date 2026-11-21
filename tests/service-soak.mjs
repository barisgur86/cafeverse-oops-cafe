// One hour of virtual server time; disposable engine, never live player data.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { gameEngine, catalog } from '../source/server/secure/engine.mjs';
let now = 1_000_000;
const account = '99999999-9999-4999-8999-999999999999';
let engine = gameEngine(account, null, () => now);
const seed = engine.exportSave();
Object.assign(seed, { served: 30, claimed: true, attracted: 2000, coins: 10000,
 bought: catalog.upgrades.map(u => u.id), pantry: Object.fromEntries(catalog.ITEMS.map(i => [i, 5000])) });
engine.importSave(seed);
const call = (path, body) => engine.handle(path, body && { request_id: crypto.randomUUID(), ...body });
const initial = engine.snapshot();
let customers = 0;
for (let minute = 0; minute < 60; minute++) {
 const orders = [1, 2, 3, null].map(table => ({ id: crypto.randomUUID(), mode: table === null ? 'takeaway' : 'table', table,
  items: Array.from({ length: table === null ? 1 : 3 }, () => ({ recipe: 0 })) }));
 for (const order of orders) assert.equal(call('/api/service-orders/open', { order }).status, 200);
 now += 2200;
 const trays = orders.map(order => order.items.map((item, i) => {
  const result = call('/api/preparations', { amounts: catalog.FORMULAS[0], order_id: order.id, customer_id: order.id + ':' + i });
  assert.equal(result.status, 200); return result.preparation.id;
 }));
 // Reload before readiness without losing any preparation IDs.
 const saved = engine.exportSave(); engine = gameEngine(account, saved, () => now);
 assert.deepEqual(engine.exportSave(), saved);
 now += 6000;
 for (const index of [2, 3, 0, 1]) {
  const order = orders[index], body = { request_id: crypto.randomUUID(), order_id: order.id, mode: order.mode,
   table: order.table, customers: order.items.map((_, i) => order.id + ':' + i), preparations: trays[index] };
  assert.equal(call('/api/service-batches/serve', { ...body, table: order.table === null ? 1 : 99 }).status, 409);
  assert.equal(call('/api/service-batches/serve', body).status, 200);
  const balance = engine.snapshot().coins;
  assert.equal(call('/api/service-batches/serve', body).state.coins, balance);
  assert.equal(call('/api/service-batches/serve', { ...body, request_id: crypto.randomUUID() }).status, 409);
  assert.equal(engine.snapshot().coins, balance); customers += order.items.length;
 }
 assert.ok(engine.snapshot().coins >= 0);
 now += 51800;
}
assert.equal(now, 4_600_000);
assert.equal(customers, 600);
assert.equal(engine.snapshot().served, initial.served + customers);
assert.equal(engine.snapshot().coins, initial.coins + customers * 35);
console.log('PASS 60-minute VIRTUAL engine soak: 600 guests, 180 three-product tables, 60 independent packages, reload each minute, wrong-route rejection, idempotent retry and duplicate reward prevention; no wall-clock/device claim.');
