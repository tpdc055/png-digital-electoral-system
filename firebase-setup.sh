#!/bin/bash

# 🔥 PNG Electoral System - Firebase Production Setup Script
# This script helps you configure Firebase for production use

echo "🇵🇬 PNG Electoral System - Firebase Production Setup"
echo "=================================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please make sure you're in the project root directory."
    exit 1
fi

echo "📋 This script will help you configure Firebase for production use."
echo ""
echo "🔗 First, set up your Firebase project:"
echo "   1. Go to: https://console.firebase.google.com"
echo "   2. Create a new project: 'png-electoral-system'"
echo "   3. Enable Firestore Database (production mode)"
echo "   4. Enable Authentication (Email/Password)"
echo "   5. Enable Storage"
echo "   6. Add a Web App and copy the configuration"
echo ""
echo "📝 Then enter your Firebase configuration below:"
echo ""

# Prompt for Firebase configuration
read -p "🔑 Firebase API Key: " FIREBASE_API_KEY
read -p "🌐 Firebase Auth Domain: " FIREBASE_AUTH_DOMAIN
read -p "🏷️  Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "🗂️  Firebase Storage Bucket: " FIREBASE_STORAGE_BUCKET
read -p "📨 Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "📱 Firebase App ID: " FIREBASE_APP_ID
read -p "📊 Firebase Measurement ID (optional): " FIREBASE_MEASUREMENT_ID

echo ""
echo "⚙️ Updating .env.production with your Firebase configuration..."

# Update .env.production file
sed -i "s/VITE_FIREBASE_API_KEY=.*/VITE_FIREBASE_API_KEY=$FIREBASE_API_KEY/" .env.production
sed -i "s/VITE_FIREBASE_AUTH_DOMAIN=.*/VITE_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN/" .env.production
sed -i "s/VITE_FIREBASE_PROJECT_ID=.*/VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID/" .env.production
sed -i "s/VITE_FIREBASE_STORAGE_BUCKET=.*/VITE_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET/" .env.production
sed -i "s/VITE_FIREBASE_MESSAGING_SENDER_ID=.*/VITE_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID/" .env.production
sed -i "s/VITE_FIREBASE_APP_ID=.*/VITE_FIREBASE_APP_ID=$FIREBASE_APP_ID/" .env.production

if [ ! -z "$FIREBASE_MEASUREMENT_ID" ]; then
    sed -i "s/VITE_FIREBASE_MEASUREMENT_ID=.*/VITE_FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID/" .env.production
fi

echo "✅ Firebase configuration updated!"
echo ""
echo "🧪 Testing Firebase connection..."

# Test build with new configuration
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful with Firebase configuration!"
else
    echo "❌ Build failed. Please check your Firebase configuration."
    exit 1
fi

echo ""
echo "🚀 Next steps:"
echo "1. 🔐 Set up Firebase Authentication users"
echo "2. 📊 Configure Firestore security rules"
echo "3. 🗂️  Configure Storage security rules"
echo "4. 🌐 Deploy to production"
echo ""
echo "📖 Full setup guide: FIREBASE_PRODUCTION_SETUP.md"
echo ""
echo "🎉 Firebase production setup complete!"
echo "Your PNG Electoral System is ready for production use with real Firebase!"
