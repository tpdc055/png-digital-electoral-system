# PNG Citizen Registration - Production Deployment Guide

## 🎯 **Deployment Overview**

This guide covers deploying the PNG Citizen Registration System to production hosting with real Firebase backend.

### **Deployment Targets:**
- **🔥 Firebase Hosting** (Recommended)
- **🌐 Vercel** (Primary)
- **⚡ Vercel** (Alternative)

### **Prerequisites:**
- ✅ Real Firebase project created
- ✅ Environment variables configured
- ✅ Production testing completed
- ✅ SSL certificates ready
- ✅ Domain name acquired

---

## 🔥 **Option 1: Firebase Hosting (Recommended)**

### **Why Firebase Hosting?**
- **Native Integration** with Firestore database
- **Global CDN** for fast loading
- **Automatic SSL** certificates
- **Custom Domain** support
- **Rollback Capabilities**

### **Step 1: Install Firebase CLI**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

### **Step 2: Initialize Firebase Hosting**
```bash
# Navigate to project directory
cd png-citizen-registration

# Initialize Firebase
firebase init hosting

# Select options:
# - Use existing project: png-citizen-registration-prod
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
```

### **Step 3: Configure Build**
```bash
# Install dependencies
bun install

# Build for production
bun run build

# Test build locally
firebase serve
```

### **Step 4: Deploy to Production**
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with custom message
firebase deploy --only hosting -m "PNG Census v1.0.0 Production Release"

# Get deployment URL
firebase hosting:channel:open live
```

### **Step 5: Custom Domain Setup**
```bash
# Add custom domain (example: census.gov.pg)
firebase hosting:sites:create png-census-prod

# Connect custom domain
firebase hosting:channel:deploy live --only hosting
```

---

## 🌐 **Option 2: Vercel Deployment**

### **Step 1: Prepare for Vercel**
```bash
# Build the project
bun run build

# Create deployment package
cd dist
zip -r ../netlify-deployment.zip .
cd ..
```

### **Step 2: Netlify CLI Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Custom domain
netlify sites:create --name png-citizen-registration
```

### **Step 3: Environment Variables**
In Netlify Dashboard:
1. Go to **Site Settings > Environment Variables**
2. Add production Firebase config:

```bash
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=png-citizen-registration-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=png-citizen-registration-prod
VITE_FIREBASE_STORAGE_BUCKET=png-citizen-registration-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
NODE_ENV=production
VITE_ENVIRONMENT=production
```

---

## ⚡ **Option 3: Vercel Deployment**

### **Step 1: Install Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### **Step 2: Deploy**
```bash
# Deploy from project directory
cd png-citizen-registration
vercel --prod

# Configure:
# - Framework: Vite
# - Build Command: bun run build
# - Output Directory: dist
```

### **Step 3: Environment Variables**
```bash
# Add environment variables
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# ... add all Firebase config variables
```

---

## 🔐 **Security Configuration**

### **1. Firebase Security Rules**
Ensure production Firestore rules are active:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /citizens/{citizenId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null
        && isValidCitizenData(request.resource.data);
    }

    match /backups/{backupId} {
      allow read, write: if request.auth != null
        && request.auth.token.admin == true;
    }
  }
}

function isValidCitizenData(data) {
  return data.keys().hasAll([
    'fullName', 'dateOfBirth', 'sex', 'province',
    'district', 'llg', 'village', 'nationalIdNumber'
  ]) && data.fullName is string
     && data.nationalIdNumber is string;
}
```

### **2. API Key Restrictions**
In Firebase Console > Project Settings > General:
1. **Restrict API Key** to your production domain
2. **HTTP Referrers**: `https://your-domain.com/*`
3. **Android Apps**: Add your app package name
4. **iOS Apps**: Add your app bundle ID

### **3. HTTPS Enforcement**
```javascript
// In your hosting configuration
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

---

## 📊 **Performance Optimization**

### **1. Build Optimization**
```bash
# Optimize bundle size
bunx vite-bundle-analyzer

# Preload critical resources
bunx vite build --mode production

# Enable compression
bunx vite build --mode production --minify terser
```

### **2. Caching Strategy**
```javascript
// In firebase.json
{
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### **3. CDN Configuration**
- **Firebase Hosting**: Global CDN included
- **Netlify**: Edge CDN included
- **Vercel**: Edge Network included

---

## 🔍 **Health Checks & Monitoring**

### **1. Application Health Check**
Create a health endpoint:

```typescript
// In your app
export const healthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  services: {
    firebase: true,
    gps: navigator.geolocation ? true : false,
    camera: navigator.mediaDevices ? true : false,
    fingerprint: 'serial' in navigator
  }
};
```

### **2. Firebase Monitoring**
Enable in Firebase Console:
- **Performance Monitoring**
- **Crashlytics** (for mobile apps)
- **Analytics**
- **Usage Monitoring**

### **3. Error Tracking**
```typescript
// Add error tracking
window.addEventListener('error', (event) => {
  console.error('Application Error:', event.error);
  // Send to monitoring service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  // Send to monitoring service
});
```

---

## 🧪 **Production Testing**

### **1. Pre-Deployment Testing**
```bash
# Run all tests
bun test

# Build and test locally
bun run build
bun preview

# Check bundle size
bunx vite-bundle-analyzer dist

# Lighthouse audit
bunx lighthouse http://localhost:4173 --chrome-flags="--headless"
```

### **2. Smoke Tests**
After deployment, test:
- [ ] **Application loads** without errors
- [ ] **Firebase connection** established
- [ ] **Registration form** works
- [ ] **Camera capture** functions
- [ ] **GPS coordinates** captured
- [ ] **Data sync** operates correctly
- [ ] **Admin dashboard** accessible
- [ ] **Backup system** functional

### **3. Load Testing**
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'https://your-production-url.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "User registration flow"
    requests:
      - get:
          url: "/"
      - post:
          url: "/api/citizens"
          json:
            fullName: "Test User"
            nationalIdNumber: "12345"
EOF

# Run load test
artillery run load-test.yml
```

---

## 🚨 **Disaster Recovery**

### **1. Backup Strategy**
- **Automatic Daily Backups** via Firebase scheduled functions
- **Weekly Full Exports** to Cloud Storage
- **Local Backup Downloads** for critical data
- **Geographic Replication** across multiple regions

### **2. Recovery Procedures**
```bash
# Emergency data export
firebase firestore:export gs://your-bucket/emergency-backup

# Restore from backup
firebase firestore:import gs://your-bucket/emergency-backup

# Rollback deployment
firebase hosting:channel:open previous-release
```

### **3. Communication Plan**
- **Incident Response Team** contacts
- **User Notification System**
- **Status Page** for system status
- **Escalation Procedures**

---

## 📋 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] **Firebase project** configured
- [ ] **Environment variables** set
- [ ] **Security rules** implemented
- [ ] **API keys** restricted
- [ ] **SSL certificates** configured
- [ ] **Custom domain** ready
- [ ] **Load testing** completed
- [ ] **Backup procedures** tested

### **Deployment:**
- [ ] **Build successful** without errors
- [ ] **Deploy to staging** first
- [ ] **Smoke tests** passed
- [ ] **Performance metrics** acceptable
- [ ] **Security scan** completed
- [ ] **Deploy to production**
- [ ] **DNS propagation** verified
- [ ] **CDN cache** cleared

### **Post-Deployment:**
- [ ] **Health checks** passing
- [ ] **Monitoring** enabled
- [ ] **Error tracking** active
- [ ] **User training** scheduled
- [ ] **Support team** notified
- [ ] **Documentation** updated
- [ ] **Success metrics** baseline set

---

## 📞 **Support & Maintenance**

### **24/7 Monitoring:**
- **Firebase Console** alerts
- **Performance monitoring**
- **Error rate tracking**
- **User activity monitoring**

### **Regular Maintenance:**
- **Weekly security updates**
- **Monthly performance reviews**
- **Quarterly backup tests**
- **Annual security audits**

### **Incident Response:**
1. **Detect** issue via monitoring
2. **Assess** impact and severity
3. **Respond** with appropriate team
4. **Resolve** and verify fix
5. **Review** and improve processes

---

## 🎯 **Success Metrics**

### **Performance Targets:**
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

### **User Experience:**
- **Registration Completion**: > 95%
- **Photo Capture Success**: > 90%
- **Sync Success Rate**: > 98%
- **User Satisfaction**: > 4.5/5

### **Data Integrity:**
- **Backup Success**: 100%
- **Data Loss**: 0%
- **Sync Conflicts**: < 1%
- **Duplicate Prevention**: > 99%

---

**🇵🇬 PNG Citizen Registration System - Ready for Production!**

The system is now fully deployed and ready to serve Papua New Guinea's census and electoral registration needs.

**For technical support during deployment, contact the development team immediately.**
