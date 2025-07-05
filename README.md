# 🇵🇬 PNG Digital Electoral System

**Papua New Guinea Digital Electoral Voting System for 2027 National General Election**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://png-electoral-system.netlify.app)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-blue)](#mobile-app)
[![PWA](https://img.shields.io/badge/PWA-Enabled-orange)](#progressive-web-app)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🗳️ **Overview**

A comprehensive digital electoral management system designed specifically for Papua New Guinea's 2027 National General Election. Features include citizen registration, candidate management, digital voting, and real-time results with full offline capability.

### **🔥 Key Features**

- **🗳️ Digital Voting Booth** - 5-step secure voting process
- **👥 Citizen Registration** - Biometric citizen enrollment
- **📋 Candidate Management** - Complete candidate lifecycle
- **📱 Mobile Ready** - PWA and Android APK support
- **🌐 Offline First** - Works without internet connection
- **🔒 Enterprise Security** - Biometric authentication & encryption
- **🌍 Multi-Language** - English, Tok Pisin, Hiri Motu
- **🏛️ PNG Compliant** - Designed for PNG Electoral Commission

---

## 🚀 **Live Demo**

**🌐 Try the System:** [https://png-electoral-system.netlify.app](https://png-electoral-system.netlify.app)

### **Demo Credentials:**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@demo.png` | `demo123` | Full system access |
| **Enumerator** | `enumerator@demo.png` | `demo123` | Provincial registration |
| **Viewer** | `test@demo.png` | `test123` | Read-only access |

---

## 📱 **Mobile App**

### **Progressive Web App (PWA)**
- Install directly from browser (no app store needed)
- Works 100% offline
- Native app experience
- Perfect for remote PNG areas

### **Android APK**
- Native Android app available
- Google Play Store ready
- Direct APK distribution
- Enterprise deployment

**📖 [Complete Mobile Deployment Guide](MOBILE_DEPLOYMENT.md)**

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** components
- **Progressive Web App** (PWA) capabilities
- **Offline-first** architecture with IndexedDB

### **Mobile**
- **Capacitor** framework for native mobile apps
- **Android APK** generation
- **Camera**, **Geolocation**, **Biometric** plugins
- **Push notifications** support

### **Backend & Data**
- **Firebase** (Firestore, Auth, Storage)
- **IndexedDB** for offline storage via Dexie
- **Service Workers** for background sync
- **End-to-end encryption** for vote security

### **Security**
- **Biometric authentication** (fingerprint/face)
- **Role-based access control** (RBAC)
- **Audit trails** and logging
- **Cryptographic vote hashing**

---

## 🏗️ **Quick Start**

### **Prerequisites**
- **Node.js** 18+ or **Bun** runtime
- **Git** for version control
- **Android Studio** (for mobile development)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-username/png-electoral-system.git
cd png-electoral-system

# Install dependencies
bun install
# or: npm install

# Start development server
bun dev
# or: npm run dev
```

### **Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Configure your settings
# Edit .env.local with your Firebase credentials
```

---

## 🌐 **Deployment**

### **Web Deployment (Netlify/Vercel)**

```bash
# Build for production
bun run build:prod

# Deploy to Netlify (automatic with Git integration)
# Or upload dist/ folder manually
```

### **Mobile Deployment**

```bash
# Build mobile app
bun run build:mobile

# Generate Android APK
bun run build:android

# Open in Android Studio
bun run android:open
```

---

## 🗳️ **Electoral Features**

### **Digital Voting Process**
1. **👤 Voter Verification** - Biometric identity confirmation
2. **📝 Ballot Review** - Multi-language ballot display
3. **✅ Candidate Selection** - Touch-friendly candidate cards
4. **🔍 Vote Confirmation** - Secure vote review
5. **🎯 Vote Completion** - Cryptographic receipt generation

### **Candidate Management**
- Registration with eligibility verification
- Photo and document upload
- Policy platform management
- Multi-constituency support
- Approval workflow

### **Administration**
- Real-time dashboard and analytics
- User role management
- Data backup and export
- Audit trail monitoring
- Multi-province support

---

## 🔒 **Security Features**

### **Authentication**
- **Biometric login** (fingerprint, face recognition)
- **Multi-factor authentication** (MFA)
- **Role-based permissions** (Admin, Enumerator, Viewer)
- **Session management** with automatic logout

### **Vote Security**
- **End-to-end encryption** of all vote data
- **Cryptographic hashing** for vote integrity
- **Anonymous voting** with audit trails
- **Tamper detection** and validation

### **Data Protection**
- **PNG Data Protection Act** compliant
- **Offline data encryption** for remote areas
- **Secure backup** with multiple redundancy
- **GDPR-style** privacy controls

---

## 🌍 **Multi-Language Support**

| Language | Code | Usage |
|----------|------|-------|
| **English** | `en` | Primary interface |
| **Tok Pisin** | `tpi` | Ballot instructions |
| **Hiri Motu** | `ho` | Ballot instructions |

---

## 📊 **System Requirements**

### **Web Application**
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+)
- **JavaScript enabled**
- **Local storage** (for offline functionality)
- **Camera access** (for biometric features)

### **Mobile Application**
- **Android 7.0+** (API level 24+)
- **2GB RAM** minimum
- **1GB storage** for offline data
- **Camera** and **GPS** access
- **Fingerprint sensor** (recommended)

### **Network Requirements**
- **Offline capable** (works without internet)
- **Low bandwidth optimized** (for PNG internet conditions)
- **Automatic sync** when connection restored

---

## 🏛️ **PNG Electoral Commission Integration**

### **Compliance**
- ✅ **PNG Constitution** Article 50 (Right to Vote)
- ✅ **Organic Law on National and Local-level Government Elections**
- ✅ **PNG Data Protection Act** compliance
- ✅ **Electoral Commission regulations**

### **Provincial Support**
Supports all **21 PNG Provinces**:
- Central, Chimbu, Eastern Highlands, East New Britain
- East Sepik, Enga, Gulf, Hela, Jiwaka, Madang
- Manus, Milne Bay, Morobe, National Capital District
- New Ireland, Northern (Oro), Southern Highlands
- Western, Western Highlands, West New Britain, West Sepik

---

## 🛠️ **Development**

### **Project Structure**
```
png-electoral-system/
├── src/
│   ├── components/          # React components
│   ├── services/           # Business logic & APIs
│   ├── types/              # TypeScript definitions
│   └── styles/             # CSS and styling
├── public/                 # Static assets
├── android/               # Android app project
├── docs/                  # Documentation
└── deployment/           # Deployment configs
```

### **Available Scripts**

```bash
# Development
bun dev                    # Start dev server
bun build                  # Build for production
bun preview               # Preview production build

# Mobile
bun run build:mobile      # Build mobile app
bun run android:run       # Run on Android device
bun run android:build     # Build Android APK

# Quality
bun run lint             # Run linter
bun run type-check       # TypeScript checking
bun run test            # Run tests
```

---

## 📞 **Support & Contact**

### **PNG Electoral Commission**
- **Website:** [electoral.gov.pg](https://electoral.gov.pg)
- **Email:** support@electoral.gov.pg
- **Phone:** +675-XXX-XXXX
- **Address:** PNG Electoral Commission, Port Moresby

### **Technical Support**
- **Developer:** PNG Census IT Department
- **Email:** tech@census.gov.pg
- **Emergency:** +675-XXX-XXXX (24/7)

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**© 2025 Independent State of Papua New Guinea - Electoral Commission**

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow PNG Electoral Commission coding standards
- Ensure security compliance for electoral data
- Test thoroughly with offline scenarios
- Document all changes

---

## 🎯 **Roadmap**

### **Phase 1: Core System** ✅
- [x] Digital voting booth
- [x] Citizen registration
- [x] Candidate management
- [x] Mobile application

### **Phase 2: Enhanced Features** 🚧
- [ ] Blockchain vote verification
- [ ] Advanced analytics dashboard
- [ ] SMS vote notifications
- [ ] Paper ballot backup integration

### **Phase 3: 2027 Election** 🎯
- [ ] Province-wide deployment
- [ ] Training program rollout
- [ ] Live election monitoring
- [ ] Results publication system

---

## ⭐ **Star this Repository**

If this project helps with PNG's democratic process, please ⭐ star this repository!

**🇵🇬 Together, we're building the future of PNG democracy! 🗳️**

---

## 📸 **Screenshots**

### Digital Voting Booth
![Voting Process](docs/screenshots/voting-process.png)

### Candidate Management
![Candidate Management](docs/screenshots/candidate-management.png)

### Mobile Application
![Mobile App](docs/screenshots/mobile-app.png)

---

**🇵🇬 Papua New Guinea Digital Electoral System - Empowering Democracy Through Technology 🗳️**
