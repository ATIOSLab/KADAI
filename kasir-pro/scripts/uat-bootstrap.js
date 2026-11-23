/* UAT bootstrap — fixture isDemo minimal + uji login nyata (deterministik) */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PW = 'UatDemo#2026';
const TYPES = ['FNB_CAFE'];
const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'INVENTORY', 'ACCOUNTANT'];

async function cleanup() {
  await prisma.store.deleteMany({ where: { isDemo: true, name: { startsWith: 'UAT·' } } });
  await prisma.user.deleteMany({ where: { isDemo: true, email: { startsWith: 'uat.' } } });
}

async function main() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 10);
  const out = { stores: [], logins: [] };

  for (const type of TYPES) {
    const store = await prisma.store.create({
      data: { name: `UAT·${type}`, businessType: type, tier: 'ENTERPRISE', isDemo: true },
    });
    const outlet = await prisma.outlet.create({
      data: { name: 'Outlet UAT', code: `UAT-${type}-${Date.now()}`, storeId: store.id, isDemo: true, isMain: true },
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
    }
    out.stores.push({ type, storeId: store.id, outletId: outlet.id, users });
  }

  const sa = await prisma.user.create({
    data: { name: 'UAT SUPER_ADMIN', email: 'uat.superadmin@kadai.asia', passwordHash: hash, role: 'SUPER_ADMIN', isDemo: true },
  });
  out.stores.push({ type: 'SUPER_ADMIN', storeId: null, outletId: null, users: [{ id: sa.id, role: 'SUPER_ADMIN', email: sa.email, version: sa.updatedAt.toISOString() }] });

  // Uji login nyata per role (1x per akun — aman di bawah rate limit)
  const loginTargets = out.stores.flatMap(s => s.users);
  for (const u of loginTargets) {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${Math.floor(u.id.length)}.${out.stores.length}` },
        body: JSON.stringify({ email: u.email, password: PW }),
      });
      const body = await res.text();
      const cookie = res.headers.get('set-cookie') || '';
      out.logins.push({ email: u.email, role: u.role, status: res.status, hasCookie: cookie.includes('session='), snippet: body.slice(0, 120) });
    } catch (e) {
      out.logins.push({ email: u.email, role: u.role, status: 'ERR', hasCookie: false, snippet: String(e).slice(0, 120) });
    }
  }
  console.log('===UAT_JSON_BEGIN===');
  console.log(JSON.stringify(out));
  console.log('===UAT_JSON_END===');
}

main().finally(() => prisma.$disconnect());
