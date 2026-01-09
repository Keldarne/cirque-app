# Documentation Cirque App

Documentation complète de l'application de gestion d'entraînement cirque multi-tenant.

## 📚 Documentation Essentielle

### 🚀 Démarrage Rapide
- **[DOCKER.md](DOCKER.md)** : Installation et démarrage avec Docker (RECOMMANDÉ)
- **[COMPTES_TEST.md](COMPTES_TEST.md)** : Comptes test seed (admin/prof/élève)

### 📖 Architecture & Features
- **[STRUCTURE.md](STRUCTURE.md)** : Architecture technique complète
- **[FEATURES.md](FEATURES.md)** : Fonctionnalités détaillées
- **[PLAN.md](PLAN.md)** : Roadmap développement

### 🔒 Sécurité & Tests
- **[SECURITY.md](SECURITY.md)** : Guidelines sécurité (OWASP, Helmet.js)
- **[TESTING.md](TESTING.md)** : Stratégie tests (100% couverture backend)

### 🤖 Backend → Frontend Handoff
- **[README_BACKEND_SPRINT.md](README_BACKEND_SPRINT.md)** : Résumé sprint backend
- **[BACKEND_GEMINI_HANDOFF.md](BACKEND_GEMINI_HANDOFF.md)** : Guide intégration Gemini (9 routes)
- **[backend/docs/INTEGRATION_LOG.md](../backend/docs/INTEGRATION_LOG.md)** : Spécifications API complètes

## 📊 État Projet

**Backend** : ✅ 100% Production-Ready
- 22/22 routes testées
- 12/12 services testés
- 5,468 lignes tests
- Helmet.js sécurité HTTP

**Frontend** : ⏳ Phase 3 en cours
- 9 nouvelles routes à intégrer
- Effort estimé : 35-46h

## 📁 Archives

Anciennes docs et historiques déplacées dans `archives/` :
- `archives/backend/` : Backlog obsolète, docs redondantes Docker
- `archives/` : Specs design (figma.md), refactoring summary, tests manuels
- `archives/planning/` : Multi-tenant, payment system, pricing (futures phases)

## 🔗 Liens Utiles

- **Projet racine** : `../README.md`
- **Backend API** : `../backend/docs/API_DOCUMENTATION.md`
- **Backend Tests** : `../backend/test/`
- **Frontend** : `../frontend/src/`
