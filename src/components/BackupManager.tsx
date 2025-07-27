import type React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Upload,
  RefreshCw,
  Shield,
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

import { backupService, type BackupMetadata, type BackupResult, type RestoreResult } from '../services/backup';

export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backupDescription, setBackupDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const backupList = await backupService.getBackupList();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
      toast.error('Failed to load backup list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFullBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const result: BackupResult = await backupService.createFullBackup(
        backupDescription || undefined
      );

      if (result.success) {
        toast.success(`Full backup created successfully! ${result.recordsBackedUp} records backed up.`);
        setBackupDescription('');
        await loadBackups();
      } else {
        toast.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Backup creation failed');
      console.error('Backup error:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleCreateIncrementalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const result: BackupResult = await backupService.createIncrementalBackup(
        backupDescription || undefined
      );

      if (result.success) {
        if (result.recordsBackedUp === 0) {
          toast.success('No unsynced records to backup');
        } else {
          toast.success(`Incremental backup created! ${result.recordsBackedUp} records backed up.`);
        }
        setBackupDescription('');
        await loadBackups();
      } else {
        toast.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Backup creation failed');
      console.error('Backup error:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFromBackup = async (backupId: string, replaceExisting = false) => {
    if (!confirm(`Are you sure you want to restore from this backup? ${replaceExisting ? 'This will replace existing records.' : 'Duplicate records will be skipped.'}`)) {
      return;
    }

    setIsRestoring(true);
    setSelectedBackup(backupId);

    try {
      const result: RestoreResult = await backupService.restoreFromBackup(backupId, replaceExisting);

      if (result.success) {
        let message = `Restore completed! ${result.recordsRestored} records restored`;
        if (result.duplicatesSkipped > 0) {
          message += `, ${result.duplicatesSkipped} duplicates skipped`;
        }
        if (result.errors.length > 0) {
          message += `, ${result.errors.length} errors occurred`;
        }
        toast.success(message);

        if (result.errors.length > 0) {
          console.error('Restore errors:', result.errors);
        }
      } else {
        toast.error('Restore failed');
      }
    } catch (error) {
      toast.error('Restore operation failed');
      console.error('Restore error:', error);
    } finally {
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  const handleExportBackup = async (backupId: string) => {
    try {
      await backupService.exportBackupToFile(backupId);
      toast.success('Backup file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export backup file');
      console.error('Export error:', error);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON backup file');
      return;
    }

    try {
      const result: RestoreResult = await backupService.importBackupFromFile(file);

      if (result.success) {
        let message = `Import completed! ${result.recordsRestored} records imported`;
        if (result.duplicatesSkipped > 0) {
          message += `, ${result.duplicatesSkipped} duplicates skipped`;
        }
        toast.success(message);
      } else {
        toast.error('Import failed');
      }
    } catch (error) {
      toast.error('Import operation failed');
      console.error('Import error:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backup-description">Backup Description (Optional)</Label>
            <Input
              id="backup-description"
              placeholder="Enter backup description..."
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCreateFullBackup}
              disabled={isCreatingBackup}
              className="flex-1"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Full Backup
            </Button>

            <Button
              onClick={handleCreateIncrementalBackup}
              disabled={isCreatingBackup}
              variant="outline"
              className="flex-1"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Incremental Backup
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Full Backup:</strong> Backs up all citizen records.
              <strong>Incremental:</strong> Only backs up unsynced records.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import/Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import/Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="backup-import">Import Backup File</Label>
              <Input
                id="backup-import"
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                ref={fileInputRef}
              />
            </div>
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Only import backup files from trusted sources. Duplicates will be automatically skipped.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Available Backups
          </CardTitle>
          <Button
            onClick={loadBackups}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Provinces</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatDate(backup.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            v{backup.version}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {backup.description || 'No description'}
                          <div className="text-xs text-gray-500 mt-1">
                            by {backup.createdBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.totalRecords} records
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(backup.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {backup.provinces.slice(0, 2).join(', ')}
                          {backup.provinces.length > 2 && (
                            <span> +{backup.provinces.length - 2} more</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => backup.id && handleRestoreFromBackup(backup.id, false)}
                            disabled={isRestoring && selectedBackup === backup.id}
                            variant="outline"
                            size="sm"
                          >
                            {isRestoring && selectedBackup === backup.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </Button>

                          <Button
                            onClick={() => backup.id && handleExportBackup(backup.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {backups.length}
              </div>
              <div className="text-sm text-gray-600">Total Backups</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {backups.reduce((sum, backup) => sum + backup.totalRecords, 0)}
              </div>
              <div className="text-sm text-gray-600">Records Backed Up</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatFileSize(backups.reduce((sum, backup) => sum + backup.fileSize, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
          </div>

          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Backups are automatically created daily and stored securely in the cloud.
              Regular backups ensure data safety in case of system failures.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
