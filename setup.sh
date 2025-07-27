#!/bin/bash

# PNG Digital Electoral System - Quick Setup Script
# This script sets up the project for local development

echo "🇵🇬 PNG Digital Electoral Voting System - Setup Script"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"

    # Check Node.js version (need 18+)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $NODE_VERSION"
        print_status "Please update Node.js from https://nodejs.org"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check if Bun is installed (recommended)
print_status "Checking for Bun package manager..."
if command -v bun >/dev/null 2>&1; then
    BUN_VERSION=$(bun --version)
    print_success "Bun found: v$BUN_VERSION"
    PACKAGE_MANAGER="bun"
    INSTALL_CMD="bun install"
    RUN_CMD="bun run"
else
    print_warning "Bun not found. Using npm instead."
    print_status "For better performance, install Bun: curl -fsSL https://bun.sh/install | bash"
    PACKAGE_MANAGER="npm"
    INSTALL_CMD="npm install"
    RUN_CMD="npm run"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Verify this is the PNG Electoral System
if ! grep -q "png-digital-electoral-system" package.json; then
    print_warning "This doesn't appear to be the PNG Electoral System project."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
print_status "Installing dependencies with $PACKAGE_MANAGER..."
$INSTALL_CMD

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Set up environment file
print_status "Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from .env.example"
    else
        print_warning ".env.example not found. Creating basic .env.local..."
        cat > .env.local << EOF
# PNG Digital Electoral System - Development Environment
NODE_ENV=development
VITE_ENVIRONMENT=development
VITE_DEMO_MODE=true
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_CONSOLE_LOGS=true
EOF
        print_success "Created basic .env.local file"
    fi
else
    print_success ".env.local already exists"
fi

# Run type check
print_status "Running TypeScript type check..."
$RUN_CMD type-check

if [ $? -eq 0 ]; then
    print_success "TypeScript check passed"
else
    print_warning "TypeScript check failed (non-blocking for development)"
fi

# Run linter
print_status "Running code linter..."
$RUN_CMD lint:check

if [ $? -eq 0 ]; then
    print_success "Code linting passed"
else
    print_warning "Code linting found issues (can be fixed with: $RUN_CMD lint)"
fi

# Success message
echo ""
echo "🎉 Setup completed successfully!"
echo "================================="
print_success "PNG Digital Electoral System is ready for development"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: $RUN_CMD dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Login with demo credentials:"
echo "   - Admin: admin@demo.png / demo123"
echo "   - Enumerator: enumerator@demo.png / demo123"
echo ""
echo "📚 Documentation:"
echo "- Local Deployment Guide: LOCAL_DEPLOYMENT_GUIDE.md"
echo "- Deployment Checklist: DEPLOYMENT_CHECKLIST.md"
echo "- System Design: .same/system-design.md"
echo ""
echo "🇵🇬 Ready to serve Papua New Guinea's democratic future!"

# Ask if user wants to start the dev server
echo ""
read -p "Start the development server now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_status "Starting development server..."
    print_status "Press Ctrl+C to stop the server"
    echo ""
    $RUN_CMD dev
fi
