import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

import type { VerificationSettings, VerifierRole } from '../types/citizen';
import { verificationService } from '../services/verificationService';

interface VerificationSettingsProps {
  onSettingsChange?: (settings: VerificationSettings) => void;
}

export const VerificationSettingsComponent: React.FC<VerificationSettingsProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<VerificationSettings>(
    verificationService.getSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalVerifiers: 0,
    activeVerifiers: 0,
    totalVerifications: 0,
    verificationsByRole: {} as Record<VerifierRole, number>
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const verificationStats = await verificationService.getVerificationStats();
      setStats(verificationStats);
    } catch (error) {
      console.error('Error loading verification stats:', error);
    }
  };

  const handleSettingChange = (key: keyof VerificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await verificationService.updateSettings(settings);
      toast.success('Verification settings updated successfully');

      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      await loadStats();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Community Verification Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure how community verification works for citizen registration
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Verification Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="verification-required" className="text-base font-medium">
                  Require Community Verification
                </Label>
                <p className="text-sm text-gray-600">
                  When enabled, citizens must be verified by a Pastor or Councilor before registration
                </p>
              </div>
              <Switch
                id="verification-required"
                checked={settings.verificationRequired}
                onCheckedChange={(checked) => handleSettingChange('verificationRequired', checked)}
              />
            </div>

            {!settings.verificationRequired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Community verification is disabled. All citizens will be registered without verification.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sub-settings (only show when verification is enabled) */}
          {settings.verificationRequired && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              {/* Allow Unverified Registration */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-unverified" className="font-medium">
                    Allow Registration Without Verification
                  </Label>
                  <p className="text-sm text-gray-600">
                    Enumerators can choose to skip verification and register citizens anyway
                  </p>
                </div>
                <Switch
                  id="allow-unverified"
                  checked={settings.allowUnverifiedRegistration}
                  onCheckedChange={(checked) => handleSettingChange('allowUnverifiedRegistration', checked)}
                />
              </div>

              {/* Require Verifier Fingerprint */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="require-fingerprint" className="font-medium">
                    Require Verifier Fingerprint
                  </Label>
                  <p className="text-sm text-gray-600">
                    Verifiers must provide their fingerprint to confirm their identity during verification
                  </p>
                </div>
                <Switch
                  id="require-fingerprint"
                  checked={settings.requireVerifierFingerprint}
                  onCheckedChange={(checked) => handleSettingChange('requireVerifierFingerprint', checked)}
                />
              </div>

              {/* Settings Warnings */}
              {settings.allowUnverifiedRegistration && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enumerators can skip verification. This may result in unverified citizen records.
                  </AlertDescription>
                </Alert>
              )}

              {!settings.requireVerifierFingerprint && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verifier fingerprint is not required. This reduces security but may speed up verification.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Verification Statistics
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Verifiers */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {stats.totalVerifiers}
              </div>
              <div className="text-sm text-blue-600">
                Total Verifiers
              </div>
            </div>

            {/* Active Verifiers */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {stats.activeVerifiers}
              </div>
              <div className="text-sm text-green-600">
                Active Verifiers
              </div>
            </div>

            {/* Total Verifications */}
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {stats.totalVerifications}
              </div>
              <div className="text-sm text-purple-600">
                Total Verifications
              </div>
            </div>

            {/* Verification Rate */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {stats.activeVerifiers > 0
                  ? Math.round(stats.totalVerifications / stats.activeVerifiers)
                  : 0
                }
              </div>
              <div className="text-sm text-orange-600">
                Avg per Verifier
              </div>
            </div>
          </div>

          {/* Verifications by Role */}
          {Object.keys(stats.verificationsByRole).length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Verifications by Role</h4>
              <div className="space-y-2">
                {Object.entries(stats.verificationsByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{role}</Badge>
                    </div>
                    <div className="font-medium">{count} verifications</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2">
              {settings.verificationRequired ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                Verification is {settings.verificationRequired ? 'enabled' : 'disabled'}
              </span>
            </div>

            {settings.verificationRequired && (
              <>
                <div className="flex items-center gap-2">
                  {stats.activeVerifiers > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {stats.activeVerifiers > 0
                      ? `${stats.activeVerifiers} active verifier(s) available`
                      : 'No active verifiers available'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {settings.requireVerifierFingerprint ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Info className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm">
                    Verifier fingerprint is {settings.requireVerifierFingerprint ? 'required' : 'optional'}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
