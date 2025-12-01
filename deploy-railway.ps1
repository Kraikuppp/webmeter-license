# Railway Deployment Helper Script for Windows
# This script helps you deploy to Railway step by step

Write-Host "🚀 Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayCli) {
    Write-Host "❌ Railway CLI is not installed" -ForegroundColor Red
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 1: Login to Railway" -ForegroundColor Yellow
railway login

Write-Host ""
Write-Host "Step 2: Link to your Railway project" -ForegroundColor Yellow
Write-Host "Choose your project from the list:" -ForegroundColor Gray
railway link

Write-Host ""
Write-Host "Step 3: Check environment variables" -ForegroundColor Yellow
Write-Host "Make sure you have these variables set in Railway Dashboard:" -ForegroundColor Gray
Write-Host "  - NODE_ENV=production" -ForegroundColor Gray
Write-Host "  - PORT=8080" -ForegroundColor Gray
Write-Host "  - DATABASE_URL=`${{Postgres.DATABASE_URL}}" -ForegroundColor Gray
Write-Host "  - ADMIN_API_SECRET=<your-secret-min-16-chars>" -ForegroundColor Gray
Write-Host "  - INSTALLER_SECRET=<your-secret-min-16-chars>" -ForegroundColor Gray
Write-Host "  - RATE_LIMIT_WINDOW_MS=60000" -ForegroundColor Gray
Write-Host "  - RATE_LIMIT_MAX=30" -ForegroundColor Gray
Write-Host "  - CORS_ORIGIN=*" -ForegroundColor Gray
Write-Host ""
$response = Read-Host "Have you set all environment variables? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Please set environment variables first in Railway Dashboard" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Run database schema" -ForegroundColor Yellow
Write-Host "This will create the required tables in PostgreSQL" -ForegroundColor Gray
$response = Read-Host "Do you want to run the schema now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    $schemaPath = Join-Path $PSScriptRoot "src\scripts\schema.sql"
    Get-Content $schemaPath | railway run psql `$DATABASE_URL
    Write-Host "✅ Schema executed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Test the deployment" -ForegroundColor Yellow
Write-Host "Getting your Railway URL..." -ForegroundColor Gray

try {
    $statusOutput = railway status 2>&1
    $urlLine = $statusOutput | Select-String "URL"
    
    if ($urlLine) {
        $railwayUrl = ($urlLine -split '\s+')[1]
        Write-Host "🌐 Your app URL: $railwayUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Testing health endpoint..." -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri "$railwayUrl/health" -Method Get
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not get Railway URL automatically" -ForegroundColor Yellow
        Write-Host "Please check your Railway Dashboard for the URL" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Health check failed. Check logs:" -ForegroundColor Red
    Write-Host "   railway logs" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  railway logs          - View real-time logs" -ForegroundColor Gray
Write-Host "  railway status        - Check deployment status" -ForegroundColor Gray
Write-Host "  railway open          - Open Railway Dashboard" -ForegroundColor Gray
Write-Host "  railway run <cmd>     - Run command in Railway environment" -ForegroundColor Gray
Write-Host ""
