const bcrypt = require('bcrypt');
const sequelize = require('./db');
const Utilisateur = require('./models/Utilisateur');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash('admin123', 10);

    // Créer l'utilisateur admin
    const admin = await Utilisateur.create({
      pseudo: 'admin',
      email: 'admin@cirque.com',
      mot_de_passe: motDePasseHash,
      role: 'admin',
      xp: 0,
      niveau: 1
    });

    console.log('✅ Utilisateur admin créé avec succès!');
    console.log('   Pseudo: admin');
    console.log('   Mot de passe: admin123');
    console.log('   Email: admin@cirque.com');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
})();
