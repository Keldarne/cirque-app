const { Figure } = require('./backend/src/models');

async function check() {
  try {
    const publicFigures = await Figure.findAll({ where: { ecole_id: null } });
    console.log(`Public figures count: ${publicFigures.length}`);
    if (publicFigures.length > 0) {
      console.log('Sample public figure:', publicFigures[0].nom);
    }
    
    const schoolFigures = await Figure.findAll({ where: { ecole_id: 1 } }); // Assuming school 1 exists
    console.log(`School 1 figures count: ${schoolFigures.length}`);
  } catch (err) {
    console.error(err);
  }
}

check();
