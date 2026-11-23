/* UAT post-deploy: funnel /register→demo-requests + gating Warung vs Kafe */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3000';
const PW = 'UatDemo#2026';

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '10.240.77.9' },
    body: JSON.stringify({ email, password: PW }),
  });
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
  return { status: res.status, cookie: cookie && cookie.startsWith('session=') ? cookie : null };
}
async function get(path, cookie) {
  const res = await fetch(BASE + path, { headers: { cookie: cookie || '' }, redirect: 'manual' });
  return { status: res.status, loc: res.headers.get('location') || '' };
}

async function main() {
  // 1) Funnel: POST /api/demo-requests (seperti /register baru)
  const dr = await fetch(`${BASE}/api/demo-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '10.240.77.10' },
    body: JSON.stringify({
      fullName: 'UAT Funnel Test', businessName: 'UAT·Funnel-Test', businessType: 'FNB_CAFE',
      phone: '0812-0000-0000', email: 'uat.funneltest@kadai.asia', outletCount: 1,
      notes: '[Minat paket: PRO_BUSINESS]',
    }),
  });
  const drBody = await dr.json();
  console.log('FUNNEL /api/demo-requests ->', dr.status, JSON.stringify(drBody).slice(0, 160));

  let leadId = drBody?.data?.id || null;
  if (dr.status === 201) {
    const lead = await prisma.demoRequest.findUnique({ where: { id: leadId } });
    console.log('LEAD DB:', lead ? { id: lead.id, businessName: lead.businessName, status: lead.status, accessCode: lead.accessCode } : 'TIDAK ADA');
  }

  // 2) Gating: Warung vs Kafe (admin)
  const w = await login('uat.fnb_warung.admin@kadai.asia');
  const c = await login('uat.fnb_cafe.admin@kadai.asia');
  console.log('LOGIN warung/cafe admin ->', w.status, c.status);
  if (w.cookie) {
    const wt = await get('/tables', w.cookie);
    const wp = await get('/pos', w.cookie);
    const wu = await get('/units', w.cookie);
    console.log('WARUNG admin: /tables ->', wt.status, wt.loc, '| /pos ->', wp.status, '| /units ->', wu.status);
  }
  if (c.cookie) {
    const ct = await get('/tables', c.cookie);
    const cp = await get('/pos', c.cookie);
    console.log('CAFE admin:   /tables ->', ct.status, ct.loc, '| /pos ->', cp.status);
  }

  // 3) Bersihkan lead uji (fixture user tetap sampai purge penuh)
  if (leadId) {
    await prisma.demoRequest.delete({ where: { id: leadId } }).catch(() => {});
    console.log('LEAD UJI DIPURGE:', leadId);
  }
}
main().finally(() => prisma.$disconnect());
