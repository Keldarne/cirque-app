#!/bin/bash
set -e

echo "🏗️  Building Cirque App for Production..."
echo ""

# 1. Build Frontend
echo "📦 Building frontend..."
cd frontend
npm ci --production=false  # Install all deps including devDeps for build
npm run build
echo "✅ Frontend build complete (frontend/build/)"
cd ..

# 2. Prepare Backend
echo ""
echo "📦 Preparing backend..."
cd backend
npm ci --production  # Production deps only
echo "✅ Backend dependencies installed"
cd ..

echo ""
echo "✅ Production build complete!"
echo ""
echo "📁 Deployment artifacts:"
echo "  - Frontend: frontend/build/"
echo "  - Backend:  backend/"
echo ""
echo "🚀 Ready to deploy to Infomaniak!"
echo "See docs/DEPLOIEMENT_INFOMANIAK.md for deployment instructions"
