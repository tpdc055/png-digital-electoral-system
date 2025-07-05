import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Shield } from 'lucide-react';

import { LoginForm } from './components/LoginForm';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { authService, type AuthState } from './services/authService';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = authService.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  // Show loading screen while checking authentication
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center relative">
        {/* Traditional PNG Pattern Background */}
        <div className="traditional-pattern-bg" />

        <Card className="w-full max-w-md shadow-2xl border-2 border-yellow-400 relative z-10">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="png-logo rounded-full border-4 border-yellow-400 shadow-lg" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🇵🇬 PNG Census System
            </h2>
            <div className="flex items-center justify-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-semibold text-gray-700">
                Initializing System...
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Establishing secure connection and verifying credentials
            </p>
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Secure Government Portal
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication error if any
  if (authState.error && !authState.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center relative">
        {/* Traditional PNG Pattern Background */}
        <div className="traditional-pattern-bg" />

        <Card className="w-full max-w-md shadow-2xl border-2 border-red-400 relative z-10">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="png-logo rounded-full border-4 border-red-400 shadow-lg opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              🇵🇬 System Error
            </h2>
            <p className="text-red-600 mb-6">
              {authState.error}
            </p>
            <p className="text-gray-600 text-sm">
              Please contact IT support if this problem persists.
            </p>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!authState.user) {
    return (
      <>
        <LoginForm
          onLoginSuccess={() => {
            // Authentication state will be updated automatically by the auth service
            console.log('Login successful');
          }}
        />
        <Toaster />
      </>
    );
  }

  // Show authenticated app if user is logged in
  return (
    <>
      <AuthenticatedApp />
      <Toaster />
    </>
  );
}

export default App;
