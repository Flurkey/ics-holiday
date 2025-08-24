#!/bin/bash

# Quick Deploy Script for Holiday Calendar API
# This script will help you deploy to various platforms

echo "🚀 Holiday Calendar API - Quick Deploy Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Test the API locally
echo "🧪 Testing API locally..."
timeout 10s npm start &
API_PID=$!

# Wait a moment for the API to start
sleep 5

# Test the health endpoint
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API is working locally"
    kill $API_PID 2>/dev/null
else
    echo "❌ API failed to start locally"
    kill $API_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Choose your deployment platform:"
echo "1) Heroku"
echo "2) Railway"
echo "3) Render"
echo "4) Docker"
echo "5) Manual deployment"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to Heroku..."
        deploy_heroku
        ;;
    2)
        echo "🚂 Deploying to Railway..."
        deploy_railway
        ;;
    3)
        echo "🎨 Deploying to Render..."
        deploy_render
        ;;
    4)
        echo "🐳 Deploying with Docker..."
        deploy_docker
        ;;
    5)
        echo "📋 Manual deployment instructions:"
        show_manual_instructions
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

deploy_heroku() {
    echo "📋 Heroku Deployment Steps:"
    echo "1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
    echo "2. Login: heroku login"
    echo "3. Create app: heroku create your-holiday-calendar-api"
    echo "4. Set config: heroku config:set NODE_ENV=production"
    echo "5. Deploy: git push heroku main"
    echo ""
    echo "🔗 Your API will be available at: https://your-holiday-calendar-api.herokuapp.com"
}

deploy_railway() {
    echo "📋 Railway Deployment Steps:"
    echo "1. Go to https://railway.app"
    echo "2. Sign in with GitHub"
    echo "3. Create new project"
    echo "4. Connect your repository"
    echo "5. Set environment variables in dashboard"
    echo "6. Railway will auto-deploy on git push"
    echo ""
    echo "🔗 Your API will be available at the URL shown in Railway dashboard"
}

deploy_render() {
    echo "📋 Render Deployment Steps:"
    echo "1. Go to https://render.com"
    echo "2. Sign up with GitHub"
    echo "3. Create new Web Service"
    echo "4. Connect your repository"
    echo "5. Set build command: npm install"
    echo "6. Set start command: npm start"
    echo "7. Set environment variables"
    echo ""
    echo "🔗 Your API will be available at the URL shown in Render dashboard"
}

deploy_docker() {
    echo "🐳 Docker Deployment:"
    echo "1. Build image: docker build -t holiday-calendar-api ."
    echo "2. Run container: docker run -p 3000:3000 holiday-calendar-api"
    echo "3. Or use docker-compose: docker-compose up --build"
    echo ""
    echo "🔗 Your API will be available at: http://localhost:3000"
}

show_manual_instructions() {
    echo "📋 Manual Deployment Steps:"
    echo "1. Choose a hosting provider (Heroku, Railway, Render, DigitalOcean, etc.)"
    echo "2. Create an account and new project/app"
    echo "3. Connect your GitHub repository"
    echo "4. Set environment variables:"
    echo "   - NODE_ENV=production"
    echo "   - ALLOWED_ORIGINS=*"
    echo "5. Deploy your code"
    echo "6. Test your API endpoints"
    echo "7. Set up RapidAPI listing"
    echo ""
    echo "📚 See DEPLOYMENT-GUIDE.md for detailed instructions"
}

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Deploy your API to your chosen platform"
echo "2. Test all endpoints work correctly"
echo "3. Create your RapidAPI listing"
echo "4. Configure pricing and rate limits"
echo "5. Start marketing your API!"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - DEPLOYMENT-GUIDE.md"
echo "   - marketplace-listing.md"
echo ""
echo "🚀 Good luck with your API business!"
