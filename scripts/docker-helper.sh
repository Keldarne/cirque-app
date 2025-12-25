#!/bin/bash

# Script d'aide Docker pour Cirque App
# Fonctionne sur Mac et Linux (Git Bash sur Windows)

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎪 Cirque App - Docker Helper${NC}"
echo ""

# Fonction d'aide
show_help() {
    echo "Usage: ./docker-helper.sh [command]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start         - Démarrer tous les services"
    echo "  stop          - Arrêter tous les services"
    echo "  restart       - Redémarrer tous les services"
    echo "  logs          - Voir les logs"
    echo "  reset         - Reset complet (DB incluse)"
    echo "  test          - Lancer les tests backend"
    echo "  shell         - Accéder au shell backend"
    echo "  status        - Voir l'état des services"
    echo "  install       - Premier setup (build images)"
    echo ""
}

# Vérifier que Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé!${NC}"
        echo "Installer Docker Desktop: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose n'est pas installé!${NC}"
        exit 1
    fi
}

# Commandes
case "${1:-}" in
    start)
        echo -e "${GREEN}▶️  Démarrage des services...${NC}"
        check_docker
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ Services démarrés!${NC}"
        echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
        echo -e "Backend:  ${BLUE}http://localhost:4000${NC}"
        echo ""
        echo "Voir les logs: ./docker-helper.sh logs"
        ;;

    stop)
        echo -e "${YELLOW}⏹️  Arrêt des services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Services arrêtés${NC}"
        ;;

    restart)
        echo -e "${YELLOW}🔄 Redémarrage des services...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Services redémarrés${NC}"
        ;;

    logs)
        echo -e "${BLUE}📋 Logs en temps réel (Ctrl+C pour quitter)${NC}"
        docker-compose logs -f
        ;;

    reset)
        echo -e "${RED}⚠️  Reset complet - Toutes les données seront perdues!${NC}"
        read -p "Continuer? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}🧹 Nettoyage...${NC}"
            docker-compose down -v
            echo -e "${GREEN}🔨 Rebuild et redémarrage...${NC}"
            docker-compose up -d --build
            echo -e "${GREEN}✅ Reset terminé!${NC}"
        else
            echo "Annulé"
        fi
        ;;

    test)
        echo -e "${BLUE}🧪 Lancement des tests...${NC}"
        docker-compose exec backend npm test
        ;;

    shell)
        echo -e "${BLUE}🐚 Shell backend (tapez 'exit' pour quitter)${NC}"
        docker-compose exec backend sh
        ;;

    status)
        echo -e "${BLUE}📊 État des services:${NC}"
        docker-compose ps
        ;;

    install)
        echo -e "${GREEN}📦 Premier setup - Installation...${NC}"
        check_docker
        echo -e "${YELLOW}🔨 Build des images Docker...${NC}"
        docker-compose build
        echo -e "${GREEN}▶️  Démarrage des services...${NC}"
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ Installation terminée!${NC}"
        echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
        echo -e "Backend:  ${BLUE}http://localhost:4000${NC}"
        echo ""
        echo -e "Comptes de test:"
        echo -e "  Admin: ${YELLOW}admin1@example.com${NC} / admin123"
        echo -e "  Prof:  ${YELLOW}prof1@example.com${NC} / prof123"
        echo -e "  User:  ${YELLOW}user1@example.com${NC} / user123"
        ;;

    help|--help|-h|"")
        show_help
        ;;

    *)
        echo -e "${RED}❌ Commande inconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
