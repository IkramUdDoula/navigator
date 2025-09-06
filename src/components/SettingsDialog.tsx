import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LabelColorSettings } from '@/components/LabelColorSettings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allLabels: string[];
}

type LabelColorConfig = Record<string, string>;

export function SettingsDialog({ isOpen, onClose, allLabels }: SettingsDialogProps) {
  const [savedLabelColors, setSavedLabelColors] = useLocalStorage<LabelColorConfig>('label-colors', {});
  const [tempLabelColors, setTempLabelColors] = useLocalStorage<LabelColorConfig>('temp-label-colors', {...savedLabelColors});

  const handleColorChange = (label: string, color: string) => {
    setTempLabelColors(prev => ({
      ...prev,
      [label]: color
    }));
  };

  const handleSave = () => {
    setSavedLabelColors(tempLabelColors);
    // Trigger hot reload by updating a timestamp in localStorage
    localStorage.setItem('label-colors-last-updated', Date.now().toString());
    onClose();
  };

  const handleCancel = () => {
    // Reset temp colors to saved colors
    setTempLabelColors({...savedLabelColors});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="labels" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="labels">Labels</TabsTrigger>
          </TabsList>
          <TabsContent value="labels">
            <LabelColorSettings 
              labels={allLabels}
              labelColors={tempLabelColors} 
              onColorChange={handleColorChange} 
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}