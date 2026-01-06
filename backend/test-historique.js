const http = require('http');

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  // Login
  const login = await request('POST', '/api/utilisateurs/login', {
    email: 'sophie.dubois@voltige.fr',
    mot_de_passe: 'Password123!'
  });

  const token = login.data.token;
  const headers = { 'Authorization': `Bearer ${token}` };

  // Test historique endpoint
  console.log('📊 Test GET /api/entrainement/historique/utilisateur/6?limit=5');
  const historique = await request('GET', '/api/entrainement/historique/utilisateur/6?limit=5', null, headers);

  console.log('Status:', historique.status);
  if (historique.status === 200) {
    console.log(`✅ ${historique.data.length} tentatives récupérées`);
    if (historique.data.length > 0) {
      console.log('Première tentative:', JSON.stringify(historique.data[0], null, 2));
    }
  } else {
    console.log('❌ Erreur:', historique.data);
  }
}

test().catch(console.error);
