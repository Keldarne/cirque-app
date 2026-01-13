Write-Host "🏗️  Building Cirque App for Production..." -ForegroundColor Green
Write-Host ""

# 1. Build Frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm ci --production=$false
npm run build
Write-Host "✅ Frontend build complete (frontend/build/)" -ForegroundColor Green
Set-Location ..

# 2. Prepare Backend
Write-Host ""
Write-Host "📦 Preparing backend..." -ForegroundColor Yellow
Set-Location backend
npm ci --production
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Deployment artifacts:" -ForegroundColor Cyan
Write-Host "  - Frontend: frontend/build/"
Write-Host "  - Backend:  backend/"
Write-Host ""
Write-Host "🚀 Ready to deploy to Infomaniak!" -ForegroundColor Green
Write-Host "See docs/DEPLOIEMENT_INFOMANIAK.md for deployment instructions" -ForegroundColor Yellow
