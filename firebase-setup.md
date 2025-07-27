# Firebase Production Setup Guide

## 🔥 **Step 1: Create Firebase Project**

### 1.1 Create New Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Project name: `png-citizen-registration-prod`
4. Enable Google Analytics (recommended)
5. Select/create Analytics account
6. Click **"Create project"**

### 1.2 Enable Required Services
1. **Firestore Database**:
   - Go to **Firestore Database**
   - Click **"Create database"**
   - Choose **"Start in production mode"**
   - Select location: `asia-southeast1` (Singapore - closest to PNG)

2. **Authentication** (Optional but recommended):
   - Go to **Authentication**
   - Click **"Get started"**
   - Enable **Email/Password** provider

## 🔐 **Step 2: Configure Security Rules**

### 2.1 Firestore Security Rules
Go to **Firestore Database > Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Citizens collection - requires authentication for production
    match /citizens/{citizenId} {
      // Allow read/write for authenticated users only
      allow read, write: if request.auth != null;

      // Validate citizen data structure
      allow create: if request.auth != null
        && request.resource.data.keys().hasAll([
          'fullName', 'dateOfBirth', 'sex', 'province',
          'district', 'llg', 'village', 'nationalIdNumber'
        ])
        && request.resource.data.nationalIdNumber is string
        && request.resource.data.nationalIdNumber.size() > 0
        && request.resource.data.fullName is string
        && request.resource.data.fullName.size() > 0;

      // Allow updates only to the same document creator or admin
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.createdBy
            || request.auth.token.admin == true);
    }

    // Backup collection for disaster recovery
    match /backups/{backupId} {
      allow read, write: if request.auth != null
        && request.auth.token.admin == true;
    }

    // System metadata
    match /system/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.token.admin == true;
    }

    // Connection test endpoint
    match /connection-test/{testId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### 2.2 Storage Security Rules (if using Firebase Storage)
Go to **Storage > Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Photos and fingerprint data
    match /citizens/{citizenId}/{fileName} {
      allow read, write: if request.auth != null;
    }

    // Backup files
    match /backups/{fileName} {
      allow read, write: if request.auth != null
        && request.auth.token.admin == true;
    }
  }
}
```

## 🔑 **Step 3: Get Configuration**

### 3.1 Web App Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click **"Add app"** > **Web**
4. App nickname: `PNG Citizen Registration`
5. Check **"Also set up Firebase Hosting"**
6. Click **"Register app"**
7. Copy the configuration object

### 3.2 Service Account (for Admin Operations)
1. Go to **Project Settings > Service Accounts**
2. Click **"Generate new private key"**
3. Save the JSON file securely (for server-side operations)

## 🌍 **Step 4: Production Environment Setup**

### 4.1 Environment Variables
Create `.env.production`:

```bash
# Firebase Configuration - PRODUCTION
VITE_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=png-citizen-registration-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=png-citizen-registration-prod
VITE_FIREBASE_STORAGE_BUCKET=png-citizen-registration-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Production Settings
NODE_ENV=production
VITE_ENVIRONMENT=production
VITE_USE_FIREBASE_EMULATOR=false

# Optional: Enable Analytics
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4.2 Development Environment
Create `.env.development`:

```bash
# Firebase Configuration - DEVELOPMENT
VITE_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=png-citizen-registration-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=png-citizen-registration-dev
VITE_FIREBASE_STORAGE_BUCKET=png-citizen-registration-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Development Settings
NODE_ENV=development
VITE_ENVIRONMENT=development
VITE_USE_FIREBASE_EMULATOR=false
```

## 👥 **Step 5: User Management**

### 5.1 Create Admin Users
```javascript
// Admin user creation script (run once)
import { auth } from 'firebase-admin';

async function createAdminUser(email, password) {
  const user = await auth().createUser({
    email: email,
    password: password,
    displayName: 'PNG Census Administrator'
  });

  // Set admin custom claims
  await auth().setCustomUserClaims(user.uid, {
    admin: true,
    role: 'administrator'
  });

  console.log('Admin user created:', user.uid);
}

// Create enumerator user
async function createEnumeratorUser(email, password, province) {
  const user = await auth().createUser({
    email: email,
    password: password,
    displayName: `Enumerator - ${province}`
  });

  await auth().setCustomUserClaims(user.uid, {
    enumerator: true,
    province: province,
    role: 'enumerator'
  });

  console.log('Enumerator user created:', user.uid);
}
```

## 📊 **Step 6: Initial Data Setup**

### 6.1 Create System Collections
```javascript
// Initial Firestore setup
const initialData = {
  'system/metadata': {
    version: '1.0.0',
    created: new Date(),
    totalCitizens: 0,
    provinces: PNG_PROVINCES,
    lastBackup: null
  },
  'system/settings': {
    allowOfflineMode: true,
    requireBiometricConsent: true,
    maxPhotoSize: 5242880, // 5MB
    maxFingerprintSize: 1048576, // 1MB
    backupFrequency: 'daily'
  }
};
```

## 🚨 **Step 7: Security Checklist**

### 7.1 Production Security
- [ ] ✅ Firestore rules prevent unauthorized access
- [ ] ✅ Authentication required for all operations
- [ ] ✅ Admin-only operations properly restricted
- [ ] ✅ Data validation rules in place
- [ ] ✅ Backup access restricted to admins
- [ ] ✅ Environment variables secured
- [ ] ✅ API keys restricted to specific domains

### 7.2 Data Protection
- [ ] ✅ Biometric data encrypted
- [ ] ✅ Personal data access logged
- [ ] ✅ Regular security audits scheduled
- [ ] ✅ Backup and recovery procedures tested
- [ ] ✅ User training on data protection

## 🔧 **Step 8: Testing**

### 8.1 Test Checklist
1. **Authentication**:
   - [ ] Admin login works
   - [ ] Enumerator login works
   - [ ] Unauthorized access blocked

2. **Data Operations**:
   - [ ] Create citizen record
   - [ ] Update citizen record
   - [ ] Delete citizen record (admin only)
   - [ ] Backup creation

3. **Security**:
   - [ ] Invalid data rejected
   - [ ] Unauthorized writes blocked
   - [ ] Admin operations restricted

### 8.2 Performance Testing
- [ ] Large dataset handling (10,000+ citizens)
- [ ] Concurrent user access
- [ ] Offline sync performance
- [ ] Network interruption recovery

## 📞 **Support Contacts**

- **Firebase Console**: https://console.firebase.google.com
- **Firebase Documentation**: https://firebase.google.com/docs
- **Security Rules Documentation**: https://firebase.google.com/docs/firestore/security/rules-conditions

---

**🔥 Firebase production environment ready for PNG Citizen Registration!**
