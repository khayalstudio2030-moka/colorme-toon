// تخزين بسيط للطلبات في ملف JSON — كفاية للبداية. لما الطلبات تكتر انقله لـ Postgres/Supabase.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'orders.json');
let orders = {};

function load() {
  try { orders = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { orders = {}; }
}
function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2));
  fs.renameSync(tmp, FILE);
}

load();

module.exports = {
  get: (id) => orders[id] || null,
  all: () => Object.values(orders),
  create(order) { orders[order.id] = order; save(); return order; },
  update(id, patch) {
    if (!orders[id]) return null;
    orders[id] = { ...orders[id], ...patch, updatedAt: new Date().toISOString() };
    save();
    return orders[id];
  },
};
