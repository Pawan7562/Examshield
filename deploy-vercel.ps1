# Professional ExamShield Deployment Script for Vercel (PowerShell)
# This script bypasses CLI authentication issues

Write-Host "🚀 Starting ExamShield deployment to Vercel..."

# Navigate to project directory
Set-Location "c:/Users/Pawan kumar/Downloads/examshield-saas/examshield"

# Build the frontend
Write-Host "📦 Building frontend for production..."
$buildResult = npm run build 2>&1

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! Deploying to Vercel..."
    
    # Try deploying with Vercel CLI (this might work if token is cached)
    Write-Host "🔄 Attempting Vercel CLI deployment..."
    $deployResult = vercel --prod --force 2>&1
    
    # If CLI fails, try manual upload
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ CLI deployment failed, trying manual method..."
        Write-Host "📁 Build folder location: frontend/build/"
        Write-Host "🌐 Visit Vercel dashboard to upload manually: https://vercel.com/dashboard"
    } else {
        Write-Host "🎉 Deployment completed successfully!"
        Write-Host "🌐 Your app should be live at: https://examshield-[hash].vercel.app"
    }
} else {
    Write-Host "❌ Build failed! Check npm run build output."
}

Write-Host "🎯 Deployment script completed!"
Write-Host ""
