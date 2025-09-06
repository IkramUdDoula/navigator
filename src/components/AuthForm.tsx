import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitLabCredentials } from '@/types/gitlab';

interface AuthFormProps {
  onCredentialsSubmit: (credentials: GitLabCredentials) => void;
  initialCredentials?: GitLabCredentials;
}

export function AuthForm({ onCredentialsSubmit, initialCredentials }: AuthFormProps) {
  const [credentials, setCredentials] = useState<GitLabCredentials>({
    host: initialCredentials?.host || 'https://gitlab.com',
    token: initialCredentials?.token || '',
    groupId: initialCredentials?.groupId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.host || !credentials.token || !credentials.groupId) {
      return;
    }
    
    onCredentialsSubmit(credentials);
  };

  const isValid = credentials.host && credentials.token && credentials.groupId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Navigator</CardTitle>
          <CardDescription>
            Enter your GitLab credentials to access analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host">GitLab Host</Label>
              <Input
                id="host"
                placeholder="https://gitlab.com"
                value={credentials.host}
                onChange={(e) => setCredentials(prev => ({ ...prev, host: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                value={credentials.token}
                onChange={(e) => setCredentials(prev => ({ ...prev, token: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupId">Group ID</Label>
              <Input
                id="groupId"
                placeholder="12345678"
                value={credentials.groupId}
                onChange={(e) => setCredentials(prev => ({ ...prev, groupId: e.target.value }))}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isValid}
            >
              Connect to GitLab
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}