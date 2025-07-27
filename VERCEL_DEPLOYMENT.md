# 🚀 Vercel Deployment Guide
## PNG Digital Electoral System

### Quick Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub account
   - Import `https://github.com/tpdc055/png-digital-electoral-system.git`

2. **Configure Build Settings:** (Auto-detected from `vercel.json`)
   - Build Command: `bun run build`
   - Output Directory: `dist`
   - Install Command: `bun install`

3. **Add Environment Variables in Vercel:**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyCd4YQFdeub4kwc4QKjIzuhVC-QALPhWCM
   VITE_FIREBASE_AUTH_DOMAIN=png-citizen-registration-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=png-citizen-registration-prod
   VITE_FIREBASE_STORAGE_BUCKET=png-citizen-registration-prod.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=29379902965
   VITE_FIREBASE_APP_ID=1:29379902965:web:e4582785c4100fd96d34bc
   VITE_FIREBASE_MEASUREMENT_ID=G-4NLJ0FVTBJ
   NODE_ENV=production
   VITE_ENVIRONMENT=production
   VITE_DEMO_MODE=false
   ```

4. **Deploy!**
   - Click "Deploy" and Vercel will build and deploy automatically
   - Your app will be live at: `https://your-project-name.vercel.app`

### 🔒 Security Notes
- Environment variables are securely managed by Vercel
- Firebase config is loaded from environment variables
- All security headers are configured in `vercel.json`

### 📱 Features Included
- ✅ Offline-first progressive web app
- ✅ Firebase integration for real-time data
- ✅ Biometric registration system
- ✅ Digital voting with LPV algorithm
- ✅ Admin dashboard and reporting
- ✅ Mobile-responsive design

### 🌐 Live URL
Once deployed, share the Vercel URL with PNG Electoral Commission for testing!
