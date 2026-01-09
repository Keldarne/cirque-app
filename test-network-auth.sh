#!/bin/bash

# Script de test pour l'authentification réseau local

echo "=== Test Authentification Réseau Local ==="
echo ""

# 1. Login pour obtenir un token
echo "1. Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://192.168.0.50:4000/api/utilisateurs/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://192.168.0.50:3000" \
  -d '{"email":"user1@example.com","mot_de_passe":"user123"}')

echo "Réponse login: $LOGIN_RESPONSE"
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec: Token non reçu"
  exit 1
fi

echo "✅ Token reçu: ${TOKEN:0:20}..."
echo ""

# 2. Test requête authentifiée
echo "2. Test requête avec token (GET /api/progression/grit-score)..."
API_RESPONSE=$(curl -s http://192.168.0.50:4000/api/progression/grit-score \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: http://192.168.0.50:3000")

echo "Réponse API: $API_RESPONSE"
echo ""

if echo "$API_RESPONSE" | grep -q "error"; then
  echo "❌ Erreur détectée dans la réponse"
  exit 1
else
  echo "✅ Requête authentifiée réussie !"
fi
