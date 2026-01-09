#!/usr/bin/env node

/**
 * Script de configuration réseau pour Cirque App
 * Détecte automatiquement l'IP locale et met à jour les fichiers de configuration
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Détecte l'IP locale de la machine
 */
function detectLocalIP() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4, non interne (pas 127.0.0.1), actif
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          name: name,
          ip: iface.address
        });
      }
    }
  }

  return ips;
}

/**
 * Met à jour docker-compose.yml avec la nouvelle IP
 */
function updateDockerCompose(ip) {
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  let content = fs.readFileSync(dockerComposePath, 'utf8');

  // Remplacer la ligne REACT_APP_API_URL
  content = content.replace(
    /REACT_APP_API_URL:\s*http:\/\/[\d.]+:4000/,
    `REACT_APP_API_URL: http://${ip}:4000`
  );

  fs.writeFileSync(dockerComposePath, content, 'utf8');
  console.log(`✅ docker-compose.yml mis à jour avec IP: ${ip}`);
}

/**
 * Met à jour frontend/.env.local avec la nouvelle IP
 */
function updateFrontendEnv(ip, useLocalhost = false) {
  const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
  const apiUrl = useLocalhost ? 'http://localhost:4000' : `http://${ip}:4000`;

  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(
      /REACT_APP_API_URL=.*/,
      `REACT_APP_API_URL=${apiUrl}`
    );
  } else {
    content = `# Configuration développement local
HOST=0.0.0.0
PORT=3000
REACT_APP_API_URL=${apiUrl}
`;
  }

  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`✅ frontend/.env.local mis à jour avec: ${apiUrl}`);
}

/**
 * Affiche la configuration réseau
 */
function displayConfig(ip) {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 Configuration Réseau - Cirque App');
  console.log('='.repeat(60));
  console.log('\n📍 Votre IP locale:', ip);
  console.log('\n🔗 URLs d\'accès:');
  console.log(`   - PC hôte:        http://localhost:3000`);
  console.log(`   - Réseau local:   http://${ip}:3000`);
  console.log('\n📡 API Backend:');
  console.log(`   - PC hôte:        http://localhost:4000`);
  console.log(`   - Réseau local:   http://${ip}:4000`);
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Programme principal
 */
function main() {
  console.log('🔍 Détection de votre IP locale...\n');

  const ips = detectLocalIP();

  if (ips.length === 0) {
    console.error('❌ Aucune interface réseau active détectée');
    console.log('💡 Vérifiez que vous êtes connecté à un réseau (Wi-Fi ou Ethernet)');
    process.exit(1);
  }

  console.log('📱 Interfaces réseau détectées:');
  ips.forEach((iface, index) => {
    console.log(`   ${index + 1}. ${iface.name}: ${iface.ip}`);
  });
  console.log('');

  // Prendre la première IP détectée (généralement Wi-Fi ou Ethernet principal)
  const selectedIP = ips[0].ip;
  console.log(`✓ IP sélectionnée: ${selectedIP} (${ips[0].name})\n`);

  // Demander le mode de configuration
  const args = process.argv.slice(2);
  const mode = args[0] || 'network';

  if (mode === 'localhost') {
    console.log('🏠 Configuration pour développement local (localhost uniquement)...\n');
    updateFrontendEnv(selectedIP, true);
  } else if (mode === 'network') {
    console.log('🌐 Configuration pour accès réseau local...\n');
    updateDockerCompose(selectedIP);
    updateFrontendEnv(selectedIP, false);
  } else {
    console.error('❌ Mode invalide. Utilisez "localhost" ou "network"');
    process.exit(1);
  }

  displayConfig(selectedIP);

  console.log('✅ Configuration terminée!\n');
  console.log('🚀 Pour démarrer l\'application:');

  if (mode === 'network') {
    console.log('   docker-compose up -d --build');
  } else {
    console.log('   npm run start:backend   (terminal 1)');
    console.log('   npm run start:frontend  (terminal 2)');
  }

  console.log('');
}

main();
