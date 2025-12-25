# Makefile pour Cirque App
# Commandes simplifiées pour Docker et développement local

.PHONY: help up down restart logs build clean test reset install

# Afficher l'aide
help:
	@echo "🎪 Cirque App - Commandes disponibles:"
	@echo ""
	@echo "Docker:"
	@echo "  make up          - Démarrer tous les services (DB + Backend + Frontend)"
	@echo "  make down        - Arrêter tous les services"
	@echo "  make restart     - Redémarrer tous les services"
	@echo "  make logs        - Voir les logs en temps réel"
	@echo "  make build       - Rebuild les images Docker"
	@echo "  make clean       - Arrêter et supprimer volumes (reset DB)"
	@echo ""
	@echo "Base de données:"
	@echo "  make reset       - Reset et reseed la base de données"
	@echo "  make seed        - Seed uniquement"
	@echo ""
	@echo "Tests:"
	@echo "  make test        - Lancer tous les tests backend"
	@echo "  make test-security - Tests de sécurité uniquement"
	@echo ""
	@echo "Développement local:"
	@echo "  make install     - Installer toutes les dépendances (local)"
	@echo "  make dev-backend - Démarrer backend (local)"
	@echo "  make dev-frontend - Démarrer frontend (local)"

# Docker - Démarrer tous les services
up:
	docker-compose up -d
	@echo "✅ Services démarrés!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:4000"

# Docker - Arrêter tous les services
down:
	docker-compose down
	@echo "⏹️  Services arrêtés"

# Docker - Redémarrer
restart:
	docker-compose restart
	@echo "🔄 Services redémarrés"

# Docker - Logs en temps réel
logs:
	docker-compose logs -f

# Docker - Rebuild les images
build:
	docker-compose up -d --build
	@echo "🔨 Images reconstruites et services démarrés"

# Docker - Clean complet (supprime volumes)
clean:
	docker-compose down -v
	@echo "🧹 Services arrêtés et volumes supprimés"

# Reset et reseed la DB (Docker)
reset:
	docker-compose exec backend npm run reset-and-seed
	@echo "🔄 Base de données réinitialisée et seedée"

# Seed uniquement (Docker)
seed:
	docker-compose exec backend npm run seed
	@echo "🌱 Base de données seedée"

# Tests backend (Docker)
test:
	docker-compose exec backend npm test

# Tests de sécurité (Docker)
test-security:
	docker-compose exec backend npm run test:security

# Installation locale
install:
	npm run install:all
	@echo "📦 Dépendances installées (local)"

# Dev backend local
dev-backend:
	cd backend && npm run dev

# Dev frontend local
dev-frontend:
	cd frontend && npm start

# Shell backend (Docker)
shell-backend:
	docker-compose exec backend sh

# Shell frontend (Docker)
shell-frontend:
	docker-compose exec frontend sh

# MySQL shell (Docker)
mysql:
	docker-compose exec db mysql -u cirque_user -pcirque_pass_2024 cirque_app
