# PNG Digital Electoral Voting System - Local Deployment Guide

## 🏗️ **Quick Setup for Local Development**

### **Prerequisites**
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **Bun** (Recommended) or npm
- **Git** for version control
- **VSCode** (Recommended editor)

### **1. Install Bun (Recommended Package Manager)**
```bash
# Install Bun (fast JavaScript runtime)
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun
```

### **2. Clone/Download the Project**

#### Option A: Download from Same.new
```bash
# If you have the project files locally, navigate to the directory
cd png-citizen-registration

# Initialize git repository
git init
git add .
git commit -m "Initial commit: PNG Digital Electoral Voting System"
```

#### Option B: Create Repository from Scratch
```bash
# Create new repository
mkdir png-electoral-system
cd png-electoral-system
git init

# Copy all files from your Same.new project to this directory
# Then:
git add .
git commit -m "Initial commit: PNG Digital Electoral Voting System"
```

### **3. Install Dependencies**
```bash
# Install all project dependencies
bun install

# Or if using npm
npm install
```

### **4. Environment Setup**
```bash
# Copy environment template
cp .env.example .env.local

# The .env.local file is already configured for local development
# No changes needed for basic local testing
```

### **5. Start Development Server**
```bash
# Start the development server
bun run dev

# Or using npm
npm run dev
```

### **6. Access the Application**
- **Local URL:** http://localhost:5173
- **Demo Credentials:**
  - Admin: `admin@demo.png` / `demo123`
  - Enumerator: `enumerator@demo.png` / `demo123`
  - Test User: `test@demo.png` / `test123`

---

## 🔧 **Development Environment Configuration**

### **VSCode Setup (Recommended)**

#### Install Extensions:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "biomejs.biome",
    "ms-vscode.vscode-json"
  ]
}
```

#### VSCode Settings:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### **Git Setup**
```bash
# Configure git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Create .gitignore (already included in project)
# Includes: node_modules, .env.local, dist, etc.
```

---

## 📁 **Project Structure Overview**

```
png-citizen-registration/
├── 📂 src/
│   ├── 📂 components/          # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AuthenticatedApp.tsx    # Main app layout
│   │   ├── CitizenRegistrationForm.tsx
│   │   ├── DigitalVotingBooth.tsx  # NEW: Voting interface
│   │   ├── CandidateManagement.tsx # NEW: Candidate management
│   │   └── AdminDashboard.tsx
│   ├── 📂 services/           # Business logic
│   │   ├── authService.ts
│   │   ├── database.ts
│   │   ├── electoralService.ts    # NEW: Electoral functionality
│   │   └── cloudSync.ts
│   ├── 📂 types/              # TypeScript definitions
│   │   ├── citizen.ts
│   │   └── electoral.ts          # NEW: Electoral types
│   └── 📂 lib/                # Utilities
├── 📂 public/                 # Static assets
├── 📂 .same/                  # Documentation
│   ├── system-design.md
│   ├── ui-mockups.md
│   └── todos.md
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 tailwind.config.js
└── 📄 README.md
```

---

## 🧪 **Testing the System Locally**

### **1. Basic Functionality Test**
```bash
# Start the server
bun run dev

# Test in browser:
# 1. Login with demo credentials
# 2. Register a test citizen
# 3. Test photo capture (allow camera access)
# 4. Try the voting interface
# 5. Test candidate management (admin only)
```

### **2. Electoral System Test**
1. **Login as Admin** (`admin@demo.png` / `demo123`)
2. **Go to "Manage Candidates" tab**
3. **Register test candidates** with photos and policies
4. **Switch to "Cast Vote" tab**
5. **Complete the voting workflow**

### **3. Offline Testing**
1. **Disconnect internet**
2. **Continue using the application**
3. **Register citizens offline**
4. **Reconnect and test sync**

---

## 🔨 **Development Commands**

```bash
# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run linter
bun run lint

# Format code
bun run format

# Type checking
bun run type-check
```

---

## 🐛 **Troubleshooting Common Issues**

### **Port Already in Use**
```bash
# If port 5173 is busy, Vite will automatically use next available port
# Check console output for actual URL
```

### **Camera Not Working**
- Ensure you're accessing via `localhost` or `https://`
- Allow camera permissions when prompted
- Test in Chrome/Edge for best compatibility

### **TypeScript Errors**
```bash
# Run type checker
bun run type-check

# Most errors are non-blocking for development
# Focus on runtime functionality first
```

### **Dependency Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm bun.lock  # or package-lock.json
bun install  # or npm install
```

---

## 📤 **Repository Setup Options**

### **Option 1: GitHub Repository**
```bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/yourusername/png-electoral-system.git
git branch -M main
git push -u origin main
```

### **Option 2: GitLab Repository**
```bash
git remote add origin https://gitlab.com/yourusername/png-electoral-system.git
git branch -M main
git push -u origin main
```

### **Option 3: Local Git Only**
```bash
# Keep as local repository for now
# Can add remote later when ready
```

---

## 🚀 **Next Steps After Local Setup**

1. **✅ Verify local deployment works**
2. **🔧 Complete remaining electoral features**
3. **🧪 Comprehensive testing**
4. **🌐 Production deployment setup**
5. **🔐 Security hardening**
6. **📊 Performance optimization**

---

## 📞 **Getting Help**

### **Development Issues**
- Check browser console for errors
- Review TypeScript compiler output
- Test in incognito mode if needed

### **System Features**
- Review documentation in `.same/` folder
- Test with different user roles
- Try offline/online scenarios

### **Ready for Next Phase**
Once local deployment is working:
1. **Report any issues**
2. **Confirm all features work**
3. **Ready to complete remaining electoral features**
4. **Plan production deployment**

---

## 🎯 **Current System Status**

### **✅ Implemented Features**
- Complete citizen registration system
- Digital voting booth with step-by-step process
- Candidate management interface
- Role-based authentication
- Offline-first architecture
- PNG cultural design and all 21 provinces

### **⏳ Remaining Features (Phase 2)**
- Constituency locking enforcement
- One-person-one-vote verification
- NID integration
- Blockchain vote recording
- Live results dashboard
- AI fraud detection

**Your system is ready for local development! Let me know when you have it running locally and we'll complete the remaining features together.** 🇵🇬🗳️
