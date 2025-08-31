import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Moon, Sun } from 'lucide-react';
import { GitLabCredentials } from '@/types/gitlab';

interface HeaderProps {
  credentials: GitLabCredentials;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  groupPath: string;
  onGroupPathChange: (path: string) => void;
}

export function Header({ 
  credentials, 
  onLogout, 
  theme,
  onThemeToggle,
  groupPath,
  onGroupPathChange
}: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-6 gap-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Navigator</h1>
        </div>
        
        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Group ID or Path:</span>
            <Input
              value={groupPath}
              onChange={(e) => onGroupPathChange(e.target.value)}
              placeholder="devsel"
              className="w-40"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}