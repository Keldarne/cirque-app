const { execSync } = require('child_process');

console.log('🕐 Démarrage du seed...\n');
const start = Date.now();

try {
  execSync('npm run reset-and-seed', { stdio: 'inherit' });
  const elapsed = (Date.now() - start) / 1000;

  console.log('\n' + '='.repeat(60));
  console.log(`⏱️  TEMPS TOTAL: ${elapsed.toFixed(2)} secondes`);
  console.log('='.repeat(60));

  if (elapsed < 10) {
    console.log('✅ OBJECTIF ATTEINT: <10 secondes!');
  } else {
    console.log(`⚠️  Temps supérieur à l'objectif de 10s (${elapsed.toFixed(2)}s)`);
  }
} catch (error) {
  console.error('❌ Erreur lors du seed:', error.message);
  process.exit(1);
}
