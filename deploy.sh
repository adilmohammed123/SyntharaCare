#!/bin/bash

# 🚀 Hospital Management System - Vercel Deployment Script

echo "🏥 Hospital Management System - Vercel Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Check if .env file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "Please create .env.local with the following variables:"
    echo "MONGODB_URI=your_mongodb_atlas_connection_string"
    echo "JWT_SECRET=your_super_secret_jwt_key"
    echo "JWT_EXPIRE=7d"
    echo "NODE_ENV=production"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Build the application
echo "🔨 Building the application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure MongoDB Atlas connection"
echo "3. Test your application"
echo "4. Set up custom domain (optional)"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
