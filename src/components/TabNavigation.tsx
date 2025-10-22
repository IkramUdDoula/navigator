import { List, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type TabType = 'issues' | 'iteration' | 'create-issue';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  issueCount?: number;
}

export function TabNavigation({ activeTab, onTabChange, issueCount }: TabNavigationProps) {
  const tabs = [
    { id: 'issues' as const, label: 'Issues', icon: List },
    { id: 'iteration' as const, label: 'Iteration', icon: Calendar },
    { id: 'create-issue' as const, label: 'Create Issue', icon: Plus },
  ];

  return (
    <div className="border-b bg-background">
      <div className="flex px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`px-4 py-3 rounded-none border-b-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary bg-muted/30' 
                  : 'border-transparent hover:bg-muted/50'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
              {tab.id === 'issues' && issueCount !== undefined && (
                <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                  {issueCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}