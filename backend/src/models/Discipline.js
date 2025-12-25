// Modèle Discipline
// Représente une catégorie / discipline (ex: Jonglage, Acrobatie, Tissu aérien).
// Champs principaux:
// - nom: nom unique de la discipline
// Relations:
// - une Discipline a plusieurs Figures (déclaré dans models/index.js)
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Discipline = sequelize.define('Discipline', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

module.exports = Discipline;