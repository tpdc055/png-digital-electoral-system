# 🔥 Firebase Production Setup Guide
## PNG Electoral System - Real Database Configuration

### 📋 Prerequisites
- Firebase Account (Google account required)
- Admin access to the PNG Electoral System
- Netlify deployment access (for environment variables)

---

## 🚀 Step 1: Create Firebase Project

### 1.1 Create New Project
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. **Project name**: `png-electoral-system-production`
4. **Project ID**: `png-electoral-system-prod` (will be auto-generated)
5. **Enable Google Analytics**: ✅ **Yes** (recommended)
6. **Analytics account**: Create new or select existing
7. Click **"Create project"**

### 1.2 Project Settings
- **Location**: Choose closest to Papua New Guinea (e.g., `asia-southeast1`)
- **Default GCP resource location**: Same as above
- **Time zone**: `Pacific/Port_Moresby`

---

## 🔧 Step 2: Configure Firestore Database

### 2.1 Create Firestore Database
1. In Firebase Console → **"Firestore Database"**
2. Click **"Create database"**
3. **Security rules**: Start in **production mode**
4. **Location**: Choose `asia-southeast1` (closest to PNG)
5. Click **"Done"**

### 2.2 Set Up Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Citizens collection - authenticated users only
    match /citizens/{citizenId} {
      allow read, write: if request.auth != null;
    }

    // Users collection - user can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Audit logs - admin only
    match /audit_logs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.role == 'admin';
    }

    // Connection test - public read for system health checks
    match /connection-test/{testId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Statistics - authenticated read
    match /statistics/{statId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.role in ['admin', 'enumerator'];
    }
  }
}
```

### 2.3 Create Initial Collections
Create these collections manually:
- `citizens` (citizen registration data)
- `users` (user profiles and roles)
- `audit_logs` (system activity logs)
- `statistics` (system analytics)
- `connection-test` (connectivity verification)

---

## 🔐 Step 3: Configure Authentication

### 3.1 Enable Authentication
1. Firebase Console → **"Authentication"**
2. Click **"Get started"**
3. **Sign-in providers** → **"Email/Password"**
4. **Enable** Email/Password authentication
5. **Save**

### 3.2 Create Admin Users
1. **Authentication** → **"Users"** → **"Add user"**
2. Create these accounts:
   - **Admin**: `admin@electoral.gov.pg` / `your-secure-password`
   - **Enumerator**: `enumerator@electoral.gov.pg` / `your-secure-password`
   - **Viewer**: `viewer@electoral.gov.pg` / `your-secure-password`

### 3.3 Set Custom Claims (Optional - Advanced)
For role-based access, you can set custom claims:
```javascript
// Firebase Functions to set user roles
admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  province: 'National Capital District'
});
```

---

## 📁 Step 4: Configure Storage

### 4.1 Enable Cloud Storage
1. Firebase Console → **"Storage"**
2. Click **"Get started"**
3. **Security rules**: Start in production mode
4. **Location**: Same as Firestore (`asia-southeast1`)
5. Click **"Done"**

### 4.2 Storage Security Rules
```javascript
// Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Citizen photos and documents
    match /citizens/{citizenId}/{filename} {
      allow read, write: if request.auth != null;
    }

    // User profile images
    match /users/{userId}/{filename} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }

    // System backups - admin only
    match /backups/{filename} {
      allow read, write: if request.auth != null &&
        request.auth.token.role == 'admin';
    }
  }
}
```

---

## ⚙️ Step 5: Get Firebase Configuration

### 5.1 Web App Configuration
1. Firebase Console → **"Project settings"** (gear icon)
2. Scroll to **"Your apps"**
3. Click **"Add app"** → **Web app** `</>`
4. **App nickname**: `PNG Electoral System`
5. **Firebase Hosting**: ✅ **Check** (optional)
6. Click **"Register app"**

### 5.2 Copy Configuration
You'll get something like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "png-electoral-system-prod.firebaseapp.com",
  projectId: "png-electoral-system-prod",
  storageBucket: "png-electoral-system-prod.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefabcdefabcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

**🔑 Keep these credentials secure!**

---

## 🌐 Step 6: Update Environment Variables

### 6.1 Create Production Environment File
```bash
# In your project root
cp .env.example .env.production
```

### 6.2 Update .env.production
```bash
# 🔥 FIREBASE CONFIGURATION (Your real credentials)
VITE_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
VITE_FIREBASE_AUTH_DOMAIN="png-electoral-system-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="png-electoral-system-prod"
VITE_FIREBASE_STORAGE_BUCKET="png-electoral-system-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdefabcdefabcdef"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# 🚫 DISABLE DEMO MODE
VITE_DEMO_MODE=false
VITE_ENABLE_DEMO_USERS=false
VITE_DISABLE_FIREBASE_INIT=false

# 🏛️ PRODUCTION SETTINGS
NODE_ENV=production
VITE_ENVIRONMENT=production
VITE_ORGANIZATION_NAME="PNG Electoral Commission"
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AUDIT_LOGS=true
```

### 6.3 Update Netlify Environment Variables
1. Go to **Netlify Dashboard** → Your site → **Site settings**
2. **Environment variables** → **Add new**
3. Add all the Firebase variables from above

---

## 🧪 Step 7: Test Firebase Connection

### 7.1 Local Testing
```bash
# Test locally with new configuration
cd png-citizen-registration
cp .env.production .env.local
bun run dev
```

### 7.2 Verify Connection
1. **Open the app** in browser
2. **Login** with your created Firebase user
3. **Register a test citizen** - should sync to Firestore
4. **Check Firebase Console** → Firestore → see new document
5. **Test offline/online sync**

---

## 🚀 Step 8: Deploy to Production

### 8.1 Build with Production Config
```bash
# Build with production Firebase
bun run build
```

### 8.2 Deploy
```bash
# Deploy to Netlify (environment variables should be set)
# Deployment will automatically use production Firebase
```

### 8.3 Verify Production Deployment
1. **Visit your live site**
2. **Test login** with Firebase credentials
3. **Register test citizen**
4. **Verify data** in Firebase Console
5. **Test all features**

---

## 📊 Step 9: Monitoring & Analytics

### 9.1 Enable Performance Monitoring
1. Firebase Console → **"Performance"**
2. Follow setup instructions
3. Will automatically track page load times

### 9.2 Enable Crashlytics (Optional)
1. Firebase Console → **"Crashlytics"**
2. For error tracking and crash reports

---

## 🔐 Security Checklist

### ✅ Security Best Practices
- [ ] **Firestore rules** configured properly
- [ ] **Storage rules** configured properly
- [ ] **Authentication** enabled and tested
- [ ] **Environment variables** secure (not in code)
- [ ] **Demo mode disabled** in production
- [ ] **HTTPS enforced** (automatic with Netlify)
- [ ] **User roles** properly configured
- [ ] **Audit logging** enabled

---

## 🚨 Troubleshooting

### Common Issues:

**1. "Firebase not initialized" error**
- Check environment variables are set correctly
- Verify `VITE_DEMO_MODE=false`
- Check console for specific error messages

**2. "Permission denied" errors**
- Review Firestore security rules
- Ensure user is authenticated
- Check user has correct role/permissions

**3. "Network error" during sync**
- Verify internet connection
- Check Firebase project is active
- Verify API keys are correct

**4. "Storage upload failed"**
- Check Storage security rules
- Verify file size limits
- Check network connectivity

---

## 📞 Support

**Firebase Console**: https://console.firebase.google.com
**Firebase Documentation**: https://firebase.google.com/docs
**PNG IT Support**: support@electoral.gov.pg

---

## ✅ Success Criteria

Your Firebase production setup is complete when:
- [ ] Users can login with Firebase accounts
- [ ] Citizen data syncs to Firestore database
- [ ] Photos upload to Firebase Storage
- [ ] Offline/online sync works correctly
- [ ] Admin dashboard shows real data
- [ ] System works without demo mode
- [ ] All security rules are active
- [ ] Monitoring and analytics are working

**🎉 Congratulations! Your PNG Electoral System is now running on production Firebase!**
