# ExamShield Vercel Deployment Guide

## 🚀 Quick Deployment Instructions

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Supabase project configured

### Step 1: Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `examshield` folder as root directory

### Step 2: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret
APP_URL=https://your-app-name.vercel.app
API_URL=https://your-app-name.vercel.app/_/backend/api
```

### Step 3: Build Configuration
Vercel will automatically detect the `vercel.json` configuration with **experimental services**. Build settings:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Node Runtime**: 18.x
- **Experimental Services**: Enabled with custom routing

### Step 4: Deploy
1. Click "Deploy" to start the deployment
2. Wait for build to complete (2-3 minutes)
3. Your app will be available at `https://your-app-name.vercel.app`

## 🔧 Experimental Services Configuration

### Frontend Service
- **Entrypoint**: `frontend/`
- **Route Prefix**: `/`
- **Framework**: Create React App
- **Build Output**: Static files

### Backend Service
- **Entrypoint**: `backend/`
- **Route Prefix**: `/_/backend`
- **Runtime**: Node.js 18.x
- **API Routes**: `/_/backend/api/*`

### Routing Logic
```
/_/backend/* → Backend functions
/api/* → Backend functions (redirected)
/* → Frontend static files
```

## 🔧 Post-Deployment Checklist

### ✅ Verify Frontend
- [ ] App loads correctly at the deployed URL
- [ ] All pages are accessible
- [ ] Static assets load properly
- [ ] No console errors

### ✅ Verify Backend API
- [ ] Health check works: `https://your-app-name.vercel.app/_/backend/api/health`
- [ ] Admin endpoints respond correctly: `/_/backend/api/admin/*`
- [ ] Student endpoints respond correctly: `/_/backend/api/student/*`
- [ ] Authentication works

### ✅ Verify Database
- [ ] Supabase connection established
- [ ] Data persists correctly
- [ ] Real-time features work

### ✅ Verify Features
- [ ] User registration/login works
- [ ] Exam creation works
- [ ] Question generation works
- [ ] Exam taking works
- [ ] Results display correctly

## 🐛 Common Issues & Solutions

### Issue: "API Not Found" Errors
**Solution**: Check Vercel routes configuration in `vercel.json`

### Issue: CORS Errors
**Solution**: Verify environment variables and CORS configuration

### Issue: Database Connection Failed
**Solution**: Check Supabase credentials in environment variables

### Issue: Build Fails
**Solution**: Check `frontend/package.json` dependencies and build scripts

## 📊 Performance Optimization

### Frontend Optimizations
- Code splitting implemented
- Static assets optimized
- Bundle size minimized
- Service worker for caching

### Backend Optimizations
- Serverless functions optimized
- Response caching enabled
- Rate limiting configured

## 🔒 Security Considerations

### Implemented Security
- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS properly configured
- Environment variables secured

### Production Checklist
- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active

## 📈 Monitoring & Analytics

### Vercel Analytics
- Automatic page views tracking
- Performance metrics
- Error tracking

### Custom Monitoring
- API health check endpoint
- Error logging
- Performance monitoring

## 🔄 Continuous Deployment

### Automatic Deployments
- Push to `main` branch triggers deployment
- Pull requests create preview deployments
- Rollback capability available

### Deployment Workflow
```
Git Push → Vercel Build → Deploy → Health Check
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with production settings
4. Check this guide for common solutions

## 🎉 Success!

Once deployed, your ExamShield application will be fully functional with:
- ✅ Secure user authentication
- ✅ AI-powered question generation
- ✅ Real-time exam monitoring
- ✅ Professional UI/UX
- ✅ Scalable infrastructure

Enjoy your deployed ExamShield application! 🚀
