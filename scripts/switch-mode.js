#!/usr/bin/env node

/**
 * Script pour basculer entre mode dev local et Docker
 * Usage: node scripts/switch-mode.js [local|docker]
 */

const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

if (!mode || !['local', 'docker'].includes(mode)) {
  console.error('❌ Usage: node scripts/switch-mode.js [local|docker]');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (mode === 'local') {
  // Mode dev local : proxy vers localhost
  packageJson.proxy = 'http://localhost:4000';
  console.log('🏠 Configuration pour développement LOCAL');
  console.log('   Proxy: http://localhost:4000');
  console.log('\n✅ Vous pouvez maintenant lancer:');
  console.log('   Terminal 1: cd backend && npm start');
  console.log('   Terminal 2: cd frontend && npm start');
} else {
  // Mode Docker : proxy vers nom du service Docker
  packageJson.proxy = 'http://backend:4000';
  console.log('🐳 Configuration pour Docker');
  console.log('   Proxy: http://backend:4000');
  console.log('\n✅ Vous pouvez maintenant lancer:');
  console.log('   docker-compose up -d');
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log('\n✨ Configuration mise à jour!\n');
