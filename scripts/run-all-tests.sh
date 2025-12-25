#!/bin/bash

echo "🧪 Exécution de tous les tests de l'application Cirque"
echo "======================================================"
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour exécuter un test
run_test() {
    echo ""
    echo "${YELLOW}▶ $1${NC}"
    echo "---"
    if node "$2"; then
        echo "${GREEN}✅ $1 - SUCCÈS${NC}"
        return 0
    else
        echo "${RED}❌ $1 - ÉCHEC${NC}"
        return 1
    fi
}

# Compteur de tests
TOTAL_TESTS=0
PASSED_TESTS=0

# Vérifier que le serveur est démarré
echo "🔍 Vérification que le serveur est démarré..."
if ! curl -s http://localhost:4000/disciplines > /dev/null 2>&1; then
    echo "${RED}❌ Le serveur n'est pas démarré !${NC}"
    echo "Veuillez démarrer le serveur avec: npm start"
    exit 1
fi
echo "${GREEN}✅ Serveur opérationnel${NC}"
echo ""

# Réinitialiser la base de données
echo "${YELLOW}🔄 Réinitialisation de la base de données...${NC}"
npm run reset-db > /dev/null 2>&1
echo "${GREEN}✅ Base de données réinitialisée${NC}"
echo ""

# Test 1: Authentification
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Test 1: Authentification (inscription/login)" "test-auth.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Réinitialiser pour le test suivant
npm run reset-db > /dev/null 2>&1

# Test 2: Disciplines et Figures
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Test 2: Disciplines et Figures" "test-disciplines-figures.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Réinitialiser pour le test suivant
npm run reset-db > /dev/null 2>&1

# Test 3: Cycle de vie complet
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Test 3: Cycle de vie complet (intégration)" "test-complet.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Résumé final
echo ""
echo "======================================================"
echo "📊 RÉSUMÉ DES TESTS"
echo "======================================================"
echo "Total de tests: $TOTAL_TESTS"
echo "Tests réussis: ${GREEN}$PASSED_TESTS${NC}"
echo "Tests échoués: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !${NC}"
    echo "L'application Cirque est pleinement opérationnelle ! 🚀"
    exit 0
else
    echo "${RED}⚠️  Certains tests ont échoué${NC}"
    echo "Veuillez vérifier les erreurs ci-dessus"
    exit 1
fi
