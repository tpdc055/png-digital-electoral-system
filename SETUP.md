# PNG Citizen Registration System - Setup Guide

## 🌟 **System Overview**

A comprehensive offline-first citizen registration system designed for Papua New Guinea census and electoral roll data collection. Features include:

- **📱 Tablet-Optimized UI**: Touch-friendly interface designed for field data collection
- **🔄 Offline-First Architecture**: Works without internet, syncs when online
- **☁️ Real-Time Cloud Sync**: Firebase Firestore integration with intelligent sync prompting
- **📸 Photo Capture**: Webcam integration for citizen photos
- **👆 Fingerprint Capture**: USB fingerprint scanner support via Web Serial API
- **📍 GPS Coordinates**: Automatic location capture
- **📊 Admin Dashboard**: Statistics, filtering, search, and CSV export
- **🇵🇬 PNG-Specific**: All 21 provinces, local governments, and cultural data

---

## 🚀 **Quick Start**

### 1. **Clone and Install**
```bash
# Clone the project
git clone <repository-url>
cd png-citizen-registration

# Install dependencies
bun install

# Start development server
bun run dev
```

### 2. **Basic Usage (Offline Mode)**
- The system works immediately in offline mode
- Register citizens using the form
- Data is stored locally in IndexedDB
- View records in the Admin Dashboard

---

## ☁️ **Firebase Cloud Database Setup**

### 1. **Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: "PNG Citizen Registration"
3. Enable Firestore Database in production mode
4. Go to Project Settings > General > Your Apps
5. Copy the configuration object

### 2. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. **Firestore Security Rules**
```javascript
// Firestore Rules (Firebase Console > Firestore > Rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /citizens/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    match /connection-test/{document} {
      allow read: if true;
    }
  }
}
```

### 4. **Test Cloud Connection**
- Restart your development server
- The system will automatically detect Firebase availability
- Look for "Cloud Connected" status in the offline indicator
- Try registering a citizen and check Firestore Console

---

## 👆 **Fingerprint Scanner Setup**

### 1. **Browser Requirements**
- **Chrome 89+** or **Edge 89+** (Web Serial API support)
- **HTTPS required** (use localhost for development)

### 2. **Supported Hardware**
The system supports USB fingerprint scanners from:
- **Suprema** (0x16D1)
- **Upek TouchStrip** (0x147E)
- **AuthenTec** (0x08FF)
- **Validity Sensors** (0x138A)
- **STMicroelectronics** (0x0483)
- **And many others...**

### 3. **Connection Process**
1. Connect USB fingerprint scanner
2. Enable biometric consent in the form
3. Click "Connect Fingerprint Scanner"
4. Select device from browser dialog
5. Grant permissions
6. Place finger on scanner and capture

### 4. **Troubleshooting**
- **Device not detected**: Check USB connection and try different port
- **Permission denied**: Restart browser and try again
- **Capture timeout**: Ensure finger is properly placed on scanner
- **Browser not supported**: Use Chrome or Edge

---

## 📊 **Admin Dashboard Features**

### 1. **Statistics Overview**
- Total Citizens
- Synced vs Pending
- Eligible Voters
- Photos Captured
- Fingerprints Captured

### 2. **Advanced Filtering**
- Search by name, ID, or location
- Filter by province
- Filter by voter status
- Filter by sync status

### 3. **Data Export**
- CSV export with all citizen data
- Includes biometric status
- Filtered results only

### 4. **Sync Management**
- Manual sync controls
- Real-time sync status
- Error reporting

---

## 🔄 **Sync & Network Features**

### 1. **Automatic Sync**
- Detects network connectivity
- Tests Firebase connection
- Syncs unsynced records automatically
- Shows sync prompts when updates detected

### 2. **Intelligent Prompting**
- Prompts appear when:
  - Local records need uploading
  - Cloud has new updates
  - Network becomes available
- Manual sync controls available

### 3. **Conflict Resolution**
- Prevents duplicate records by National ID
- Last-write-wins for updates
- Error logging for failed syncs

---

## 📱 **Tablet Deployment**

### 1. **Hardware Requirements**
- **Android 9+** or **Windows 10+** tablet
- **4GB RAM minimum** (8GB recommended)
- **32GB storage minimum**
- **GPS capability**
- **Camera (front or rear)**
- **USB port** (for fingerprint scanner)

### 2. **Browser Setup**
- Install **Chrome** or **Edge**
- Enable location services
- Allow camera permissions
- Allow serial port access

### 3. **Offline Usage**
- Works completely offline
- Data stored locally until sync
- Battery optimized
- Touch-friendly interface

---

## 🛠️ **Development**

### 1. **Project Structure**
```
src/
├── components/          # React components
│   ├── CitizenRegistrationForm.tsx
│   ├── AdminDashboard.tsx
│   ├── CameraCapture.tsx
│   ├── FingerprintCapture.tsx
│   ├── OfflineIndicator.tsx
│   └── SyncPrompt.tsx
├── services/           # Business logic
│   ├── database.ts     # IndexedDB (Dexie)
│   ├── cloudSync.ts    # Firebase sync
│   ├── network.ts      # Network monitoring
│   ├── gps.ts         # GPS services
│   └── firebase.ts    # Firebase config
├── types/             # TypeScript definitions
│   └── citizen.ts
└── App.tsx           # Main application
```

### 2. **Build Commands**
```bash
# Development
bun run dev

# Production build
bun run build

# Lint code
bun run lint

# Type check
bun run type-check
```

### 3. **Environment Variables**
- **Development**: Uses demo Firebase config
- **Production**: Requires real Firebase credentials
- **Emulator**: Set `VITE_USE_FIREBASE_EMULATOR=true`

---

## 🔐 **Security Considerations**

### 1. **Data Protection**
- Biometric data stored as base64 encoded
- GPS coordinates for verification
- No sensitive data in localStorage
- HTTPS required for fingerprint access

### 2. **Firebase Security**
- Configure Firestore rules properly
- Enable authentication if needed
- Monitor usage and access logs
- Regular security audits

### 3. **Offline Security**
- Local data encrypted in IndexedDB
- No network transmission without consent
- Device-level security recommended

---

## 📞 **Support & Troubleshooting**

### Common Issues:

**1. Sync Failing**
- Check internet connection
- Verify Firebase configuration
- Check browser console for errors

**2. Fingerprint Not Working**
- Ensure Chrome/Edge browser
- Check USB device connection
- Grant serial port permissions

**3. Camera Access Denied**
- Enable camera permissions in browser
- Check device camera settings
- Try refreshing the page

**4. GPS Not Working**
- Enable location services
- Grant location permissions
- Try manual location entry

---

## 🎯 **Next Steps**

1. **Deploy to Production**: Set up Firebase project with real data
2. **User Training**: Train enumerators on tablet usage
3. **Hardware Setup**: Procure tablets and fingerprint scanners
4. **Data Migration**: Import existing citizen data if available
5. **Monitoring**: Set up analytics and error tracking

---

**🇵🇬 Ready for Papua New Guinea citizen registration!**
