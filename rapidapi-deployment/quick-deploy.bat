@echo off
chcp 65001 >nul
echo 🚀 Holiday Calendar API - Quick Deploy Script
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create logs directory
if not exist logs mkdir logs

echo.
echo 🎯 Choose your deployment platform:
echo 1) Heroku
echo 2) Railway
echo 3) Render
echo 4) Docker
echo 5) Manual deployment

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto heroku
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto render
if "%choice%"=="4" goto docker
if "%choice%"=="5" goto manual
echo ❌ Invalid choice
pause
exit /b 1

:heroku
echo.
echo 🚀 Deploying to Heroku...
echo 📋 Heroku Deployment Steps:
echo 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
echo 2. Login: heroku login
echo 3. Create app: heroku create your-holiday-calendar-api
echo 4. Set config: heroku config:set NODE_ENV=production
echo 5. Deploy: git push heroku main
echo.
echo 🔗 Your API will be available at: https://your-holiday-calendar-api.herokuapp.com
goto end

:railway
echo.
echo 🚂 Deploying to Railway...
echo 📋 Railway Deployment Steps:
echo 1. Go to https://railway.app
echo 2. Sign in with GitHub
echo 3. Create new project
echo 4. Connect your repository
echo 5. Set environment variables in dashboard
echo 6. Railway will auto-deploy on git push
echo.
echo 🔗 Your API will be available at the URL shown in Railway dashboard
goto end

:render
echo.
echo 🎨 Deploying to Render...
echo 📋 Render Deployment Steps:
echo 1. Go to https://render.com
echo 2. Sign up with GitHub
echo 3. Create new Web Service
echo 4. Connect your repository
echo 5. Set build command: npm install
echo 6. Set start command: npm start
echo 7. Set environment variables
echo.
echo 🔗 Your API will be available at the URL shown in Render dashboard
goto end

:docker
echo.
echo 🐳 Deploying with Docker...
echo 📋 Docker Deployment Steps:
echo 1. Build image: docker build -t holiday-calendar-api .
echo 2. Run container: docker run -p 3000:3000 holiday-calendar-api
echo 3. Or use docker-compose: docker-compose up --build
echo.
echo 🔗 Your API will be available at: http://localhost:3000
goto end

:manual
echo.
echo 📋 Manual Deployment Steps:
echo 1. Choose a hosting provider (Heroku, Railway, Render, DigitalOcean, etc.)
echo 2. Create an account and new project/app
echo 3. Connect your GitHub repository
echo 4. Set environment variables:
echo    - NODE_ENV=production
echo    - ALLOWED_ORIGINS=*
echo 5. Deploy your code
echo 6. Test your API endpoints
echo 7. Set up RapidAPI listing
echo.
echo 📚 See DEPLOYMENT-GUIDE.md for detailed instructions
goto end

:end
echo.
echo 🎉 Deployment setup complete!
echo.
echo 📚 Next steps:
echo 1. Deploy your API to your chosen platform
echo 2. Test all endpoints work correctly
echo 3. Create your RapidAPI listing
echo 4. Configure pricing and rate limits
echo 5. Start marketing your API!
echo.
echo 📖 For detailed instructions, see:
echo    - DEPLOYMENT-GUIDE.md
echo    - marketplace-listing.md
echo.
echo 🚀 Good luck with your API business!
pause
