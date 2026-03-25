const http = require('http');

// Cleanup script: deletes old generic-named clients (Pondy Client X, Chennai Tech Park, etc.)
const ADMIN_EMAIL = 'admin@fems.com';
const ADMIN_PASSWORD = 'admin123';

const OLD_CLIENT_PATTERNS = [
  /^pondy client \d+$/i,
  /^chennai tech park$/i,
  /^coimbatore mills$/i,
  /^madurai textiles$/i,
  /^trichy engineering$/i,
  /^salem steel works$/i,
  /^villupuram logistics$/i,
  /^[a-z]+ client \d+$/i,   // e.g. "Chennai Client 1", "Madurai Client 3"
];

function apiRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Login
  const loginRes = await apiRequest({
    hostname: 'localhost', port: 8080, path: '/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const { token } = JSON.parse(loginRes.body);
  if (!token) { console.error("Login failed:", loginRes.body); return; }
  console.log("Logged in. Fetching client list...");

  const AUTH = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Fetch all clients
  const clientsRes = await apiRequest({ hostname: 'localhost', port: 8080, path: '/admin/clients', method: 'GET', headers: AUTH });
  const clients = JSON.parse(clientsRes.body);
  console.log(`Total clients: ${clients.length}`);

  // 3. Find old generic ones
  const toDelete = clients.filter(c => {
    const name = (c.user?.name || '').toLowerCase().trim();
    return OLD_CLIENT_PATTERNS.some(p => p.test(name));
  });

  console.log(`Found ${toDelete.length} old generic clients to delete.`);

  // 4. Delete them one by one
  let deleted = 0;
  for (const c of toDelete) {
    const res = await apiRequest({
      hostname: 'localhost', port: 8080,
      path: `/admin/clients/${c.id}`,
      method: 'DELETE',
      headers: AUTH
    });
    if (res.status === 200 || res.status === 204) {
      console.log(`  ✅ Deleted: ${c.user?.name} (id=${c.id})`);
      deleted++;
    } else {
      console.log(`  ❌ Failed to delete: ${c.user?.name} (id=${c.id}) → ${res.status} ${res.body}`);
    }
  }

  console.log(`\nDone. Deleted ${deleted}/${toDelete.length} old clients.`);
}

main().catch(console.error);
