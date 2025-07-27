import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Construction } from 'lucide-react';

const UserManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-6 w-6" />
            User Management
          </CardTitle>
          <CardDescription>
            Advanced user management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Construction className="h-4 w-4" />
            <AlertDescription>
              User Management functionality is being developed.
              Please use the RBAC tab for role-based access control and user permission management.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
