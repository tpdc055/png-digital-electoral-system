# PNG Citizen Registration System - Production Deployment Guide

This guide will walk you through setting up the PNG Citizen Registration System for production deployment with proper security, authentication, and cloud infrastructure.

## 🏛️ Overview

The PNG Citizen Registration System is designed for the Independent State of Papua New Guinea's Census and Electoral Commission. It provides:

- **Offline-first data collection** for remote areas
- **Biometric capture** (photos and fingerprints)
- **Real-time cloud synchronization** when connectivity is available
- **Role-based access control** (Admin, Enumerator, Viewer)
- **Provincial data segregation** for data governance
- **Backup and restore capabilities** for data protection

## 🔧 Prerequisites

Before starting production setup, ensure you have:

- [ ] Active Google Cloud Platform account
- [ ] Firebase project creation permissions
- [ ] Domain name for production deployment (e.g., `census.gov.pg`)
- [ ] SSL certificate for HTTPS (required for Web Serial API)
- [ ] Administrative access to deploy to hosting platform

## 📋 Production Setup Checklist

### Phase 1: Firebase Project Setup

#### 1.1 Create Production Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project Details:**
   ```
   Project Name: PNG Citizen Registration - Production
   Project ID: png-citizen-registration-prod
   ```
4. **Enable Google Analytics** (recommended for monitoring)
5. **Choose analytics location:** `Australia` (closest to PNG)

#### 1.2 Enable Required Firebase Services

Enable the following services in your Firebase project:

**Authentication:**
- Go to Authentication > Sign-in method
- Enable "Email/Password" provider
- Configure authorized domains (add your production domain)

**Firestore Database:**
- Go to Firestore Database
- Create database in "production mode"
- Choose location: `australia-southeast1` (closest to PNG)

**Storage:**
- Go to Storage
- Get started with default security rules
- Choose location: `australia-southeast1`

**Analytics:**
- Already enabled during project creation
- Configure custom events for system monitoring

#### 1.3 Configure Security Rules

**Firestore Security Rules:**
Copy the security rules from `firestore.rules` to your Firebase console:

```bash
firebase deploy --only firestore:rules
```

Or manually copy from the `firestore.rules` file in the project root.

**Storage Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated users can upload
    match /citizen-photos/{citizenId} {
      allow read, write: if request.auth != null;
    }

    match /citizen-fingerprints/{citizenId} {
      allow read, write: if request.auth != null;
    }

    match /backups/{backupId} {
      allow read, write: if request.auth != null &&
                           request.auth.token.admin == true;
    }
  }
}
```

### Phase 2: Environment Configuration

#### 2.1 Create Production Environment File

1. **Copy `.env.example` to `.env.production`:**
   ```bash
   cp .env.example .env.production
   ```

2. **Update Firebase Configuration:**
   Get your Firebase config from Firebase Console > Project Settings > General Tab:

   ```bash
   # Production Firebase Project
   VITE_FIREBASE_API_KEY=AIza...your-production-api-key
   VITE_FIREBASE_AUTH_DOMAIN=png-citizen-registration-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=png-citizen-registration-prod
   VITE_FIREBASE_STORAGE_BUCKET=png-citizen-registration-prod.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=G-YOUR-MEASUREMENT-ID
   ```

3. **Configure Production Settings:**
   ```bash
   # Environment
   NODE_ENV=production
   VITE_ENVIRONMENT=production
   VITE_USE_FIREBASE_EMULATOR=false

   # Security
   VITE_ENABLE_DEV_TOOLS=false
   VITE_ENABLE_CONSOLE_LOGS=false

   # Performance
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_PERFORMANCE_MONITORING=true
   VITE_ENABLE_ERROR_REPORTING=true

   # PNG Government Settings
   VITE_ORGANIZATION_NAME="Independent State of Papua New Guinea"
   VITE_DEPARTMENT_NAME="Census & Electoral Commission"
   VITE_SYSTEM_VERSION="4.0"
   VITE_DEPLOYMENT_REGION="Pacific/Port_Moresby"
   ```

#### 2.2 Configure Custom Domain

**Firebase Hosting:**
1. Go to Firebase Console > Hosting
2. Add custom domain: `census.gov.pg`
3. Follow DNS verification steps
4. Enable SSL certificate (automatic)

### Phase 3: User Management Setup

#### 3.1 Create Initial Administrator Account

Since this system uses role-based authentication, you need to create the first admin account:

**Option A: Firebase Console**
1. Go to Authentication > Users
2. Add user manually with admin email
3. Note: You'll need to set custom claims via Cloud Functions (see below)

**Option B: Firebase CLI (Recommended)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Cloud Functions for user management
firebase deploy --only functions
```

#### 3.2 Set Up Cloud Functions for User Management

Create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setUserClaims = functions.https.onCall(async (data, context) => {
  // Only allow admins to set user claims
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user claims');
  }

  const { uid, claims } = data;

  await admin.auth().setCustomUserClaims(uid, claims);

  return { success: true };
});

exports.createInitialAdmin = functions.https.onCall(async (data, context) => {
  const { email, password, displayName, province } = data;

  try {
    // Create user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });

    // Set admin claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      province: province,
      permissions: [
        'read:all_citizens',
        'write:all_citizens',
        'delete:citizens',
        'manage:users',
        'manage:backups',
        'view:statistics',
        'export:data',
        'manage:system'
      ]
    });

    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'admin',
      province,
      permissions: [
        'read:all_citizens',
        'write:all_citizens',
        'delete:citizens',
        'manage:users',
        'manage:backups',
        'view:statistics',
        'export:data',
        'manage:system'
      ],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

**Deploy Cloud Functions:**
```bash
cd functions
npm install firebase-admin firebase-functions
cd ..
firebase deploy --only functions
```

#### 3.3 Create First Admin User

Use the Firebase Console or call the Cloud Function:
```bash
# Create initial admin account
curl -X POST https://your-region-png-citizen-registration-prod.cloudfunctions.net/createInitialAdmin \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "admin@census.gov.pg",
      "password": "SecureAdminPassword123!",
      "displayName": "System Administrator",
      "province": "National Capital District"
    }
  }'
```

### Phase 4: Deployment

#### 4.1 Build for Production

```bash
# Install dependencies
bun install

# Build production bundle
bun run build

# Test production build locally
bun run preview
```

#### 4.2 Deploy to Netlify

**Automated Deployment (Recommended):**
1. Connect your repository to Netlify
2. Set build command: `bun run build`
3. Set publish directory: `dist`
4. Add environment variables from `.env.production`

**Manual Deployment:**
```bash
# Build and deploy
bun run build
zip -r9 production-deploy.zip dist/
# Upload to Netlify via dashboard
```

#### 4.3 Deploy to Firebase Hosting (Alternative)

```bash
# Initialize Firebase hosting
firebase init hosting

# Build and deploy
bun run build
firebase deploy --only hosting
```

### Phase 5: Post-Deployment Configuration

#### 5.1 Verify System Health

Access your deployed system and verify:
- [ ] Login page loads correctly
- [ ] Admin login works
- [ ] User management accessible
- [ ] Citizen registration form loads
- [ ] Offline functionality works
- [ ] Firebase connection successful

#### 5.2 Create Provincial User Accounts

For each PNG province, create enumerator and viewer accounts:

**Enumerator Account (per province):**
```javascript
{
  email: "enumerator.morobe@census.gov.pg",
  role: "enumerator",
  province: "Morobe",
  permissions: ["read:province_citizens", "write:province_citizens"]
}
```

**Viewer Account (per province):**
```javascript
{
  email: "viewer.morobe@census.gov.pg",
  role: "viewer",
  province: "Morobe",
  permissions: ["read:province_citizens"]
}
```

#### 5.3 Configure Backup Schedule

Set up automated backups using Firebase Cloud Functions:

```javascript
exports.scheduledBackup = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const backup = require('./backup-service');
  await backup.createAutomaticBackup();
});
```

### Phase 6: Security Hardening

#### 6.1 Configure API Key Restrictions

In Google Cloud Console > APIs & Services > Credentials:
1. Restrict Firebase API key to your domain only
2. Limit to specific Firebase services
3. Set up IP restrictions if needed

#### 6.2 Enable App Check

```bash
# Enable App Check for additional security
firebase appcheck:apps:register --platform web
```

#### 6.3 Set Up Monitoring

**Firebase Performance Monitoring:**
- Automatically enabled with Analytics
- Monitor load times, network requests

**Error Reporting:**
- Configure Sentry or Firebase Crashlytics
- Set up alert thresholds

#### 6.4 Configure Firestore Security

Review and tighten Firestore rules:
- Ensure province-based data isolation
- Validate all write operations
- Implement rate limiting

### Phase 7: Training and Documentation

#### 7.1 Field Enumerator Training

Create training materials covering:
- System login and navigation
- Citizen registration process
- Biometric capture procedures
- Offline operation
- Data synchronization
- Troubleshooting common issues

#### 7.2 Administrator Training

Document admin procedures:
- User account management
- Data backup and restore
- System monitoring
- Security best practices

#### 7.3 Technical Documentation

Maintain documentation for:
- System architecture
- Database schema
- API endpoints
- Deployment procedures
- Troubleshooting guide

## 🚀 Go-Live Checklist

Before going live with the production system:

### Technical Verification
- [ ] All Firebase services configured and tested
- [ ] Security rules implemented and tested
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Environment variables set correctly
- [ ] User authentication working
- [ ] Role-based access control verified
- [ ] Backup system operational
- [ ] Performance monitoring active

### User Readiness
- [ ] Admin accounts created and tested
- [ ] Provincial user accounts configured
- [ ] Field staff trained on system use
- [ ] Admin staff trained on user management
- [ ] Support procedures documented
- [ ] Emergency contacts established

### Data Protection
- [ ] Data retention policies defined
- [ ] Backup verification completed
- [ ] Security audit completed
- [ ] Privacy compliance verified
- [ ] Data access logging enabled

## 🆘 Support and Troubleshooting

### Common Issues

**Authentication Problems:**
- Verify Firebase API key configuration
- Check custom domain settings
- Ensure HTTPS is enabled

**Performance Issues:**
- Monitor Firebase usage quotas
- Optimize Firestore queries
- Enable performance monitoring

**Sync Problems:**
- Check network connectivity
- Verify Firestore security rules
- Monitor Firebase console for errors

### Support Contacts

- **Technical Support:** support@census.gov.pg
- **System Administrator:** admin@census.gov.pg
- **Emergency Contact:** +675-XXX-XXXX

### Monitoring and Maintenance

**Regular Tasks:**
- Weekly backup verification
- Monthly security review
- Quarterly performance optimization
- Annual system update

**Emergency Procedures:**
- System outage response
- Data recovery procedures
- Security incident handling
- User lockout resolution

## 📞 Emergency Response

In case of system emergencies:

1. **Contact technical support immediately**
2. **Document the issue with screenshots**
3. **Check Firebase console for service status**
4. **Implement fallback procedures if needed**
5. **Communicate status to field teams**

---

**System Version:** 4.0
**Last Updated:** January 22, 2025
**Next Review:** April 22, 2025

*This system is designed to serve the people of Papua New Guinea with reliable, secure, and accessible citizen registration services.*
