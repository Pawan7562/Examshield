#!/bin/bash

# Professional ExamShield Deployment Script for Vercel (Windows Compatible)
# This script bypasses CLI authentication issues

echo "🚀 Starting ExamShield deployment to Vercel..."

# Navigate to project directory
cd "c:/Users/Pawan kumar/Downloads/examshield-saas/examshield"

# Build the frontend
echo "📦 Building frontend for production..."
call npm run build

# Check if build was successful
if %ERRORLEVEL% EQU 0; then
    echo "✅ Build successful! Deploying to Vercel..."
    
    # Try deploying with Vercel CLI (this might work if token is cached)
    echo "🔄 Attempting Vercel CLI deployment..."
    call vercel --prod --force 2>&1
    
    # If CLI fails, try manual upload
    if %ERRORLEVEL% NEQ 0; then
        echo "❌ CLI deployment failed, trying manual method..."
        echo "📁 Build folder location: frontend/build/"
        echo "🌐 Visit Vercel dashboard to upload manually: https://vercel.com/dashboard"
    else
        echo "🎉 Deployment completed successfully!"
        echo "🌐 Your app should be live at: https://examshield-[hash].vercel.app"
    endif

else
    echo "❌ Build failed! Check npm run build output."
endif

echo "🎯 Deployment script completed!"
