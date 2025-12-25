/**
 * Script pour exécuter les migrations SQL
 * Usage: node scripts/run-migrations.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cirque_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const migrationsDir = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Lire tous les fichiers de migration
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Tri alphabétique pour exécuter dans l'ordre

    console.log(`\n📂 ${files.length} migration(s) trouvée(s):\n`);

    for (const file of files) {
      console.log(`\n⏳ Exécution de ${file}...`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`✅ ${file} exécutée avec succès`);
      } catch (err) {
        console.error(`❌ Erreur dans ${file}:`, err.message);

        // Si l'erreur est "already exists", on continue
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`⚠️  ${file} déjà appliquée (ignorée)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n🎉 Toutes les migrations ont été exécutées avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter les migrations
runMigrations();
