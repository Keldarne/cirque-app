# Script d'aide Docker pour Cirque App (Windows PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Couleurs
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Header {
    Write-ColorOutput Blue "🎪 Cirque App - Docker Helper"
    Write-Output ""
}

function Show-Help {
    Write-Output "Usage: .\docker-helper.ps1 [command]"
    Write-Output ""
    Write-Output "Commandes disponibles:"
    Write-Output "  start         - Démarrer tous les services"
    Write-Output "  stop          - Arrêter tous les services"
    Write-Output "  restart       - Redémarrer tous les services"
    Write-Output "  logs          - Voir les logs"
    Write-Output "  reset         - Reset complet (DB incluse)"
    Write-Output "  test          - Lancer les tests backend"
    Write-Output "  shell         - Accéder au shell backend"
    Write-Output "  status        - Voir l'état des services"
    Write-Output "  install       - Premier setup (build images)"
    Write-Output ""
}

function Test-Docker {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
    }
    catch {
        Write-ColorOutput Red "❌ Docker n'est pas installé ou n'est pas dans le PATH!"
        Write-Output "Installer Docker Desktop: https://www.docker.com/products/docker-desktop/"
        exit 1
    }
}

Show-Header

switch ($Command.ToLower()) {
    "start" {
        Write-ColorOutput Green "▶️  Démarrage des services..."
        Test-Docker
        docker-compose up -d
        Write-Output ""
        Write-ColorOutput Green "✅ Services démarrés!"
        Write-ColorOutput Blue "Frontend: http://localhost:3000"
        Write-ColorOutput Blue "Backend:  http://localhost:4000"
        Write-Output ""
        Write-Output "Voir les logs: .\docker-helper.ps1 logs"
    }

    "stop" {
        Write-ColorOutput Yellow "⏹️  Arrêt des services..."
        docker-compose down
        Write-ColorOutput Green "✅ Services arrêtés"
    }

    "restart" {
        Write-ColorOutput Yellow "🔄 Redémarrage des services..."
        docker-compose restart
        Write-ColorOutput Green "✅ Services redémarrés"
    }

    "logs" {
        Write-ColorOutput Blue "📋 Logs en temps réel (Ctrl+C pour quitter)"
        docker-compose logs -f
    }

    "reset" {
        Write-ColorOutput Red "⚠️  Reset complet - Toutes les données seront perdues!"
        $confirmation = Read-Host "Continuer? (y/N)"
        if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
            Write-ColorOutput Yellow "🧹 Nettoyage..."
            docker-compose down -v
            Write-ColorOutput Green "🔨 Rebuild et redémarrage..."
            docker-compose up -d --build
            Write-ColorOutput Green "✅ Reset terminé!"
        }
        else {
            Write-Output "Annulé"
        }
    }

    "test" {
        Write-ColorOutput Blue "🧪 Lancement des tests..."
        docker-compose exec backend npm test
    }

    "shell" {
        Write-ColorOutput Blue "🐚 Shell backend (tapez 'exit' pour quitter)"
        docker-compose exec backend sh
    }

    "status" {
        Write-ColorOutput Blue "📊 État des services:"
        docker-compose ps
    }

    "install" {
        Write-ColorOutput Green "📦 Premier setup - Installation..."
        Test-Docker
        Write-ColorOutput Yellow "🔨 Build des images Docker..."
        docker-compose build
        Write-ColorOutput Green "▶️  Démarrage des services..."
        docker-compose up -d
        Write-Output ""
        Write-ColorOutput Green "✅ Installation terminée!"
        Write-ColorOutput Blue "Frontend: http://localhost:3000"
        Write-ColorOutput Blue "Backend:  http://localhost:4000"
        Write-Output ""
        Write-Output "Comptes de test:"
        Write-ColorOutput Yellow "  Admin: admin1@example.com / admin123"
        Write-ColorOutput Yellow "  Prof:  prof1@example.com / prof123"
        Write-ColorOutput Yellow "  User:  user1@example.com / user123"
    }

    "help" {
        Show-Help
    }

    default {
        Write-ColorOutput Red "❌ Commande inconnue: $Command"
        Write-Output ""
        Show-Help
        exit 1
    }
}
