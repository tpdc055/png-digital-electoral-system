import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  LogIn,
  User,
  Lock,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { authService, type LoginCredentials } from '../services/authService';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signIn(credentials);
      toast.success('Login successful');
      onLoginSuccess?.();
    } catch (error) {
      const errorMessage = authService.getError() || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center p-4 relative">
      {/* Traditional PNG Pattern Background */}
      <div className="traditional-pattern-bg" />

      <Card className="w-full max-w-md shadow-2xl border-2 border-yellow-400 relative z-10">
        <CardHeader className="text-center png-header rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="png-logo rounded-full border-4 border-yellow-400 shadow-lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">
            🇵🇬 PNG Census System
          </CardTitle>
          <p className="text-yellow-100 font-semibold">
            Authorized Personnel Only
          </p>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <Shield className="h-3 w-3 mr-1" />
              Secure Access
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@census.gov.pg"
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="png-form-field"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="png-form-field pr-10"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full png-button-primary text-lg font-bold py-3"
              disabled={isLoading || !credentials.email || !credentials.password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo Login Buttons for Easy Access */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-3 text-center">🧪 Demo Access</h4>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setCredentials({ email: 'admin@demo.png', password: 'demo123' });
                  setError(null);
                }}
                variant="outline"
                className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                disabled={isLoading}
              >
                <Shield className="h-4 w-4 mr-2" />
                Demo Admin Access
                <Badge variant="outline" className="ml-2 text-xs">Election Configuration</Badge>
              </Button>

              <Button
                onClick={() => {
                  setCredentials({ email: 'enumerator@demo.png', password: 'demo123' });
                  setError(null);
                }}
                variant="outline"
                className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2" />
                Demo Enumerator Access
              </Button>
            </div>
            <p className="text-xs text-yellow-600 mt-2 text-center">
              Click to auto-fill credentials, then press "Sign In"
            </p>
          </div>

          {/* System Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">System Access Levels:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-red-700 border-red-300">Admin</Badge>
                <span className="text-blue-700">Full system access & user management</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-orange-700 border-orange-300">Enumerator</Badge>
                <span className="text-blue-700">Data entry & provincial access</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-700 border-green-300">Viewer</Badge>
                <span className="text-blue-700">Read-only access to reports</span>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>For technical support, contact:</p>
            <p className="font-semibold text-blue-700">PNG Census IT Support</p>
            <p>📞 +675-XXX-XXXX | 📧 support@census.gov.pg</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
