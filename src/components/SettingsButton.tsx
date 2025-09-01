import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { SettingsDialog } from '@/components/SettingsDialog';

interface SettingsButtonProps {
  allLabels: string[];
}

export function SettingsButton({ allLabels }: SettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>
      <SettingsDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        allLabels={allLabels}
      />
    </>
  );
}