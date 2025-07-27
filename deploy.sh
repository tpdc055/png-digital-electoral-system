#!/bin/bash

# 🇵🇬 PNG Digital Electoral System - Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🇵🇬 PNG Digital Electoral System - Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Starting deployment process..."

# Check for required tools
print_info "Checking required tools..."

if command -v bun >/dev/null 2>&1; then
    print_status "Bun found: $(bun --version)"
    PKG_MANAGER="bun"
elif command -v npm >/dev/null 2>&1; then
    print_status "npm found: $(npm --version)"
    PKG_MANAGER="npm"
else
    print_error "Neither bun nor npm found. Please install one of them."
    exit 1
fi

# Check Node.js version
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ or Bun."
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi
print_status "Dependencies installed successfully"

# Run linting
print_info "Running code quality checks..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun run lint:check || print_warning "Linting issues found, but continuing..."
else
    npm run lint:check || print_warning "Linting issues found, but continuing..."
fi

# Build for production
print_info "Building for production..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun run build:prod
else
    npm run build:prod
fi
print_status "Production build completed"

# Check build output
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist | cut -f1)
    print_status "Build successful! Size: $BUILD_SIZE"

    # List key files
    print_info "Build contents:"
    ls -la dist/
else
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Build PWA
print_info "Building PWA version..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun run pwa:build
else
    npm run pwa:build
fi
print_status "PWA build completed"

echo ""
echo "🎉 Deployment preparation complete!"
echo "=================================================="
print_status "Your PNG Digital Electoral System is ready for deployment!"
echo ""
print_info "Next steps:"
echo "1. 📂 Create a GitHub repository"
echo "2. 🚀 Deploy to Vercel (recommended)"
echo "3. 📱 Test PWA installation"
echo "4. 🔐 Configure environment variables"
echo ""
print_info "Quick deployment options:"
echo ""
echo "🌐 Vercel (Recommended):"
echo "   1. Go to https://vercel.com"
echo "   2. Connect your GitHub repository"
echo "   3. Build command: bun run build"
echo "   4. Output directory: dist"
echo "   5. Install command: bun install"
echo ""
echo "🔥 Firebase:"
echo "   1. Install Firebase CLI: npm install -g firebase-tools"
echo "   2. Login: firebase login"
echo "   3. Deploy: firebase deploy"
echo ""
echo "📱 Mobile PWA:"
echo "   - Your app is PWA-ready!"
echo "   - Users can install from browser"
echo "   - Works offline completely"
echo ""
print_status "PNG Electoral System deployment script completed successfully! 🇵🇬"
