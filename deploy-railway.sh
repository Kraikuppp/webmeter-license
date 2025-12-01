#!/bin/bash

# Railway Deployment Helper Script
# This script helps you deploy to Railway step by step

echo "🚀 Railway Deployment Helper"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI is already installed"
fi

echo ""
echo "Step 1: Login to Railway"
railway login

echo ""
echo "Step 2: Link to your Railway project"
echo "Choose your project from the list:"
railway link

echo ""
echo "Step 3: Check environment variables"
echo "Make sure you have these variables set in Railway Dashboard:"
echo "  - NODE_ENV=production"
echo "  - PORT=8080"
echo "  - DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "  - ADMIN_API_SECRET=<your-secret-min-16-chars>"
echo "  - INSTALLER_SECRET=<your-secret-min-16-chars>"
echo "  - RATE_LIMIT_WINDOW_MS=60000"
echo "  - RATE_LIMIT_MAX=30"
echo "  - CORS_ORIGIN=*"
echo ""
read -p "Have you set all environment variables? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set environment variables first in Railway Dashboard"
    exit 1
fi

echo ""
echo "Step 4: Run database schema"
echo "This will create the required tables in PostgreSQL"
read -p "Do you want to run the schema now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway run psql \$DATABASE_URL < src/scripts/schema.sql
    echo "✅ Schema executed"
fi

echo ""
echo "Step 5: Test the deployment"
echo "Getting your Railway URL..."
RAILWAY_URL=$(railway status | grep "URL" | awk '{print $2}')

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  Could not get Railway URL automatically"
    echo "Please check your Railway Dashboard for the URL"
else
    echo "🌐 Your app URL: $RAILWAY_URL"
    echo ""
    echo "Testing health endpoint..."
    curl -s "$RAILWAY_URL/health" | jq .
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
    else
        echo ""
        echo "❌ Health check failed. Check logs:"
        echo "   railway logs"
    fi
fi

echo ""
echo "=============================="
echo "🎉 Deployment process complete!"
echo ""
echo "Useful commands:"
echo "  railway logs          - View real-time logs"
echo "  railway status        - Check deployment status"
echo "  railway open          - Open Railway Dashboard"
echo "  railway run <cmd>     - Run command in Railway environment"
echo ""
