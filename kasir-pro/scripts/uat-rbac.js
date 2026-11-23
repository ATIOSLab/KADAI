/* UAT RBAC penuh — 9 jenis usaha × 6 role tenant + SUPER_ADMIN.
   Berjalan DI DALAM container (node, NODE_PATH=/app/node_modules).
   Login nyata → cookie → probe 30 halaman + 14 API terpilih. Output JSON. */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PW = 'UatDemo#2026';
const BASE = 'http://127.0.0.1:3000';
const TYPES = ['RETAIL', 'FNB_CAFE', 'FNB_RESTAURANT', 'FNB_WARUNG', 'CATERING', 'SERVICE', 'LAUNDRY', 'BUILDING_SUPPLY', 'PHARMACY'];
const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'INVENTORY', 'ACCOUNTANT'];

const PAGES = [
  '/dashboard', '/pos', '/tables', '/kds', '/catering', '/laundry', '/products', '/units',
  '/inventory', '/inventory/adjustments', '/inventory/restock', '/inventory/transfers',
  '/suppliers', '/customers', '/sales', '/shifts', '/reports', '/finance', '/finance/tax',
  '/outlets', '/activity-log', '/settings', '/profile', '/referrals', '/demo-requests',
  '/platform', '/platform/owners', '/platform/plans', '/platform/subscriptions', '/platform/bot',
];

// API probes: [label, role, method, path, body?] — mutasi diberi Origin utk CSRF
const API_PROBES = [
  ['cashier-put-outlets', 'CASHIER', 'PUT', '/api/outlets', {}],
  ['cashier-post-products', 'CASHIER', 'POST', '/api/products', {}],
  ['kitchen-post-products', 'KITCHEN', 'POST', '/api/products', {}],
  ['kitchen-get-finance', 'KITCHEN', 'GET', '/api/finance'],
  ['inventory-get-finance', 'INVENTORY', 'GET', '/api/finance'],
  ['accountant-get-outlets', 'ACCOUNTANT', 'GET', '/api/outlets'],
  ['admin-get-platform-owners', 'ADMIN', 'GET', '/api/platform/owners'],
  ['superadmin-get-finance', 'SUPER_ADMIN', 'GET', '/api/finance'],
  ['cashier-get-products', 'CASHIER', 'GET', '/api/products'],
  ['cashier-get-tables-fnb', 'CASHIER', 'GET', '/api/tables'],
  ['cashier-get-tables-retail', 'CASHIER', 'GET', '/api/tables'],
  ['kitchen-get-kds-fnb', 'KITCHEN', 'GET', '/api/kds'],
  ['manager-post-tables', 'MANAGER', 'POST', '/api/tables', {}],
  ['cashier-post-sales', 'CASHIER', 'POST', '/api/sales', {}],
];

async function cleanup() {
  await prisma.store.deleteMany({ where: { isDemo: true, name: { startsWith: 'UAT·' } } });
  await prisma.user.deleteMany({ where: { isDemo: true, email: { startsWith: 'uat.' } } });
}

async function login(email, idx) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: BASE,
      'x-forwarded-for': `10.240.${Math.floor(idx / 250)}.${(idx % 250) + 2}`,
    },
    body: JSON.stringify({ email, password: PW }),
  });
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
  return { status: res.status, cookie: cookie && cookie.startsWith('session=') ? cookie : null, body: (await res.text()).slice(0, 90) };
}

async function httpWithCookie(method, path, cookie, body) {
  const headers = { cookie: cookie || '', 'user-agent': 'KADAI-UAT/1.0' };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    headers.origin = BASE; // CSRF Origin/Host match
  }
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  return { status: res.status, loc: loc.slice(0, 60) };
}

async function main() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 10);
  const fixtures = [];   // {type, storeId, users:[{id,role,email,version}]}
  let idx = 0;

  for (const type of TYPES) {
    const store = await prisma.store.create({
      data: { name: `UAT·${type}`, businessType: type, tier: 'ENTERPRISE', isDemo: true },
    });
    const outlet = await prisma.outlet.create({
      data: { name: 'Outlet UAT', code: `UAT-${type}-${Date.now()}-${idx}`, storeId: store.id, isDemo: true, isMain: true },
    });
    const users = [];
    for (const role of ROLES) {
      const u = await prisma.user.create({
        data: {
          name: `UAT ${type} ${role}`, email: `uat.${type.toLowerCase()}.${role.toLowerCase()}@kadai.asia`,
          passwordHash: hash, role, isDemo: true, storeId: store.id, outletId: outlet.id,
        },
      });
      users.push({ id: u.id, role, email: u.email, version: u.updatedAt.toISOString() });
      idx++;
    }
    fixtures.push({ type, storeId: store.id, outletId: outlet.id, users });
  }
  const sa = await prisma.user.create({
    data: { name: 'UAT SUPER_ADMIN', email: 'uat.superadmin@kadai.asia', passwordHash: hash, role: 'SUPER_ADMIN', isDemo: true },
  });
  fixtures.push({ type: 'SUPER_ADMIN', storeId: null, outletId: null, users: [{ id: sa.id, role: 'SUPER_ADMIN', email: sa.email, version: sa.updatedAt.toISOString() }] });

  // 1) Login nyata semua akun → cookie
  const sessions = {}; // `${type}:${role}` -> cookie
  const loginResults = [];
  idx = 0;
  for (const f of fixtures) {
    for (const u of f.users) {
      const r = await login(u.email, idx++);
      loginResults.push({ type: f.type, role: u.role, status: r.status, ok: !!r.cookie, body: r.body });
      if (r.cookie) sessions[`${f.type}:${u.role}`] = r.cookie;
    }
  }

  // 2) Probe halaman (hanya yang berhasil login)
  const pageResults = [];
  for (const f of fixtures) {
    for (const u of f.users) {
      const key = `${f.type}:${u.role}`;
      if (!sessions[key]) continue;
      for (const p of PAGES) {
        const r = await httpWithCookie('GET', p, sessions[key]);
        pageResults.push({ type: f.type, role: u.role, path: p, status: r.status, loc: r.loc });
      }
    }
  }

  // 3) Probe API (pakai store FNB_CAFE / RETAIL / SUPER_ADMIN)
  const apiResults = [];
  const apiCtx = {
    'CASHIER': sessions['FNB_CAFE:CASHIER'],
    'KITCHEN': sessions['FNB_CAFE:KITCHEN'],
    'INVENTORY': sessions['FNB_CAFE:INVENTORY'],
    'ACCOUNTANT': sessions['FNB_CAFE:ACCOUNTANT'],
    'ADMIN': sessions['FNB_CAFE:ADMIN'],
    'MANAGER': sessions['FNB_CAFE:MANAGER'],
    'SUPER_ADMIN': sessions['SUPER_ADMIN:SUPER_ADMIN'],
  };
  for (const [label, role, method, path, body] of API_PROBES) {
    const cookie = apiCtx[role];
    if (!cookie) { apiResults.push({ label, role, path, method, status: 'NO_SESSION' }); continue; }
    // cashier-get-tables-retail pakai store RETAIL
    const useCookie = label === 'cashier-get-tables-retail' ? sessions['RETAIL:CASHIER'] : cookie;
    const r = await httpWithCookie(method, path, useCookie, body);
    apiResults.push({ label, role, path, method, status: r.status, loc: r.loc });
  }

  console.log('===UAT_JSON_BEGIN===');
  console.log(JSON.stringify({ fixtures: fixtures.map(f => ({ type: f.type, storeId: f.storeId, outletId: f.outletId, users: f.users.map(u => ({ role: u.role, email: u.email })) })), loginResults, pageResults, apiResults }));
  console.log('===UAT_JSON_END===');
}

main().finally(() => prisma.$disconnect());
